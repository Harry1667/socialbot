import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import type { Identity } from "@/types";

interface IdentitySidebarProps {
  identities: Identity[];
  activeSlug?: string;
}

export function IdentitySidebar({ identities, activeSlug }: IdentitySidebarProps) {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-sidebar md:flex md:flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          身份清單
        </h2>
        <Button asChild variant="ghost" size="icon" className="size-7">
          <Link href="/agent/socialmaster/i/new">
            <Plus className="size-3.5" />
          </Link>
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2 pb-4">
        <ul className="flex flex-col gap-0.5">
          {identities.map((identity) => {
            const isActive = identity.slug === activeSlug;
            return (
              <li key={identity.id}>
                <Link
                  href={`/agent/socialmaster/i/${identity.slug}`}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-sidebar-foreground hover:bg-accent/60"
                  )}
                >
                  <div className="relative shrink-0">
                    <div
                      className={cn(
                        "flex size-9 items-center justify-center rounded-full text-sm font-semibold text-white",
                        identity.avatarColor
                      )}
                    >
                      {identity.avatarText}
                    </div>
                    <span
                      className={cn(
                        "absolute -right-0.5 -top-0.5 size-2.5 rounded-full ring-2 ring-sidebar",
                        identity.isActive ? "bg-emerald-500" : "bg-slate-400"
                      )}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{identity.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {identity.description}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground tabular-nums">
                    {identity.articleCount}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </ScrollArea>

      <div className="border-t p-3">
        <Button asChild variant="outline" className="w-full justify-start gap-2" size="sm">
          <Link href="/agent/socialmaster/i/new">
            <Plus className="size-4" />
            新增身份
          </Link>
        </Button>
      </div>
    </aside>
  );
}
