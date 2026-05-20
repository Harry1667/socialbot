/**
 * OAuth 設定與工具
 *
 * - Provider 設定（X / Meta / Threads）
 * - PKCE 輔助（X 強制要求）
 * - Code → access_token 交換（各平台簽法不同）
 * - Short-lived → long-lived token 交換（Meta / Threads）
 * - User info 抓取 + Page / IG 帳號列舉
 * - Token refresh + ensureFreshToken（過期前自動換）
 */

import type { SocialAccount, SocialPlatform } from "@prisma/client";
import { db } from "@/lib/db";
import { randomBytes, createHash } from "crypto";

// ============================================
// Provider 設定
// ============================================
export type OAuthPlatform = "meta" | "threads" | "twitter";

export interface OAuthProvider {
  platform: OAuthPlatform;
  /** 主要對應的 DB enum（meta = FACEBOOK，但 callback 也會建 INSTAGRAM 紀錄） */
  dbEnum: SocialPlatform;
  label: string;
  authorizeUrl: string;
  tokenUrl: string;
  scope: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  /** 是否需要 PKCE（X 強制） */
  pkce: boolean;
}

function readEnv(key: string): string {
  return process.env[key] ?? "";
}

/**
 * Redirect URI 決定優先序：
 * 1. 環境變數明確指定（{PLATFORM}_REDIRECT_URI）→ 用這個
 * 2. 否則從 NEXT_PUBLIC_APP_URL 推導（本機 / 正式自動切換）
 */
function resolveRedirectUri(
  platform: OAuthPlatform,
  envKey: string
): string {
  const explicit = readEnv(envKey);
  if (explicit) return explicit;

  const base = readEnv("NEXT_PUBLIC_APP_URL").replace(/\/$/, "");
  if (!base) return "";
  return `${base}/api/oauth/${platform}/callback`;
}

export function getProvider(platform: OAuthPlatform): OAuthProvider | null {
  switch (platform) {
    case "meta":
      return {
        platform: "meta",
        dbEnum: "FACEBOOK",
        label: "Facebook / Instagram",
        authorizeUrl: "https://www.facebook.com/v19.0/dialog/oauth",
        tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
        scope:
          "pages_show_list,pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish",
        clientId: readEnv("META_APP_ID"),
        clientSecret: readEnv("META_APP_SECRET"),
        redirectUri: resolveRedirectUri("meta", "META_REDIRECT_URI"),
        pkce: false,
      };
    case "threads":
      return {
        platform: "threads",
        dbEnum: "THREADS",
        label: "Threads",
        authorizeUrl: "https://threads.net/oauth/authorize",
        tokenUrl: "https://graph.threads.net/oauth/access_token",
        scope: "threads_basic,threads_content_publish",
        clientId: readEnv("THREADS_APP_ID"),
        clientSecret: readEnv("THREADS_APP_SECRET"),
        redirectUri: resolveRedirectUri("threads", "THREADS_REDIRECT_URI"),
        pkce: false,
      };
    case "twitter":
      return {
        platform: "twitter",
        dbEnum: "TWITTER",
        label: "X (Twitter)",
        authorizeUrl: "https://twitter.com/i/oauth2/authorize",
        tokenUrl: "https://api.twitter.com/2/oauth2/token",
        scope: "tweet.read tweet.write users.read offline.access",
        clientId: readEnv("TWITTER_CLIENT_ID"),
        clientSecret: readEnv("TWITTER_CLIENT_SECRET"),
        redirectUri: resolveRedirectUri("twitter", "TWITTER_REDIRECT_URI"),
        pkce: true,
      };
    default:
      return null;
  }
}

export function isProviderConfigured(p: OAuthProvider | null): boolean {
  return !!(p && p.clientId && p.clientSecret && p.redirectUri);
}

// ============================================
// PKCE 輔助
// ============================================
export interface PkcePair {
  verifier: string;
  challenge: string;
}

