/**
 * OAuth 設定 — 各社群平台的 authorize / token / user-info endpoints
 */

export type OAuthPlatform = "meta" | "threads" | "twitter";

export interface OAuthProvider {
  platform: OAuthPlatform;
  dbEnum: "FACEBOOK" | "INSTAGRAM" | "THREADS" | "TWITTER" | "LINKEDIN";
  label: string;
  authorizeUrl: string;
  tokenUrl: string;
  scope: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

function readEnv(key: string): string {
  return process.env[key] ?? "";
}

export function getProvider(platform: OAuthPlatform): OAuthProvider | null {
  switch (platform) {
    case "meta":
      return {
        platform: "meta",
        dbEnum: "FACEBOOK",
        label: "Facebook / Instagram",
        authorizeUrl: "https://www.facebook.com/v19.0/dialog/oauth",
        tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
        scope:
          "pages_show_list,pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish",
        clientId: readEnv("META_APP_ID"),
        clientSecret: readEnv("META_APP_SECRET"),
        redirectUri: readEnv("META_REDIRECT_URI"),
      };
    case "threads":
      return {
        platform: "threads",
        dbEnum: "THREADS",
        label: "Threads",
        authorizeUrl: "https://threads.net/oauth/authorize",
        tokenUrl: "https://graph.threads.net/oauth/access_token",
        scope: "threads_basic,threads_content_publish",
        clientId: readEnv("THREADS_APP_ID"),
        clientSecret: readEnv("THREADS_APP_SECRET"),
        redirectUri: readEnv("THREADS_REDIRECT_URI"),
      };
    case "twitter":
      return {
        platform: "twitter",
        dbEnum: "TWITTER",
        label: "X (Twitter)",
        authorizeUrl: "https://twitter.com/i/oauth2/authorize",
        tokenUrl: "https://api.twitter.com/2/oauth2/token",
        scope: "tweet.read tweet.write users.read offline.access",
        clientId: readEnv("TWITTER_CLIENT_ID"),
        clientSecret: readEnv("TWITTER_CLIENT_SECRET"),
        redirectUri: readEnv("TWITTER_REDIRECT_URI"),
      };
    default:
      return null;
  }
}

export function isProviderConfigured(p: OAuthProvider | null): boolean {
  return !!(p && p.clientId && p.clientSecret && p.redirectUri);
}

export function buildAuthorizeUrl(
  provider: OAuthProvider,
  state: string
): string {
  const params = new URLSearchParams({
    client_id: provider.clientId,
    redirect_uri: provider.redirectUri,
    scope: provider.scope,
    response_type: "code",
    state,
  });
  return `${provider.authorizeUrl}?${params.toString()}`;
}
