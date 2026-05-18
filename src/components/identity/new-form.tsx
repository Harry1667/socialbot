"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const COLORS = [
  { value: "bg-blue-500", label: "藍" },
  { value: "bg-emerald-500", label: "綠" },
  { value: "bg-rose-500", label: "玫" },
  { value: "bg-amber-500", label: "琥" },
  { value: "bg-violet-500", label: "紫" },
  { value: "bg-pink-500", label: "粉" },
  { value: "bg-teal-500", label: "青" },
  { value: "bg-indigo-500", label: "靛" },
  { value: "bg-orange-500", label: "橘" },
  { value: "bg-cyan-500", label: "湖" },
];

const TONES = ["專業", "親切", "幽默", "知性", "熱情", "嚴謹"];

export function NewIdentityForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarText, setAvatarText] = useState("");
  const [avatarColor, setAvatarColor] = useState(COLORS[0].value);
  const [bio, setBio] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");

  const previewText = (avatarText || name.slice(0, 1) || "?").slice(0, 2);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("名稱必填");
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/identities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          avatarText: previewText,
          avatarColor,
          bio: bio.trim(),
          audience: audience.trim(),
          tone: tone.trim(),
          systemPrompt: systemPrompt.trim(),
        }),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        setError(err.error ?? `建立失敗 (${res.status})`);
        setSubmitting(false);
        return;
      }

      const created = (await res.json()) as { slug: string };
      router.push(`/agent/socialmaster/i/${created.slug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知錯誤");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/agent/socialmaster">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">新增身份</h1>
          <p className="text-sm text-muted-foreground">
            為新的人設設定基本資訊與 AI 語氣風格
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* 預覽卡 */}
        <div className="flex items-center gap-4 rounded-xl border bg-card p-4">
          <div
            className={cn(
              "flex size-14 items-center justify-center rounded-full text-xl font-semibold text-white shadow-sm",
              avatarColor
            )}
          >
            {previewText}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-semibold">
              {name || "新身份"}
            </div>
            <div className="truncate text-sm text-muted-foreground">
              {description || "請填寫描述"}
            </div>
          </div>
        </div>

        {/* 基本資訊 */}
        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold">基本資訊</h2>
          <div className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                名稱 <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如:Atlas Finance"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">描述</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="例如:個人理財顧問"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="avatarText">頭像文字</Label>
              <Input
                id="avatarText"
                value={avatarText}
                onChange={(e) => setAvatarText(e.target.value.slice(0, 2))}
                placeholder="預設取名稱首字"
                maxLength={2}
              />
            </div>

            <div className="grid gap-2">
              <Label>頭像顏色</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    type="button"
                    key={c.value}
                    onClick={() => setAvatarColor(c.value)}
                    className={cn(
                      "size-8 rounded-full ring-offset-2 transition-all",
                      c.value,
                      avatarColor === c.value && "ring-2 ring-foreground"
                    )}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* AI 設定 */}
        <section className="rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="size-4 text-violet-500" />
            <h2 className="text-sm font-semibold">AI 語氣與風格</h2>
          </div>
          <div className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="bio">人設背景 (Bio)</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="這個人是誰、做什麼、有什麼經歷..."
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="audience">目標受眾</Label>
              <Input
                id="audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="例如:25-35 歲剛開始工作的上班族"
              />
            </div>

            <div className="grid gap-2">
              <Label>語氣風格</Label>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setTone(t === tone ? "" : t)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs transition-colors",
                      tone === t
                        ? "border-foreground bg-foreground text-background"
                        : "hover:bg-accent"
                    )}
                  >
                    {t}
                  </button>
                ))}
                <Input
                  value={!TONES.includes(tone) ? tone : ""}
                  onChange={(e) => setTone(e.target.value)}
                  placeholder="或自訂..."
                  className="h-7 w-32 text-xs"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="systemPrompt">
                System Prompt (給 AI 的指令)
              </Label>
              <Textarea
                id="systemPrompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="例如:你是一位專業的理財顧問,寫作風格簡潔有力,擅長用實際案例說明複雜概念,每篇文章開頭都先丟出一個讓人想看下去的反差或數據。"
                rows={5}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                這段會在 AI 生文章時自動帶入,影響語氣與內容方向
              </p>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="sticky bottom-0 -mx-6 flex items-center justify-end gap-2 border-t bg-background/95 px-6 py-3 backdrop-blur">
          <Button asChild type="button" variant="outline">
            <Link href="/agent/socialmaster">取消</Link>
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                建立中...
              </>
            ) : (
              "建立身份"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