/** 生成 PKCE code_verifier + code_challenge（S256） */
export function generatePkce(): PkcePair {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

/** 組 authorize URL，X 需要 PKCE 參數 */
export function buildAuthorizeUrl(
  provider: OAuthProvider,
  state: string,
  pkce?: PkcePair
): string {
  const params = new URLSearchParams({
    client_id: provider.clientId,
    redirect_uri: provider.redirectUri,
    scope: provider.scope,
    response_type: "code",
    state,
  });
  if (provider.pkce) {
    if (!pkce) throw new Error(`${provider.label} 需要 PKCE 但未提供`);
    params.set("code_challenge", pkce.challenge);
    params.set("code_challenge_method", "S256");
  }
  return `${provider.authorizeUrl}?${params.toString()}`;
}

// ============================================
// Token 交換
// ============================================
export interface TokenExchangeResult {
  accessToken: string;
  refreshToken?: string;
  /** 秒數，從現在算 */
  expiresIn?: number;
}

/**
 * 用 authorization code 換 access_token
 * - X：用 HTTP Basic Auth + PKCE verifier
 * - Meta / Threads：用 form body 帶 client_id + client_secret
 */
export async function exchangeCodeForToken(
  provider: OAuthProvider,
  code: string,
  codeVerifier?: string
): Promise<TokenExchangeResult> {
  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  };
  const body = new URLSearchParams({
    code,
    redirect_uri: provider.redirectUri,
    grant_type: "authorization_code",
  });

  if (provider.platform === "twitter") {
    // X 用 HTTP Basic Auth 傳 client_id:secret
    headers.Authorization =
      "Basic " +
      Buffer.from(`${provider.clientId}:${provider.clientSecret}`).toString(
        "base64"
      );
    body.set("client_id", provider.clientId);
    if (!codeVerifier) throw new Error("X token 交換缺少 code_verifier");
    body.set("code_verifier", codeVerifier);
  } else {
    body.set("client_id", provider.clientId);
    body.set("client_secret", provider.clientSecret);
  }

  const res = await fetch(provider.tokenUrl, {
    method: "POST",
    headers,
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${provider.label} token 交換失敗 ${res.status}: ${text}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };
  if (!data.access_token) {
    throw new Error(`${provider.label} 回傳沒有 access_token`);
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

// ============================================
// Short-lived → Long-lived token（Meta / Threads）
// ============================================

/** Meta 用 fb_exchange_token 換 60 天長期 user token */
export async function metaExchangeForLongLivedToken(
  shortToken: string
): Promise<TokenExchangeResult> {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: readEnv("META_APP_ID"),
    client_secret: readEnv("META_APP_SECRET"),
    fb_exchange_token: shortToken,
  });
  const url = `https://graph.facebook.com/v19.0/oauth/access_token?${params}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Meta long-lived token 交換失敗 ${res.status}: ${text}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    expires_in?: number;
  };
  return { accessToken: data.access_token, expiresIn: data.expires_in };
}

/** Threads 用 th_exchange_token 換 60 天長期 token */
export async function threadsExchangeForLongLivedToken(
  shortToken: string
): Promise<TokenExchangeResult> {
  const params = new URLSearchParams({
    grant_type: "th_exchange_token",
    client_secret: readEnv("THREADS_APP_SECRET"),
    access_token: shortToken,
  });
  const url = `https://graph.threads.net/access_token?${params}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Threads long-lived token 交換失敗 ${res.status}: ${text}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    expires_in?: number;
  };
  return { accessToken: data.access_token, expiresIn: data.expires_in };
}

// ============================================
// User info 抓取
// ============================================
export interface UserInfo {
  accountId: string;
  accountName: string;
}

/** X：GET /2/users/me */
export async function twitterFetchUserInfo(
  accessToken: string
): Promise<UserInfo> {
  const res = await fetch("https://api.twitter.com/2/users/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`X /users/me 失敗 ${res.status}: ${text}`);
  }
  const data = (await res.json()) as {
    data?: { id: string; username: string; name?: string };
  };
  if (!data.data?.id) throw new Error("X /users/me 回傳沒有 id");
  return {
    accountId: data.data.id,
    accountName: data.data.name
      ? `${data.data.name} (@${data.data.username})`
      : `@${data.data.username}`,
  };
}

