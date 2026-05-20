"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// 對應 Prisma SocialPlatform enum（DB 存大寫值）
const PLATFORMS = [
  { id: "FACEBOOK", label: "Facebook", color: "bg-blue-600" },
  { id: "INSTAGRAM", label: "Instagram", color: "bg-pink-600" },
  { id: "THREADS", label: "Threads", color: "bg-zinc-900 dark:bg-zinc-200" },
  { id: "TWITTER", label: "Twitter / X", color: "bg-sky-500" },
  { id: "LINKEDIN", label: "LinkedIn", color: "bg-blue-700" },
] as const;

type PlatformId = (typeof PLATFORMS)[number]["id"];

interface PublishResult {
  platform: string;
  ok: boolean;
  externalId?: string;
  externalUrl?: string;
  error?: string;
  dryRun?: boolean;
}

interface PublishResponse {
  articleId: string;
  results: PublishResult[];
  summary: { total: number; success: number; failed: number };
}

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleId: string;
  articleTitle: string;
  defaultPlatforms?: string[];
}

export function PublishDialog({
  open,
  onOpenChange,
  articleId,
  articleTitle,
  defaultPlatforms,
}: PublishDialogProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<PlatformId[]>(
    () => normalizeDefaults(defaultPlatforms),
  );
  const [dryRun, setDryRun] = useState(true);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<PublishResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: PlatformId) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  function handleOpenChange(next: boolean) {
    if (loading) return;
    onOpenChange(next);
    if (!next) {
      // 關閉時重置結果（保留勾選）
      setResponse(null);
      setError(null);
    }
  }

  async function handlePublish() {
    if (selected.length === 0) {
      setError("請至少選一個平台");
      return;
    }
    setError(null);
    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch(`/api/articles/${articleId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platforms: selected, dryRun }),
      });

      const data = (await res.json().catch(() => ({}))) as
        | PublishResponse
        | { error?: string };

      if (!res.ok) {
        setError(
          (data as { error?: string }).error ?? `發布失敗 (${res.status})`,
        );
        return;
      }

      setResponse(data as PublishResponse);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知錯誤");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col gap-0 p-0">
        <DialogHeader className="border-b p-5">
          <DialogTitle className="flex items-center gap-2">
            <Send className="size-4 text-primary" />
            發布文章
          </DialogTitle>
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
            {articleTitle}
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5">
          {!response ? (
            <div className="flex flex-col gap-5">
              {/* 平台選擇 */}
              <div className="grid gap-2">
                <Label>目標平台</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PLATFORMS.map((p) => {
                    const active = selected.includes(p.id);
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => toggle(p.id)}
                        disabled={loading}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-all",
                          active
                            ? "border-foreground bg-foreground/5"
                            : "hover:bg-accent",
                        )}
                      >
                        <span className={cn("size-2.5 rounded-full", p.color)} />
                        <span className="font-medium">{p.label}</span>
                        {active && (
                          <CheckCircle2 className="ml-auto size-4 text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dry-run toggle */}
              <label
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3 transition-colors",
                  dryRun
                    ? "border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20"
                    : "border-rose-500/40 bg-rose-50/50 dark:bg-rose-950/20",
                )}
              >
                <input
                  type="checkbox"
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  disabled={loading}
                  className="mt-0.5 size-4"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    {dryRun ? (
                      <>
                        <AlertTriangle className="size-3.5 text-amber-600" />
                        Dry-run 模擬發布
                      </>
                    ) : (
                      <>
                        <Send className="size-3.5 text-rose-600" />
                        真實發布
                      </>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {dryRun
                      ? "不打 API、不消耗 token，僅驗證流程與 PublishResult 寫入"
                      : "立即發布到平台,需先綁定帳號"}
                  </p>
                </div>
              </label>

              {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <ResultList results={response.results} summary={response.summary} />
          )}
        </div>

        <div className="border-t bg-muted/30 p-4">
          <div className="flex items-center justify-end gap-2">
            {response ? (
              <Button size="sm" onClick={() => handleOpenChange(false)}>
                完成
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenChange(false)}
                  disabled={loading}
                >
                  取消
                </Button>
                <Button
                  size="sm"
                  onClick={handlePublish}
                  disabled={loading || selected.length === 0}
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      發布中...
                    </>
                  ) : (
                    <>
                      <Send className="size-4" />
                      {dryRun ? "模擬發布" : "立即發布"}
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ResultList({
  results,
  summary,
}: {
  results: PublishResult[];
  summary: PublishResponse["summary"];
}) {
  const allOk = summary.failed === 0;
  return (
    <div className="flex flex-col gap-3">
      <div
        className={cn(
          "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
          allOk
            ? "border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
            : "border-amber-500/30 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
        )}
      >
        {allOk ? (
          <CheckCircle2 className="size-4" />
        ) : (
          <AlertTriangle className="size-4" />
        )}
        {summary.success} 成功 / {summary.failed} 失敗 (共 {summary.total})
      </div>

      <div className="flex flex-col gap-2">
        {results.map((r, idx) => (
          <div
            key={`${r.platform}-${idx}`}
            className="rounded-lg border p-3 text-sm"
          >
            <div className="flex items-center gap-2">
              {r.ok ? (
                <CheckCircle2 className="size-4 text-emerald-600" />
              ) : (
                <XCircle className="size-4 text-rose-600" />
              )}
              <span className="font-medium">{r.platform}</span>
              {r.dryRun && (
                <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                  DRY-RUN
                </span>
              )}
            </div>
            {r.externalUrl && (
              <a
                href={r.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block truncate text-xs text-primary underline"
              >
                {r.externalUrl}
              </a>
            )}
            {r.externalId && !r.externalUrl && (
              <p className="mt-1 truncate text-xs text-muted-foreground">
                id: {r.externalId}
              </p>
            )}
            {r.error && (
              <p className="mt-1 text-xs text-rose-600">{r.error}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function normalizeDefaults(defaults?: string[]): PlatformId[] {
  if (!defaults || defaults.length === 0) return ["TWITTER"]; // 預設勾 Twitter
  const valid = new Set(PLATFORMS.map((p) => p.id));
  return defaults
    .map((p) => p.toUpperCase())
    .filter((p): p is PlatformId => valid.has(p as PlatformId));
}
