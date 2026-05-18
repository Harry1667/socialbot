"use client";

import { useState } from "react";
import { LayoutDashboard, User, FileText, Image as ImageIcon, CalendarClock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Article, IdentityStats } from "@/types";
import { StatsCards } from "@/components/identity/stats-cards";
import { ArticleGrid } from "@/components/article/grid";

interface IdentityTabsProps {
  articles: Article[];
  stats: IdentityStats;
}

const TABS = [
  { id: "overview", label: "總覽", icon: LayoutDashboard },
  { id: "profile", label: "角色管理", icon: User },
  { id: "articles", label: "文章", icon: FileText, withCount: true },
  { id: "media", label: "媒體", icon: ImageIcon },
  { id: "schedule", label: "排程發文", icon: CalendarClock },
  { id: "analytics", label: "效果追蹤", icon: TrendingUp },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function IdentityTabs({ articles, stats }: IdentityTabsProps) {
  const [active, setActive] = useState<TabId>("overview");

  return (
    <div className="flex flex-col">
      <div className="border-b bg-background">
        <nav className="flex gap-1 overflow-x-auto px-4">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActive(tab.id)}
                className={cn(
                  "relative flex items-center gap-1.5 whitespace-nowrap px-3 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                {tab.label}
                {tab.withCount && (
                  <span
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
                      isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {articles.length}
                  </span>
                )}
                {isActive && (
                  <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-t-full bg-primary" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex-1 p-6">
        {active === "overview" && (
          <div className="flex flex-col gap-6">
            <StatsCards stats={stats} />
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">最近內容</h2>
              </div>
              <ArticleGrid articles={articles} />
            </div>
          </div>
        )}

        {active === "articles" && (
          <div className="flex flex-col gap-6">
            <StatsCards stats={stats} />
            <ArticleGrid articles={articles} />
          </div>
        )}

        {active !== "overview" && active !== "articles" && (
          <EmptyTab label={TABS.find((t) => t.id === active)!.label} />
        )}
      </div>
    </div>
  );
}

function EmptyTab({ label }: { label: string }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed text-center">
      <h3 className="text-sm font-medium">{label}</h3>
      <p className="mt-1 text-xs text-muted-foreground">此分頁尚未實作,敬請期待</p>
    </div>
  );
}
