import { FileText } from "lucide-react";
import { ArticleCard } from "@/components/article/card";
import type { Article } from "@/types";

export function ArticleGrid({ articles }: { articles: Article[] }) {
  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <FileText className="size-5 text-muted-foreground" />
        </div>
        <h3 className="mt-3 text-sm font-medium">尚無內容</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          點擊「新增文章」開始為這個身份產出內容
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {articles.map((article, idx) => (
        <ArticleCard key={article.id} article={article} index={idx} />
      ))}
    </div>
  );
}
