import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publish } from "@/lib/publishers";
import { ensureFreshToken } from "@/lib/oauth";
import type { SocialPlatform } from "@prisma/client";

/**
 * POST /api/articles/[id]/publish
 * Body: { platforms?: SocialPlatform[] }  // 沒給就用 article.targetPlatforms
 *       { dryRun?: boolean }              // 強制 dry-run
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    platforms?: SocialPlatform[];
    dryRun?: boolean;
  };

  const article = await db.article.findUnique({
    where: { id },
    include: {
      identity: {
        include: {
          socialAccounts: { where: { isActive: true } },
        },
      },
    },
  });
  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  // 決定要發到哪些平台
  const targets: SocialPlatform[] =
    body.platforms && body.platforms.length > 0
      ? body.platforms
      : (article.targetPlatforms as SocialPlatform[]);

  if (targets.length === 0) {
    return NextResponse.json(
      { error: "未指定發布平台（platforms 或 article.targetPlatforms 必須有一個）" },
      { status: 400 }
    );
  }

  const accountByPlatform = new Map(
    article.identity.socialAccounts.map((a) => [a.platform, a])
  );

  // 並行發布到所有目標平台
  const results = await Promise.all(
    targets.map(async (platform) => {
      const account = accountByPlatform.get(platform);
      if (!account) {
        return {
          platform,
          ok: false,
          error: `沒綁定 ${platform}，先到人設頁連接帳號`,
        };
      }

      // 過期前自動 refresh（dry-run 跳過）
      let fresh = account;
      if (!body.dryRun) {
        try {
          fresh = await ensureFreshToken(account);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            platform,
            ok: false,
            error: `Token refresh 失敗：${msg}（請重新授權）`,
          };
        }
      }

      const out = await publish({
        platform,
        accessToken: body.dryRun ? "DRY_RUN" : fresh.accessToken,
        accountId: fresh.accountId,
        title: article.title,
        content: article.content,
        hashtags: article.hashtags,
        mediaUrls: article.coverImage ? [article.coverImage] : [],
      });

      // 寫入 PublishResult
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

  // 任一成功就標 PUBLISHED；全失敗標 FAILED
  const anySuccess = results.some((r) => r.ok);
  await db.article.update({
    where: { id },
    data: {
      status: anySuccess ? "PUBLISHED" : "FAILED",
      publishedAt: anySuccess ? new Date() : null,
    },
  });

  return NextResponse.json({
    articleId: id,
    results,
    summary: {
      total: results.length,
      success: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
    },
  });
}
