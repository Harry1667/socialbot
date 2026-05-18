import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  uploadFile,
  generateKey,
  isStorageConfigured,
} from "@/lib/storage";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export async function POST(req: Request) {
  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: "R2 storage 未設定,請填 .env 的 R2_* 變數" },
      { status: 503 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const folder = (formData.get("folder") as string) || "uploads";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file 必填" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: `檔案過大 (最大 ${MAX_SIZE / 1024 / 1024}MB)` },
      { status: 400 }
    );
  }

  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json(
      { error: `不支援的格式: ${file.type}` },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = generateKey(file.name, folder);

  try {
    const result = await uploadFile({
      key,
      body: buffer,
      contentType: file.type,
    });

    const media = await db.media.create({
      data: {
        url: result.url,
        type: file.type,
        filename: file.name,
        size: result.size,
        folder,
      },
    });

    return NextResponse.json(media, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "上傳失敗";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
