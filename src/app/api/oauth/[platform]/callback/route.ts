import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getProvider,
  isProviderConfigured,
  type OAuthPlatform,
} from "@/lib/oauth";

/**
 * GET /api/oauth/[platform]/callback?code=xxx&state=xxx
 * OAuth callback,用 code 換 access_token,儲存 SocialAccount
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateB64 = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(
      new URL(`/agent/socialmaster?oauth_error=${errorParam}`, req.url)
    );
  }

  if (!code || !stateB64) {
    return NextResponse.json(
      { error: "缺少 code 或 state" },
      { status: 400 }
    );
  }

  // 驗證 state
  let state: { csrf: string; identityId: string; platform: string };
  try {
    state = JSON.parse(Buffer.from(stateB64, "base64url").toString());
  } catch {
    return NextResponse.json({ error: "state 格式錯誤" }, { status: 400 });
  }

  const csrfCookie = req.headers.get("cookie")?.match(/oauth_csrf=([^;]+)/)?.[1];
  if (csrfCookie !== state.csrf) {
    return NextResponse.json({ error: "CSRF 驗證失敗" }, { status: 403 });
  }

  const provider = getProvider(platform as OAuthPlatform);
  if (!provider || !isProviderConfigured(provider)) {
    return NextResponse.json(
      { error: "Provider 未設定" },
      { status: 503 }
    );
  }

  try {
    // 用 code 換 access_token
    const tokenRes = await fetch(provider.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: provider.clientId,
        client_secret: provider.clientSecret,
        redirect_uri: provider.redirectUri,
        code,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text().catch(() => "");
      return NextResponse.json(
        { error: `Token 交換失敗: ${errText}` },
        { status: 400 }
      );
    }

    const tokenData = (await tokenRes.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      user_id?: string | number;
    };

    // 儲存到 DB(實際上各平台 user info 取得方式不同,這裡簡化)
    await db.socialAccount.upsert({
      where: {
        identityId_platform_accountId: {
          identityId: state.identityId,
          platform: provider.dbEnum,
          accountId: String(tokenData.user_id ?? "unknown"),
        },
      },
      create: {
        identityId: state.identityId,
        platform: provider.dbEnum,
        accountName: provider.label,
        accountId: String(tokenData.user_id ?? "unknown"),
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token ?? null,
        tokenExpiresAt: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : null,
      },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token ?? null,
        tokenExpiresAt: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : null,
        isActive: true,
      },
    });

    // 取得 identity slug 來重導向
    const identity = await db.identity.findUnique({
      where: { id: state.identityId },
      select: { slug: true },
    });

    return NextResponse.redirect(
      new URL(
        `/agent/socialmaster/i/${identity?.slug ?? ""}?oauth_success=${platform}`,
        req.url
      )
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "OAuth callback 失敗";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
