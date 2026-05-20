import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import {
  getProvider,
  isProviderConfigured,
  buildAuthorizeUrl,
  generatePkce,
  type OAuthPlatform,
} from "@/lib/oauth";

/**
 * GET /api/oauth/[platform]?identityId=xxx
 * 啟動 OAuth flow，重導向至社群平台授權頁。
 * - X 需要 PKCE：把 code_verifier 存 cookie，callback 時讀回去
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const { searchParams } = new URL(req.url);
  const identityId = searchParams.get("identityId");

  if (!identityId) {
    return NextResponse.json({ error: "identityId 必填" }, { status: 400 });
  }

  const provider = getProvider(platform as OAuthPlatform);
  if (!provider) {
    return NextResponse.json(
      { error: `不支援的平台：${platform}` },
      { status: 400 }
    );
  }

  if (!isProviderConfigured(provider)) {
    return NextResponse.json(
      {
        error: `${provider.label} OAuth 未設定，請填 .env 的 ${platform.toUpperCase()}_* 變數`,
      },
      { status: 503 }
    );
  }

  const csrf = randomBytes(16).toString("hex");
  const state = Buffer.from(
    JSON.stringify({ csrf, identityId, platform })
  ).toString("base64url");

  const pkce = provider.pkce ? generatePkce() : undefined;
  const url = buildAuthorizeUrl(provider, state, pkce);

  const res = NextResponse.redirect(url);
  // CSRF cookie 給 callback 驗證
  res.cookies.set("oauth_csrf", csrf, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  // PKCE verifier cookie（僅 X 用）
  if (pkce) {
    res.cookies.set("oauth_pkce_verifier", pkce.verifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
  }
  return res;
}
