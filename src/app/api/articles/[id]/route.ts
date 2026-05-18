import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const STATUS_MAP: Record<string, string> = {
  draft: "DRAFT",
  pending_review: "PENDING_REVIEW",
  approved: "APPROVED",
  scheduled: "SCHEDULED",
  published: "PUBLISHED",
  failed: "FAILED",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const article = await db.article.findUnique({ where: { id } });
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(article);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await req.json()) as Partial<{
    title: string;
    content: string;
    excerpt: string;
    hashtags: string[];
    status: string;
    scheduledAt: string | null;
  }>;

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.content !== undefined) data.content = body.content;
  if (body.excerpt !== undefined) data.excerpt = body.excerpt;
  if (body.hashtags !== undefined) data.hashtags = body.hashtags;
  if (body.status) {
    const mapped = STATUS_MAP[body.status.toLowerCase()] ?? body.status;
    data.status = mapped;
    if (mapped === "PUBLISHED") data.publishedAt = new Date();
  }
  if (body.scheduledAt !== undefined) {
    data.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
  }

  try {
    const updated = await db.article.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await db.article.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 400 });
  }
}
