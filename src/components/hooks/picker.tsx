"use client";

import { useEffect, useState } from "react";
import { Sparkles, Search, Settings2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HookTemplate {
  id: string;
  name: string;
  category: string;
  template: string;
  usageCount: number;
  isGlobal: boolean;
}

interface HookPickerProps {
  identityId?: string;
  onSelect?: (hook: HookTemplate) => void;
  trigger?: React.ReactNode;
}

export function HookPicker({ identityId, onSelect, trigger }: HookPickerProps) {
  const [open, setOpen] = useState(false);
  const [hooks, setHooks] = useState<HookTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("全部");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const url = identityId
      ? `/api/hooks?identityId=${identityId}`
      : "/api/hooks";
    fetch(url)
      .then((r) => r.json())
      .then((data: HookTemplate[]) => setHooks(data))
      .finally(() => setLoading(false));
  }, [open, identityId]);

  const categories = ["全部", ...new Set(hooks.map((h) => h.category))];

  const filtered = hooks.filter((h) => {
    const matchCategory =
      activeCategory === "全部" || h.category === activeCategory;
    const matchSearch =
      !search ||
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.template.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  function handleSelect(hook: HookTemplate) {
    onSelect?.(hook);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm" className="gap-1.5">
            <Settings2 className="size-4" />
            Hook 模板
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col gap-0 p-0">
        <DialogHeader className="border-b p-5">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-violet-500" />
            選擇 Hook 模板
          </DialogTitle>
        </DialogHeader>

        <div className="border-b p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜尋模板名稱或內容..."
              className="pl-9"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  activeCategory === cat
                    ? "border-foreground bg-foreground text-background"
                    : "hover:bg-accent"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              載入中...
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm font-medium">沒有模板</p>
              <p className="mt-1 text-xs text-muted-foreground">
                建立第一個 Hook 模板
              </p>
            </div>
          )}
          <div className="grid gap-2">
            {filtered.map((hook) => (
              <button
                key={hook.id}
                type="button"
                onClick={() => handleSelect(hook)}
                className="group flex flex-col gap-1.5 rounded-lg border bg-card p-3 text-left transition-all hover:border-foreground hover:shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{hook.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">
                      用過 {hook.usageCount}
                    </span>
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {hook.category}
                    </span>
                  </div>
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {hook.template}
                </p>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
