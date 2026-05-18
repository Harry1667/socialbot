import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateArticle } from "@/lib/ai";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    identitySlug: string;
    topic: string;
    angle?: string;
    hookTemplateId?: string;
    tier?: "high" | "mid" | "fast";
    save?: boolean;
  };

  if (!body.identitySlug || !body.topic?.trim()) {
    return NextResponse.json(
      { error: "identitySlug 與 topic 必填" },
      { status: 400 }
    );
  }

  const identity = await db.identity.findUnique({
    where: { slug: body.identitySlug },
  });
  if (!identity) {
    return NextResponse.json({ error: "Identity not found" }, { status: 404 });
  }

  let hookTemplate: { id: string; template: string } | null = null;
  if (body.hookTemplateId) {
    hookTemplate = await db.hookTemplate.findUnique({
      where: { id: body.hookTemplateId },
      select: { id: true, template: true },
    });
  }

  try {
    const generated = await generateArticle({
      topic: body.topic.trim(),
      angle: body.angle?.trim(),
      systemPrompt: identity.systemPrompt ?? undefined,
      hookTemplate: hookTemplate?.template,
      tier: body.tier ?? "mid",
    });

    // 增加 hook 使用次數
    if (hookTemplate) {
      await db.hookTemplate.update({
        where: { id: hookTemplate.id },
        data: { usageCount: { increment: 1 } },
      });
    }

    // 預設儲存到 DB 為 DRAFT
    if (body.save !== false) {
      const saved = await db.article.create({
        data: {
          identityId: identity.id,
          title: generated.title,
          content: generated.content,
          excerpt: generated.excerpt,
          hashtags: generated.hashtags,
          status: "PENDING_REVIEW",
          hookTemplateId: hookTemplate?.id ?? null,
        },
      });

      return NextResponse.json({
        article: saved,
        generated,
      });
    }

    return NextResponse.json({ generated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI 生成失敗";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