/** Threads：GET /v1.0/me?fields=id,username */
export async function threadsFetchUserInfo(
  accessToken: string
): Promise<UserInfo> {
  const params = new URLSearchParams({
    fields: "id,username",
    access_token: accessToken,
  });
  const res = await fetch(`https://graph.threads.net/v1.0/me?${params}`);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Threads /me 失敗 ${res.status}: ${text}`);
  }
  const data = (await res.json()) as { id?: string; username?: string };
  if (!data.id) throw new Error("Threads /me 回傳沒有 id");
  return {
    accountId: data.id,
    accountName: data.username ? `@${data.username}` : data.id,
  };
}

// ============================================
// Meta Pages + Instagram 列舉
// ============================================
export interface MetaPage {
  pageId: string;
  pageName: string;
  /** Page 自己的長期 access_token（發 FB / IG 都用這個） */
  pageAccessToken: string;
  /** 該 Page 綁定的 IG Business Account ID（若有） */
  instagramAccountId?: string;
  instagramUsername?: string;
}

/** Meta：列出使用者管理的 Pages（含 Page token 和 IG 綁定） */
export async function metaListPages(
  userAccessToken: string
): Promise<MetaPage[]> {
  // 1) 抓使用者的所有 Pages
  const pagesParams = new URLSearchParams({
    fields: "id,name,access_token,instagram_business_account",
    access_token: userAccessToken,
  });
  const pagesRes = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts?${pagesParams}`
  );
  if (!pagesRes.ok) {
    const text = await pagesRes.text().catch(() => "");
    throw new Error(`Meta /me/accounts 失敗 ${pagesRes.status}: ${text}`);
  }
  const pagesData = (await pagesRes.json()) as {
    data?: Array<{
      id: string;
      name: string;
      access_token: string;
      instagram_business_account?: { id: string };
    }>;
  };
  const pages = pagesData.data ?? [];

  // 2) 對每個有綁 IG 的 Page，多打一次 /{ig_id}?fields=username 拿 IG 帳號名
  const enriched = await Promise.all(
    pages.map(async (p) => {
      const result: MetaPage = {
        pageId: p.id,
        pageName: p.name,
        pageAccessToken: p.access_token,
        instagramAccountId: p.instagram_business_account?.id,
      };
      if (result.instagramAccountId) {
        try {
          const igParams = new URLSearchParams({
            fields: "username",
            access_token: p.access_token,
          });
          const igRes = await fetch(
            `https://graph.facebook.com/v19.0/${result.instagramAccountId}?${igParams}`
          );
          if (igRes.ok) {
            const igData = (await igRes.json()) as { username?: string };
            result.instagramUsername = igData.username;
          }
        } catch {
          // 拿不到 IG username 不算致命錯，accountName 可以暫時 fallback
        }
      }
      return result;
    })
  );
  return enriched;
}

// ============================================
// Token refresh
// ============================================
export interface RefreshResult {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date | null;
}

/** X：用 refresh_token 換新 access_token（refresh 也會輪替） */
async function refreshTwitter(refreshToken: string): Promise<RefreshResult> {
  const clientId = readEnv("TWITTER_CLIENT_ID");
  const clientSecret = readEnv("TWITTER_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    throw new Error("X client_id / client_secret 未設定");
  }
  const res = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Authorization:
        "Basic " +
        Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`X refresh 失敗 ${res.status}: ${text}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000)
      : null,
  };
}

/**
 * Meta（FB Page Token）：Page token 是「永久」的，只要 user token 沒被撤銷就有效
 * 所以這裡其實沒事可做，回傳原 token；註解保留邏輯給未來換 endpoint 用
 */
async function refreshMeta(account: SocialAccount): Promise<RefreshResult> {
  // FB Page token 不會過期（除非使用者撤回授權或改密碼）
  // 真正會過期的是 user token；但我們存到 DB 的是 Page token（callback 已交換過）
  return {
    accessToken: account.accessToken,
    expiresAt: account.tokenExpiresAt,
  };
}

/** Threads：用 refresh_access_token endpoint 換新 60 天 token */
async function refreshThreads(accessToken: string): Promise<RefreshResult> {
  const params = new URLSearchParams({
    grant_type: "th_refresh_token",
    access_token: accessToken,
  });
  const res = await fetch(
    `https://graph.threads.net/refresh_access_token?${params}`
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Threads refresh 失敗 ${res.status}: ${text}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    expires_in?: number;
  };
  return {
    accessToken: data.access_token,
    expiresAt: data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000)
      : null,
  };
}

/**
 * 確保 token 還有效（剩餘 < 10 分鐘就主動 refresh）
 * - 會 in-place 更新 DB 的 SocialAccount
 * - 失敗會把 isActive 設 false，並丟錯讓上層處理
 */
export async function ensureFreshToken(
  account: SocialAccount
): Promise<SocialAccount> {
  const MIN_LIFETIME_MS = 10 * 60 * 1000; // 剩 10 分鐘就 refresh
  const needsRefresh =
    account.tokenExpiresAt &&
    account.tokenExpiresAt.getTime() - Date.now() < MIN_LIFETIME_MS;

  if (!needsRefresh) return account;

  try {
    let refreshed: RefreshResult;
    switch (account.platform) {
      case "TWITTER":
        if (!account.refreshToken) {
          throw new Error("X 帳號沒有 refresh_token，無法 refresh");
        }
        refreshed = await refreshTwitter(account.refreshToken);
        break;
      case "FACEBOOK":
      case "INSTAGRAM":
        refreshed = await refreshMeta(account);
        break;
      case "THREADS":
        refreshed = await refreshThreads(account.accessToken);
        break;
      default:
        // LINKEDIN 還沒實作
        return account;
    }
    return await db.socialAccount.update({
      where: { id: account.id },
      data: {
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken ?? account.refreshToken,
        tokenExpiresAt: refreshed.expiresAt,
      },
    });
  } catch (err) {
    // Refresh 失敗 → 標記 inactive，要使用者重新授權
    await db.socialAccount.update({
      where: { id: account.id },
      data: { isActive: false },
    });
    throw err;
  }
}
