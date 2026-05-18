import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import {
  getProvider,
  isProviderConfigured,
  buildAuthorizeUrl,
  type OAuthPlatform,
} from "@/lib/oauth";

/**
 * GET /api/oauth/[platform]?identityId=xxx
 * 啟動 OAuth flow,重導向至社群平台授權頁
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const { searchParams } = new URL(req.url);
  const identityId = searchParams.get("identityId");

  if (!identityId) {
    return NextResponse.json(
      { error: "identityId 必填" },
      { status: 400 }
    );
  }

  const provider = getProvider(platform as OAuthPlatform);
  if (!provider) {
    return NextResponse.json(
      { error: `不支援的平台: ${platform}` },
      { status: 400 }
    );
  }

  if (!isProviderConfigured(provider)) {
    return NextResponse.json(
      {
        error: `${provider.label} OAuth 未設定,請填 .env 的 ${platform.toUpperCase()}_* 變數`,
      },
      { status: 503 }
    );
  }

  // state 用來防 CSRF + 帶 identityId 回來
  const csrf = randomBytes(16).toString("hex");
  const state = Buffer.from(
    JSON.stringify({ csrf, identityId, platform })
  ).toString("base64url");

  const url = buildAuthorizeUrl(provider, state);

  const res = NextResponse.redirect(url);
  // 把 csrf 存 cookie,callback 時驗證
  res.cookies.set("oauth_csrf", csrf, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
  });
  return res;
}
