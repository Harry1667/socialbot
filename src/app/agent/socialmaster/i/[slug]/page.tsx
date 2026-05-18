import { notFound } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { IdentitySidebar } from "@/components/identity/sidebar";
import { IdentityHeader } from "@/components/identity/header";
import { IdentityTabs } from "@/components/identity/tabs";
import { db } from "@/lib/db";
import type { Identity, Article, IdentityStats, ArticleStatus } from "@/types";

export const dynamic = "force-dynamic";

function toUiStatus(s: string): ArticleStatus {
  const map: Record<string, ArticleStatus> = {
    DRAFT: "draft",
    PENDING_REVIEW: "pending_review",
    APPROVED: "approved",
    SCHEDULED: "scheduled",
    PUBLISHED: "published",
    FAILED: "failed",
  };
  return map[s] ?? "draft";
}

export default async function IdentityDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [identityRow, identitiesRows] = await Promise.all([
    db.identity.findUnique({
      where: { slug },
      include: {
        articles: {
          orderBy: { createdAt: "desc" },
          take: 30,
        },
        _count: { select: { articles: true } },
      },
    }),
    db.identity.findMany({
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { articles: true } } },
    }),
  ]);

  if (!identityRow) notFound();

  const identity: Identity = {
    id: identityRow.id,
    slug: identityRow.slug,
    name: identityRow.name,
    description: identityRow.description ?? "",
    avatarText: identityRow.avatarText,
    avatarColor: identityRow.avatarColor,
    isActive: identityRow.isActive,
    articleCount: identityRow._count.articles,
  };

  const identities: Identity[] = identitiesRows.map((i) => ({
    id: i.id,
    slug: i.slug,
    name: i.name,
    description: i.description ?? "",
    avatarText: i.avatarText,
    avatarColor: i.avatarColor,
    isActive: i.isActive,
    articleCount: i._count.articles,
  }));

  const articles: Article[] = identityRow.articles.map((a) => ({
    id: a.id,
    identityId: a.identityId,
    title: a.title,
    excerpt: a.excerpt ?? a.content.slice(0, 120),
    status: toUiStatus(a.status),
    coverImage: a.coverImage ?? undefined,
    publishedAt: a.publishedAt?.toISOString(),
    scheduledAt: a.scheduledAt?.toISOString(),
    createdAt: a.createdAt.toISOString(),
    targetPlatforms: [],
    hashtags: a.hashtags,
  }));

  const stats: IdentityStats = {
    pendingReview: articles.filter((a) => a.status === "pending_review").length,
    published: articles.filter((a) => a.status === "published").length,
    scheduled: articles.filter((a) => a.status === "scheduled").length,
    generatedThisWeek: articles.filter((a) => {
      const week = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return new Date(a.createdAt).getTime() > week;
    }).length,
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <IdentitySidebar identities={identities} activeSlug={slug} />
        <main className="flex-1 overflow-y-auto">
          <IdentityHeader identity={identity} />
          <IdentityTabs articles={articles} stats={stats} identityId={identity.id} />
        </main>
      </div>
    </div>
  );
}
