/**
 * Cloudflare R2 上傳 wrapper
 * R2 完全相容 S3 API,用 @aws-sdk/client-s3 即可
 */
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const ENDPOINT = process.env.R2_ENDPOINT;
const ACCESS_KEY = process.env.R2_ACCESS_KEY_ID;
const SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET = process.env.R2_BUCKET ?? "socialbot-media";
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

let client: S3Client | null = null;

export function isStorageConfigured(): boolean {
  return !!(ENDPOINT && ACCESS_KEY && SECRET_KEY);
}

function getClient(): S3Client {
  if (!isStorageConfigured()) {
    throw new Error(
      "R2 未設定。請填入 R2_ENDPOINT / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY"
    );
  }
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: ENDPOINT,
      credentials: {
        accessKeyId: ACCESS_KEY!,
        secretAccessKey: SECRET_KEY!,
      },
    });
  }
  return client;
}

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  contentType: string;
}

export async function uploadFile(opts: {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
}): Promise<UploadResult> {
  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: opts.key,
    Body: opts.body,
    ContentType: opts.contentType,
  });
  await getClient().send(cmd);

  const url = PUBLIC_URL
    ? `${PUBLIC_URL.replace(/\/$/, "")}/${opts.key}`
    : `${ENDPOINT}/${BUCKET}/${opts.key}`;

  return {
    key: opts.key,
    url,
    size: opts.body.byteLength,
    contentType: opts.contentType,
  };
}

export async function getPresignedUploadUrl(opts: {
  key: string;
  contentType: string;
  expiresIn?: number;
}): Promise<string> {
  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: opts.key,
    ContentType: opts.contentType,
  });
  return getSignedUrl(getClient(), cmd, {
    expiresIn: opts.expiresIn ?? 600,
  });
}

export function generateKey(filename: string, prefix = "uploads"): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "bin";
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}/${ts}-${rand}.${ext}`;
}
