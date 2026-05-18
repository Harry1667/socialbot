import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Prisma, ArticleStatus } from "@prisma/client";

const STATUS_MAP: Record<string, ArticleStatus> = {
  draft: "DRAFT",
  pending_review: "PENDING_REVIEW",
  approved: "APPROVED",
  scheduled: "SCHEDULED",
  published: "PUBLISHED",
  failed: "FAILED",
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const identityId = searchParams.get("identityId");
  const identitySlug = searchParams.get("identitySlug");
  const statusParam = searchParams.get("status")?.toLowerCase();
  const limit = Math.min(Number(searchParams.get("limit") ?? 30), 100);
  const cursor = searchParams.get("cursor");

  const where: Prisma.ArticleWhereInput = {};
  if (identityId) where.identityId = identityId;
  if (identitySlug) where.identity = { slug: identitySlug };
  if (statusParam && STATUS_MAP[statusParam]) {
    where.status = STATUS_MAP[statusParam];
  }

  const articles = await db.article.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      identityId: true,
      title: true,
      excerpt: true,
      content: true,
      hashtags: true,
      status: true,
      scheduledAt: true,
      publishedAt: true,
      coverImage: true,
      targetPlatforms: true,
      createdAt: true,
    },
  });

  const hasMore = articles.length > limit;
  const items = hasMore ? articles.slice(0, -1) : articles;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({
    items: items.map((a) => ({
      ...a,
      excerpt: a.excerpt ?? a.content.slice(0, 120),
      content: undefined,
    })),
    nextCursor,
  });
}
