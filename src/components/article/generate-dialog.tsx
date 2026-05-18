"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Loader2,
  Wand2,
  Settings2,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface HookTemplate {
  id: string;
  name: string;
  category: string;
  template: string;
}

interface GeneratedArticle {
  title: string;
  content: string;
  excerpt: string;
  hashtags: string[];
}

interface GenerateDialogProps {
  identitySlug: string;
  identityName: string;
}

const TIERS = [
  { id: "fast" as const, label: "快速", desc: "Haiku · 秒回", color: "bg-emerald-500" },
  { id: "mid" as const, label: "標準", desc: "Sonnet · 推薦", color: "bg-blue-500" },
  { id: "high" as const, label: "高品質", desc: "Opus · 慢但好", color: "bg-violet-500" },
];

export function GenerateArticleDialog({
  identitySlug,
  identityName,
}: GenerateDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [hooks, setHooks] = useState<HookTemplate[]>([]);
  const [topic, setTopic] = useState("");
  const [angle, setAngle] = useState("");
  const [hookId, setHookId] = useState<string | null>(null);
  const [tier, setTier] = useState<"high" | "mid" | "fast">("mid");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<GeneratedArticle | null>(null);
  const [error, setError] = useState<string | null>(null);

  function loadHooks() {
    fetch(`/api/hooks?identityId=`)
      .then((r) => r.json())
      .then(setHooks);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      loadHooks();
      setGenerated(null);
      setError(null);
    }
  }

  async function handleGenerate() {
    if (!topic.trim()) {
      setError("請輸入主題");
      return;
    }
    setError(null);
    setLoading(true);
    setGenerated(null);

    try {
      const res = await fetch("/api/articles/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identitySlug,
          topic: topic.trim(),
          angle: angle.trim() || undefined,
          hookTemplateId: hookId,
          tier,
          save: true,
        }),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        setError(err.error ?? `生成失敗 (${res.status})`);
        return;
      }

      const data = (await res.json()) as { generated: GeneratedArticle };
      setGenerated(data.generated);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知錯誤");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setTopic("");
    setAngle("");
    setHookId(null);
    setGenerated(null);
    setError(null);
  }

  const selectedHook = hooks.find((h) => h.id === hookId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Wand2 className="size-4" />
          生成文章
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col gap-0 p-0">
        <DialogHeader className="border-b p-5">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-violet-500" />
            為「{identityName}」生成文章
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5">
          {!generated ? (
            <div className="flex flex-col gap-4">
              {/* 主題 */}
              <div className="grid gap-2">
                <Label htmlFor="topic">
                  主題 <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="例如:為什麼大多數人存不到錢"
                  disabled={loading}
                />
              </div>

              {/* 角度 */}
              <div className="grid gap-2">
                <Label htmlFor="angle">切入角度 (選填)</Label>
                <Input
                  id="angle"
                  value={angle}
                  onChange={(e) => setAngle(e.target.value)}
                  placeholder="例如:從心理層面切入、用真實案例帶出"
                  disabled={loading}
                />
              </div>

              {/* Hook 模板 */}
              <div className="grid gap-2">
                <Label>Hook 模板 (選填)</Label>
                {hooks.length === 0 ? (
                  <p className="text-xs text-muted-foreground">載入中...</p>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setHookId(null)}
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-xs transition-colors",
                          !hookId
                            ? "border-foreground bg-foreground text-background"
                            : "hover:bg-accent"
                        )}
                      >
                        無
                      </button>
                      {hooks.slice(0, 8).map((h) => (
                        <button
                          type="button"
                          key={h.id}
                          onClick={() => setHookId(h.id)}
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-xs transition-colors",
                            hookId === h.id
                              ? "border-foreground bg-foreground text-background"
                              : "hover:bg-accent"
                          )}
                        >
                          {h.name}
                        </button>
                      ))}
                    </div>
                    {selectedHook && (
                      <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                        {selectedHook.template}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Tier */}
              <div className="grid gap-2">
                <Label>AI 品質</Label>
                <div className="grid grid-cols-3 gap-2">
                  {TIERS.map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setTier(t.id)}
                      disabled={loading}
                      className={cn(
                        "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all",
                        tier === t.id
                          ? "border-foreground shadow-sm"
                          : "hover:bg-accent"
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={cn("size-2 rounded-full", t.color)} />
                        <span className="text-sm font-medium">{t.label}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {t.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                <CheckCircle2 className="size-4" />
                生成成功,已存為待審核
              </div>

              <div className="grid gap-2">
                <Label className="text-xs">標題</Label>
                <h3 className="text-lg font-semibold">{generated.title}</h3>
              </div>

              <div className="grid gap-2">
                <Label className="text-xs">內文</Label>
                <Textarea
                  value={generated.content}
                  readOnly
                  rows={8}
                  className="text-sm"
                />
              </div>

              {generated.hashtags.length > 0 && (
                <div className="grid gap-2">
                  <Label className="text-xs">Hashtags</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {generated.hashtags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t bg-muted/30 p-4">
          <div className="flex items-center justify-end gap-2">
            {generated ? (
              <>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <Trash2 className="size-4" />
                  重新生成
                </Button>
                <Button size="sm" onClick={() => setOpen(false)}>
                  完成
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  取消
                </Button>
                <Button size="sm" onClick={handleGenerate} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Wand2 className="size-4" />
                      開始生成
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
