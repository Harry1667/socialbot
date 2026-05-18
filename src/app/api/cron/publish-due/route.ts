import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publish } from "@/lib/publishers";
import type { SocialPlatform } from "@prisma/client";

/**
 * GET /api/cron/publish-due
 *   外部 cron 打這個 endpoint，掃所有 scheduledAt <= now 且 status=SCHEDULED 的文章並發布
 *
 * 認證：Header `X-Cron-Secret: <CRON_SECRET>` 或 query `?secret=xxx`
 *
 * 建議 crontab（Oracle）：
 *   每分鐘一次:* * * * * curl -fsS -H "X-Cron-Secret: $CRON_SECRET" https://socialbot.looptw.com/api/cron/publish-due
 */
export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "CRON_SECRET 未設定" },
      { status: 503 }
    );
  }

  const headerSecret = req.headers.get("x-cron-secret");
  const querySecret = new URL(req.url).searchParams.get("secret");
  if (headerSecret !== expected && querySecret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const due = await db.article.findMany({
    where: { status: "SCHEDULED", scheduledAt: { lte: now } },
    include: {
      identity: {
        include: { socialAccounts: { where: { isActive: true } } },
      },
    },
    take: 20, // 一次最多處理 20 篇，避免單次跑太久
  });

  const report = [];
  for (const article of due) {
    const targets = article.targetPlatforms as SocialPlatform[];
    if (targets.length === 0) {
      await db.article.update({
        where: { id: article.id },
        data: { status: "FAILED" },
      });
      report.push({ articleId: article.id, error: "no targetPlatforms" });
      continue;
    }

    const accountByPlatform = new Map(
      article.identity.socialAccounts.map((a) => [a.platform, a])
    );

    const results = await Promise.all(
      targets.map(async (platform) => {
        const account = accountByPlatform.get(platform);
        if (!account) {
          await db.publishResult.create({
            data: {
              articleId: article.id,
              platform,
              status: "FAILED",
              errorMessage: `沒綁定 ${platform}`,
            },
          });
          return { platform, ok: false, error: "no account" };
        }

        const out = await publish({
          platform,
          accessToken: account.accessToken,
          accountId: account.accountId,
          title: article.title,
          content: article.content,
          hashtags: article.hashtags,
          mediaUrls: article.coverImage ? [article.coverImage] : [],
        });

        await db.publishResult.create({
          data: {
            articleId: article.id,
            platform,
            status: out.ok ? "SUCCESS" : "FAILED",
            externalId: out.externalId ?? null,
            externalUrl: out.externalUrl ?? null,
            errorMessage: out.error ?? null,
          },
        });
        return { platform, ...out };
      })
    );

    const anySuccess = results.some((r) => r.ok);
    await db.article.update({
      where: { id: article.id },
      data: {
        status: anySuccess ? "PUBLISHED" : "FAILED",
        publishedAt: anySuccess ? new Date() : null,
      },
    });

    report.push({ articleId: article.id, results });
  }

  return NextResponse.json({
    processedAt: now.toISOString(),
    count: due.length,
    report,
  });
}
