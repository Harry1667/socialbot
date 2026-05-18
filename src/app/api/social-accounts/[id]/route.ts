import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const account = await db.socialAccount.findUnique({
    where: { id },
    select: {
      id: true,
      identityId: true,
      platform: true,
      accountName: true,
      accountId: true,
      isActive: true,
      tokenExpiresAt: true,
      createdAt: true,
    },
  });
  if (!account) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(account);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await req.json()) as Partial<{
    accountName: string;
    isActive: boolean;
  }>;

  try {
    const updated = await db.socialAccount.update({
      where: { id },
      data: body,
      select: {
        id: true,
        identityId: true,
        platform: true,
        accountName: true,
        isActive: true,
      },
    });
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
    await db.socialAccount.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 400 });
  }
}
