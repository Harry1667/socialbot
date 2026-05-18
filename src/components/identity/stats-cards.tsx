import { Clock, CheckCircle2, CalendarClock, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IdentityStats } from "@/types";

interface StatItem {
  label: string;
  value: number;
  icon: LucideIcon;
  accent: string;
}

export function StatsCards({ stats }: { stats: IdentityStats }) {
  const items: StatItem[] = [
    {
      label: "待審核",
      value: stats.pendingReview,
      icon: Clock,
      accent: "text-amber-600 bg-amber-50 dark:bg-amber-950/40",
    },
    {
      label: "已發布",
      value: stats.published,
      icon: CheckCircle2,
      accent: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      label: "排程中",
      value: stats.scheduled,
      icon: CalendarClock,
      accent: "text-sky-600 bg-sky-50 dark:bg-sky-950/40",
    },
    {
      label: "本週生成",
      value: stats.generatedThisWeek,
      icon: Sparkles,
      accent: "text-violet-600 bg-violet-50 dark:bg-violet-950/40",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <div className={cn("flex size-7 items-center justify-center rounded-md", item.accent)}>
                <Icon className="size-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
              {item.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}
