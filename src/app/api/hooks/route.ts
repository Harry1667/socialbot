import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const identityId = searchParams.get("identityId");
  const category = searchParams.get("category");

  const hooks = await db.hookTemplate.findMany({
    where: {
      ...(identityId
        ? { OR: [{ identityId }, { isGlobal: true }] }
        : { isGlobal: true }),
      ...(category ? { category } : {}),
    },
    orderBy: [{ usageCount: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(hooks);
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    name: string;
    category: string;
    template: string;
    variables?: string[];
    identityId?: string;
    isGlobal?: boolean;
  };

  if (!body.name?.trim() || !body.template?.trim()) {
    return NextResponse.json(
      { error: "name 與 template 必填" },
      { status: 400 }
    );
  }

  const hook = await db.hookTemplate.create({
    data: {
      name: body.name.trim(),
      category: body.category?.trim() || "通用",
      template: body.template.trim(),
      variables: body.variables ?? [],
      identityId: body.identityId || null,
      isGlobal: body.isGlobal ?? !body.identityId,
    },
  });

  return NextResponse.json(hook, { status: 201 });
}
