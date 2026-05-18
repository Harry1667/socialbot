import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const identity = await db.identity.findUnique({
    where: { slug },
    include: { _count: { select: { articles: true } } },
  });

  if (!identity) {
    return NextResponse.json({ error: "Identity not found" }, { status: 404 });
  }

  return NextResponse.json(identity);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = (await req.json()) as Partial<{
    name: string;
    description: string;
    avatarText: string;
    avatarColor: string;
    bio: string;
    audience: string;
    tone: string;
    systemPrompt: string;
    isActive: boolean;
  }>;

  try {
    const updated = await db.identity.update({
      where: { slug },
      data: body,
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    await db.identity.delete({ where: { slug } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 400 });
  }
}
