import { Sparkles, Globe } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HooksPage() {
  const hooks = await db.hookTemplate.findMany({
    orderBy: [{ usageCount: "desc" }, { createdAt: "desc" }],
    include: {
      identity: { select: { name: true, slug: true, avatarText: true } },
      _count: { select: { articles: true } },
    },
  });

  // 依 category 分組
  const grouped = hooks.reduce<Record<string, typeof hooks>>((acc, h) => {
    (acc[h.category] ??= []).push(h);
    return acc;
  }, {});
  const categories = Object.keys(grouped).sort();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Hook 模板庫</h1>
              <p className="text-sm text-muted-foreground">
                共 {hooks.length} 個模板（{categories.length} 個分類）
              </p>
            </div>
          </div>

          {hooks.length === 0 ? (
            <div className="rounded-xl border border-dashed py-16 text-center">
              <p className="text-sm font-medium">尚無 Hook 模板</p>
              <p className="mt-1 text-xs text-muted-foreground">
                執行 <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">npx tsx scripts/seed-hooks.ts</code> 載入預設模板
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {categories.map((cat) => (
                <section key={cat}>
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {cat}
                  </h2>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {grouped[cat].map((h) => (
                      <div
                        key={h.id}
                        className="rounded-lg border bg-card p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">{h.name}</span>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            {h.isGlobal ? (
                              <span className="inline-flex items-center gap-0.5">
                                <Globe className="size-2.5" />
                                全域
                              </span>
                            ) : h.identity ? (
                              <span>專屬：{h.identity.name}</span>
                            ) : null}
                            <span>·</span>
                            <span>用過 {h.usageCount}</span>
                          </div>
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
                          {h.template}
                        </p>
                        {h.variables.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {h.variables.map((v) => (
                              <span
                                key={v}
                                className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                              >
                                {v}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
