import { Badge } from "@/components/ui/badge";
import type { ArticleStatus } from "@/types";

const STATUS_MAP: Record<
  ArticleStatus,
  { label: string; variant: "default" | "secondary" | "success" | "warning" | "info" | "destructive" }
> = {
  draft: { label: "草稿", variant: "secondary" },
  pending_review: { label: "待審核", variant: "warning" },
  approved: { label: "已核准", variant: "info" },
  scheduled: { label: "排程中", variant: "info" },
  published: { label: "已發布", variant: "success" },
  failed: { label: "發布失敗", variant: "destructive" },
};

export function StatusBadge({ status }: { status: ArticleStatus }) {
  const config = STATUS_MAP[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
