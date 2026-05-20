"use client";

import { useState } from "react";
import { Calendar, MoreHorizontal, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/article/status-badge";
import { PublishDialog } from "@/components/article/publish-dialog";
import type { Article } from "@/types";

function formatTime(iso: string): string {
  const date = new Date(iso);
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const h = date.getHours();
  const min = String(date.getMinutes()).padStart(2, "0");
  const period = h < 12 ? "上午" : "下午";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${m}/${d} ${period}${String(h12).padStart(2, "0")}:${min}`;
}

const COVER_GRADIENTS = [
  "from-blue-400 via-indigo-500 to-purple-600",
  "from-emerald-400 via-teal-500 to-cyan-600",
  "from-amber-400 via-orange-500 to-rose-500",
  "from-pink-400 via-fuchsia-500 to-purple-600",
  "from-sky-400 via-blue-500 to-indigo-600",
  "from-lime-400 via-emerald-500 to-teal-600",
];

export function ArticleCard({ article, index }: { article: Article; index: number }) {
  const gradient = COVER_GRADIENTS[index % COVER_GRADIENTS.length];
  const timestamp = article.publishedAt ?? article.scheduledAt ?? article.createdAt;
  const [publishOpen, setPublishOpen] = useState(false);

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-all hover:shadow-md">
      <div
        className={cn(
          "relative aspect-[16/9] w-full bg-gradient-to-br",
          gradient
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.3),transparent_50%)]" />
        <div className="absolute left-3 top-3">
          <StatusBadge status={article.status} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
          {article.title}
        </h3>

        <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
          {article.excerpt}
        </p>

        <div className="mt-auto flex items-center justify-between border-t pt-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="size-3.5" />
            <span className="tabular-nums">{formatTime(timestamp)}</span>
          </div>
          <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setPublishOpen(true)}
              title="發布"
            >
              <Send className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="size-7">
              <MoreHorizontal className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <PublishDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        articleId={article.id}
        articleTitle={article.title}
        defaultPlatforms={article.targetPlatforms}
      />
    </article>
  );
}
