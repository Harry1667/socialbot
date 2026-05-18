import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const hook = await db.hookTemplate.findUnique({ where: { id } });
  if (!hook) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(hook);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await req.json()) as Partial<{
    name: string;
    category: string;
    template: string;
    variables: string[];
    isGlobal: boolean;
  }>;

  try {
    const updated = await db.hookTemplate.update({ where: { id }, data: body });
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
    await db.hookTemplate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 400 });
  }
}
