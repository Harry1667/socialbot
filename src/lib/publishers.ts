/**
 * 發布器（Publishers）
 * 每個社群平台一個 publisher，回傳統一格式
 *
 * 目前狀態：
 * - Twitter v2 / Threads / Facebook 都有「真實」實作骨架，但需要對應 OAuth token
 * - 沒 token 時走 dry-run，回傳假的 externalId / externalUrl 方便測流程
 */

import type { SocialPlatform } from "@prisma/client";
import { db } from "@/lib/db";

/**
 * X 每日發文 cap（防 pay-per-use 爆預算）
 * 預設 50，可用 X_DAILY_POST_CAP 環境變數覆寫；設 0 = 停用
 */
function getTwitterDailyCap(): number {
  const raw = process.env.X_DAILY_POST_CAP;
  if (!raw) return 50;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : 50;
}

/** 數今天（UTC）已 SUCCESS 的 X 發文數 */
async function countTwitterPostsToday(): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  return db.publishResult.count({
    where: {
      platform: "TWITTER",
      status: "SUCCESS",
      publishedAt: { gte: startOfDay },
    },
  });
}

export interface PublishInput {
  /** 目標平台 */
  platform: SocialPlatform;
  /** access token（從 SocialAccount.accessToken 取出） */
  accessToken: string;
  /** 平台帳號 ID（Twitter 不需要、FB Page 需要） */
  accountId: string;
  /** 文章內容 */
  title: string;
  content: string;
  hashtags: string[];
  /** 媒體 URL（圖片 / 影片） */
  mediaUrls?: string[];
}

export interface PublishOutput {
  ok: boolean;
  externalId?: string;
  externalUrl?: string;
  error?: string;
  /** 是否走 dry-run（沒真的呼叫平台 API） */
  dryRun?: boolean;
}

/** 統一發布入口 */
export async function publish(input: PublishInput): Promise<PublishOutput> {
  // 沒 token → 走 dry-run，方便本機測流程
  if (!input.accessToken || input.accessToken === "DRY_RUN") {
    return dryRun(input);
  }

  // X 每日發文 cap（pay-per-use 防爆）
  if (input.platform === "TWITTER") {
    const cap = getTwitterDailyCap();
    if (cap > 0) {
      const used = await countTwitterPostsToday();
      if (used >= cap) {
        return {
          ok: false,
          error: `已達 X 每日發文上限 ${cap} 篇（今日已 ${used} 篇），明日 00:00 UTC 重置`,
        };
      }
    }
  }

  try {
    switch (input.platform) {
      case "TWITTER":
        return await publishTwitter(input);
      case "THREADS":
        return await publishThreads(input);
      case "FACEBOOK":
        return await publishFacebook(input);
      case "INSTAGRAM":
        return await publishInstagram(input);
      case "LINKEDIN":
        return { ok: false, error: "LinkedIn publisher 尚未實作" };
      default:
        return { ok: false, error: `未支援的平台：${input.platform}` };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}

function formatBody(input: PublishInput): string {
  const tags = input.hashtags.length > 0 ? "\n\n" + input.hashtags.join(" ") : "";
  return input.content + tags;
}

function dryRun(input: PublishInput): PublishOutput {
  const fakeId = `dryrun_${input.platform.toLowerCase()}_${Date.now()}`;
  return {
    ok: true,
    dryRun: true,
    externalId: fakeId,
    externalUrl: `https://example.com/${input.platform.toLowerCase()}/${fakeId}`,
  };
}

// ============================================
// Twitter v2 — POST /2/tweets
// ============================================
async function publishTwitter(input: PublishInput): Promise<PublishOutput> {
  const res = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: formatBody(input).slice(0, 280) }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    return { ok: false, error: `Twitter ${res.status}: ${err}` };
  }
  const data = (await res.json()) as { data?: { id?: string } };
  const id = data.data?.id;
  return {
    ok: true,
    externalId: id,
    externalUrl: id ? `https://twitter.com/i/status/${id}` : undefined,
  };
}

