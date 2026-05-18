import { MoreHorizontal, Settings, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Identity } from "@/types";

export function IdentityHeader({ identity }: { identity: Identity }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b px-6 py-5">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex size-14 items-center justify-center rounded-full text-xl font-semibold text-white shadow-sm",
            identity.avatarColor
          )}
        >
          {identity.avatarText}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">{identity.name}</h1>
            {identity.isActive ? (
              <Badge variant="success" className="gap-1">
                <span className="size-1.5 rounded-full bg-emerald-600" />
                啟用中
              </Badge>
            ) : (
              <Badge variant="secondary">已停用</Badge>
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {identity.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="gap-1.5">
          <Share2 className="size-4" />
          發布
        </Button>
        <Button variant="ghost" size="icon">
          <Settings className="size-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="size-4" />
        </Button>
      </div>
    </div>
  );
}
