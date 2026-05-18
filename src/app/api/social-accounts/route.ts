import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const identityId = searchParams.get("identityId");

  if (!identityId) {
    return NextResponse.json({ error: "identityId 必填" }, { status: 400 });
  }

  const accounts = await db.socialAccount.findMany({
    where: { identityId },
    select: {
      id: true,
      platform: true,
      accountName: true,
      accountId: true,
      isActive: true,
      tokenExpiresAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(accounts);
}
