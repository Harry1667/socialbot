"use client";

import { useEffect, useState } from "react";
import { Globe, AtSign, MessageCircle, Link2, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SocialAccount {
  id: string;
  platform: "FACEBOOK" | "INSTAGRAM" | "THREADS" | "TWITTER" | "LINKEDIN";
  accountName: string;
  accountId: string;
  isActive: boolean;
  tokenExpiresAt: string | null;
}

interface Provider {
  key: "meta" | "threads" | "twitter";
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  platforms: SocialAccount["platform"][];
}

const PROVIDERS: Provider[] = [
  {
    key: "meta",
    label: "Facebook + Instagram",
    description: "粉專貼文、限時動態、Reels",
    icon: <Globe className="size-5" />,
    color: "bg-blue-500/10 text-blue-600",
    platforms: ["FACEBOOK", "INSTAGRAM"],
  },
  {
    key: "threads",
    label: "Threads",
    description: "Meta 旗下文字社群",
    icon: <MessageCircle className="size-5" />,
    color: "bg-zinc-500/10 text-zinc-700",
    platforms: ["THREADS"],
  },
  {
    key: "twitter",
    label: "X (Twitter)",
    description: "280 字短訊息",
    icon: <AtSign className="size-5" />,
    color: "bg-sky-500/10 text-sky-600",
    platforms: ["TWITTER"],
  },
];

export function SocialAccountsPanel({ identityId }: { identityId: string }) {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/social-accounts?identityId=${identityId}`)
      .then((r) => r.json())
      .then((data: SocialAccount[]) => setAccounts(data))
      .finally(() => setLoading(false));
  }, [identityId]);

  function isConnected(provider: Provider): SocialAccount | undefined {
    return accounts.find((a) =>
      provider.platforms.includes(a.platform) && a.isActive
    );
  }

  function handleConnect(providerKey: string) {
    window.location.href = `/api/oauth/${providerKey}?identityId=${identityId}`;
  }

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
        載入中...
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card">
      <div className="border-b p-4">
        <h2 className="text-sm font-semibold">社群帳號綁定</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          綁定後可以一鍵發布內容到各平台
        </p>
      </div>
      <div className="divide-y">
        {PROVIDERS.map((p) => {
          const connected = isConnected(p);
          return (
            <div key={p.key} className="flex items-center gap-3 p-4">
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-lg",
                  p.color
                )}
              >
                {p.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{p.label}</span>
                  {connected ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                      <Check className="size-3" />
                      已連接
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                      未連接
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{p.description}</p>
                {connected?.tokenExpiresAt && (
                  <p className="mt-0.5 text-[11px] text-amber-600">
                    Token 將於 {new Date(connected.tokenExpiresAt).toLocaleDateString("zh-TW")} 到期
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant={connected ? "outline" : "default"}
                onClick={() => handleConnect(p.key)}
                className="gap-1.5"
              >
                <Link2 className="size-3.5" />
                {connected ? "重新授權" : "連接"}
              </Button>
            </div>
          );
        })}
      </div>
      <div className="border-t bg-muted/30 px-4 py-2.5 text-[11px] text-muted-foreground">
        <AlertTriangle className="mr-1 inline size-3" />
        OAuth 設定需要先在 .env 填入各平台的 App ID / Secret
      </div>
    </div>
  );
}
