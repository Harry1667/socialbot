import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { SocialPlatform } from "@prisma/client";

/**
 * POST /api/articles/[id]/schedule
 * Body: { scheduledAt: ISO string, platforms?: SocialPlatform[] }
 *
 * DELETE /api/articles/[id]/schedule
 *   取消排程
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await req.json()) as {
    scheduledAt: string;
    platforms?: SocialPlatform[];
  };

  if (!body.scheduledAt) {
    return NextResponse.json({ error: "scheduledAt 必填" }, { status: 400 });
  }
  const when = new Date(body.scheduledAt);
  if (Number.isNaN(when.getTime())) {
    return NextResponse.json({ error: "scheduledAt 格式錯誤" }, { status: 400 });
  }
  if (when.getTime() < Date.now()) {
    return NextResponse.json(
      { error: "scheduledAt 必須是未來時間" },
      { status: 400 }
    );
  }

  try {
    const updated = await db.article.update({
      where: { id },
      data: {
        scheduledAt: when,
        status: "SCHEDULED",
        ...(body.platforms ? { targetPlatforms: body.platforms } : {}),
      },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "排程失敗" }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const updated = await db.article.update({
      where: { id },
      data: { scheduledAt: null, status: "APPROVED" },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "取消排程失敗" }, { status: 400 });
  }
}
