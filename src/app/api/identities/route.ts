import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { slugify, randomAvatarColor } from "@/lib/slug";

export async function GET() {
  const identities = await db.identity.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      avatarText: true,
      avatarColor: true,
      isActive: true,
      _count: { select: { articles: true } },
    },
  });

  return NextResponse.json(
    identities.map((i) => ({
      id: i.id,
      slug: i.slug,
      name: i.name,
      description: i.description ?? "",
      avatarText: i.avatarText,
      avatarColor: i.avatarColor,
      isActive: i.isActive,
      articleCount: i._count.articles,
    }))
  );
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    name: string;
    description?: string;
    avatarText?: string;
    avatarColor?: string;
    bio?: string;
    audience?: string;
    tone?: string;
    systemPrompt?: string;
    slug?: string;
  };

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name 必填" }, { status: 400 });
  }

  let slug = body.slug ? slugify(body.slug) : slugify(body.name);

  // slug 衝突檢查 — 衝突就加數字後綴
  const existing = await db.identity.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const identity = await db.identity.create({
    data: {
      slug,
      name: body.name.trim(),
      description: body.description?.trim() || null,
      avatarText: body.avatarText?.slice(0, 2) || body.name.slice(0, 1),
      avatarColor: body.avatarColor || randomAvatarColor(),
      bio: body.bio?.trim() || null,
      audience: body.audience?.trim() || null,
      tone: body.tone?.trim() || null,
      systemPrompt: body.systemPrompt?.trim() || null,
      isActive: true,
    },
  });

  return NextResponse.json(identity, { status: 201 });
}