// ============================================
// Threads — POST /v1.0/{user-id}/threads + publish
// ============================================
async function publishThreads(input: PublishInput): Promise<PublishOutput> {
  // Step 1: 建 container
  const params = new URLSearchParams({
    media_type: "TEXT",
    text: formatBody(input),
    access_token: input.accessToken,
  });
  const createRes = await fetch(
    `https://graph.threads.net/v1.0/${input.accountId}/threads?${params}`,
    { method: "POST" }
  );
  if (!createRes.ok) {
    const err = await createRes.text().catch(() => "");
    return { ok: false, error: `Threads create ${createRes.status}: ${err}` };
  }
  const { id: creationId } = (await createRes.json()) as { id?: string };
  if (!creationId) return { ok: false, error: "Threads: 未取得 creation_id" };

  // Step 2: publish
  const pubParams = new URLSearchParams({
    creation_id: creationId,
    access_token: input.accessToken,
  });
  const pubRes = await fetch(
    `https://graph.threads.net/v1.0/${input.accountId}/threads_publish?${pubParams}`,
    { method: "POST" }
  );
  if (!pubRes.ok) {
    const err = await pubRes.text().catch(() => "");
    return { ok: false, error: `Threads publish ${pubRes.status}: ${err}` };
  }
  const pubData = (await pubRes.json()) as { id?: string };
  return {
    ok: true,
    externalId: pubData.id,
    externalUrl: pubData.id ? `https://threads.net/post/${pubData.id}` : undefined,
  };
}

// ============================================
// Facebook Page — POST /{page-id}/feed
// ============================================
async function publishFacebook(input: PublishInput): Promise<PublishOutput> {
  const params = new URLSearchParams({
    message: formatBody(input),
    access_token: input.accessToken,
  });
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${input.accountId}/feed`,
    { method: "POST", body: params }
  );
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    return { ok: false, error: `Facebook ${res.status}: ${err}` };
  }
  const data = (await res.json()) as { id?: string };
  return {
    ok: true,
    externalId: data.id,
    externalUrl: data.id ? `https://facebook.com/${data.id}` : undefined,
  };
}

// ============================================
// Instagram — 兩步驟：建 container → publish
// IG 必須有圖片，純文字會被拒
// ============================================
async function publishInstagram(input: PublishInput): Promise<PublishOutput> {
  if (!input.mediaUrls?.[0]) {
    return { ok: false, error: "Instagram 發文必須附圖" };
  }
  // Step 1: container
  const params = new URLSearchParams({
    image_url: input.mediaUrls[0],
    caption: formatBody(input),
    access_token: input.accessToken,
  });
  const createRes = await fetch(
    `https://graph.facebook.com/v19.0/${input.accountId}/media`,
    { method: "POST", body: params }
  );
  if (!createRes.ok) {
    const err = await createRes.text().catch(() => "");
    return { ok: false, error: `IG container ${createRes.status}: ${err}` };
  }
  const { id: creationId } = (await createRes.json()) as { id?: string };
  if (!creationId) return { ok: false, error: "IG: 未取得 creation_id" };

  // Step 2: publish
  const pubParams = new URLSearchParams({
    creation_id: creationId,
    access_token: input.accessToken,
  });
  const pubRes = await fetch(
    `https://graph.facebook.com/v19.0/${input.accountId}/media_publish`,
    { method: "POST", body: pubParams }
  );
  if (!pubRes.ok) {
    const err = await pubRes.text().catch(() => "");
    return { ok: false, error: `IG publish ${pubRes.status}: ${err}` };
  }
  const pubData = (await pubRes.json()) as { id?: string };
  return {
    ok: true,
    externalId: pubData.id,
    externalUrl: pubData.id ? `https://instagram.com/p/${pubData.id}` : undefined,
  };
}
