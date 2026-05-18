import { AppHeader } from "@/components/layout/app-header";
import { IdentitySidebar } from "@/components/identity/sidebar";
import { NewIdentityForm } from "@/components/identity/new-form";
import { db } from "@/lib/db";
import type { Identity } from "@/types";

export const dynamic = "force-dynamic";

export default async function NewIdentityPage() {
  const rows = await db.identity.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { articles: true } } },
  });

  const identities: Identity[] = rows.map((i) => ({
    id: i.id,
    slug: i.slug,
    name: i.name,
    description: i.description ?? "",
    avatarText: i.avatarText,
    avatarColor: i.avatarColor,
    isActive: i.isActive,
    articleCount: i._count.articles,
  }));

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <IdentitySidebar identities={identities} />
        <main className="flex-1 overflow-y-auto">
          <NewIdentityForm />
        </main>
      </div>
    </div>
  );
}
