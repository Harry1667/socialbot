import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getProvider,
  isProviderConfigured,
  exchangeCodeForToken,
  metaExchangeForLongLivedToken,
  threadsExchangeForLongLivedToken,
  twitterFetchUserInfo,
  threadsFetchUserInfo,
  metaListPages,
  type OAuthPlatform,
} from "@/lib/oauth";
import type { SocialPlatform } from "@prisma/client";

/**
 * GET /api/oauth/[platform]/callback
 *
 * OAuth callback：
 * 1. 驗證 state + CSRF cookie
 * 2. code → access_token（X 用 PKCE，Meta/Threads 用 client_secret）
 * 3. short-lived → long-lived token（Meta / Threads）
 * 4. 抓 user info，正確寫入 SocialAccount（Meta 會一次建多筆：每個 Page + 每個 IG）
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateB64 = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(
      new URL(`/agent/socialmaster?oauth_error=${errorParam}`, req.url)
    );
  }
  if (!code || !stateB64) {
    return NextResponse.json(
      { error: "缺少 code 或 state" },
      { status: 400 }
    );
  }

  // 驗證 state
  let state: { csrf: string; identityId: string; platform: string };
  try {
    state = JSON.parse(Buffer.from(stateB64, "base64url").toString());
  } catch {
    return NextResponse.json({ error: "state 格式錯誤" }, { status: 400 });
  }

  // 從 Cookie header 抓 csrf + pkce verifier
  const cookieHeader = req.headers.get("cookie") ?? "";
  const csrfCookie = cookieHeader.match(/oauth_csrf=([^;]+)/)?.[1];
  const pkceVerifier = cookieHeader.match(/oauth_pkce_verifier=([^;]+)/)?.[1];

  if (csrfCookie !== state.csrf) {
    return NextResponse.json({ error: "CSRF 驗證失敗" }, { status: 403 });
  }

  const provider = getProvider(platform as OAuthPlatform);
  if (!provider || !isProviderConfigured(provider)) {
    return NextResponse.json({ error: "Provider 未設定" }, { status: 503 });
  }

  try {
    // 1) code → access_token
    const tokens = await exchangeCodeForToken(provider, code, pkceVerifier);

    // 2) 各平台寫入 DB（分支處理）
    let createdCount = 0;
    switch (provider.platform) {
      case "twitter":
        createdCount = await saveTwitter(state.identityId, tokens);
        break;
      case "threads":
        createdCount = await saveThreads(state.identityId, tokens);
        break;
      case "meta":
        createdCount = await saveMeta(state.identityId, tokens);
        break;
    }

    // 3) 取 identity slug，導回設定頁
    const identity = await db.identity.findUnique({
      where: { id: state.identityId },
      select: { slug: true },
    });

    const redirectUrl = new URL(
      `/agent/socialmaster/i/${identity?.slug ?? ""}`,
      req.url
    );
    redirectUrl.searchParams.set("oauth_success", platform);
    redirectUrl.searchParams.set("accounts", String(createdCount));

    const res = NextResponse.redirect(redirectUrl);
    // 清掉 OAuth 暫用的 cookies
    res.cookies.delete("oauth_csrf");
    res.cookies.delete("oauth_pkce_verifier");
    return res;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "OAuth callback 失敗";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ============================================
// 各平台的 SocialAccount 寫入邏輯
// ============================================

async function saveTwitter(
  identityId: string,
  tokens: { accessToken: string; refreshToken?: string; expiresIn?: number }
): Promise<number> {
  const info = await twitterFetchUserInfo(tokens.accessToken);
  await upsertAccount({
    identityId,
    platform: "TWITTER",
    accountId: info.accountId,
    accountName: info.accountName,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
  });
  return 1;
}

async function saveThreads(
  identityId: string,
  tokens: { accessToken: string; refreshToken?: string; expiresIn?: number }
): Promise<number> {
  // Threads 換長期 token（60 天）
  const longLived = await threadsExchangeForLongLivedToken(tokens.accessToken);
  const info = await threadsFetchUserInfo(longLived.accessToken);
  await upsertAccount({
    identityId,
    platform: "THREADS",
    accountId: info.accountId,
    accountName: info.accountName,
    accessToken: longLived.accessToken,
    expiresIn: longLived.expiresIn,
  });
  return 1;
}

async function saveMeta(
  identityId: string,
  tokens: { accessToken: string; refreshToken?: string; expiresIn?: number }
): Promise<number> {
  // 1) 換 60 天 user token
  const longLivedUser = await metaExchangeForLongLivedToken(tokens.accessToken);

  // 2) 列出 Pages（含 IG 綁定）
  const pages = await metaListPages(longLivedUser.accessToken);
  if (pages.length === 0) {
    throw new Error(
      "Meta 授權成功但沒有任何 Page；請確認你管理至少一個粉專"
    );
  }

  // 3) 每個 Page 建一筆 FACEBOOK 記錄；有綁 IG 的再建一筆 INSTAGRAM
  let count = 0;
  for (const page of pages) {
    await upsertAccount({
      identityId,
      platform: "FACEBOOK",
      accountId: page.pageId,
      accountName: page.pageName,
      // Page token 不會過期，不存 refreshToken / expiresAt
      accessToken: page.pageAccessToken,
    });
    count++;

    if (page.instagramAccountId) {
      await upsertAccount({
        identityId,
        platform: "INSTAGRAM",
        accountId: page.instagramAccountId,
        accountName: page.instagramUsername
          ? `@${page.instagramUsername}`
          : `IG ${page.instagramAccountId}`,
        accessToken: page.pageAccessToken,
      });
      count++;
    }
  }
  return count;
}

// ============================================
// 共用 upsert 工具
// ============================================
interface UpsertInput {
  identityId: string;
  platform: SocialPlatform;
  accountId: string;
  accountName: string;
  accessToken: string;
  refreshToken?: string;
  /** 秒數，從現在算 */
  expiresIn?: number;
}

async function upsertAccount(input: UpsertInput) {
  const expiresAt = input.expiresIn
    ? new Date(Date.now() + input.expiresIn * 1000)
    : null;

  await db.socialAccount.upsert({
    where: {
      identityId_platform_accountId: {
        identityId: input.identityId,
        platform: input.platform,
        accountId: input.accountId,
      },
    },
    create: {
      identityId: input.identityId,
      platform: input.platform,
      accountId: input.accountId,
      accountName: input.accountName,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken ?? null,
      tokenExpiresAt: expiresAt,
    },
    update: {
      accountName: input.accountName,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken ?? null,
      tokenExpiresAt: expiresAt,
      isActive: true,
    },
  });
}
