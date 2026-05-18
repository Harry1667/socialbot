/**
 * 假數據測試腳本
 *
 * 跑法：
 *   1. 確認 dev server 已啟動 (npm run dev)
 *   2. npx tsx scripts/seed-test-data.ts
 *
 * 會做的事：
 *   1. upsert 一個測試人設 "test-bot"
 *   2. 為 4 個社群平台各塞一筆假的 SocialAccount（accessToken = DRY_RUN）
 *   3. 建一篇假文章（status = APPROVED，targetPlatforms = 4 個）
 *   4. 打 /api/articles/[id]/publish?dryRun=true
 *   5. 印出 PublishResult
 */
import "dotenv/config";
import { db } from "../src/lib/db";

// 用 127.0.0.1 避開 Node 18+ 把 localhost 解析到 IPv6 而 Next dev 只綁 IPv4 的問題
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
  .replace("localhost", "127.0.0.1");

async function main() {
  console.log("================================");
  console.log("  SocialMaster 假數據測試腳本");
  console.log("================================\n");

  // ===== 1. 測試人設 =====
  console.log("[1/5] 建立測試人設 test-bot ...");
  const identity = await db.identity.upsert({
    where: { slug: "test-bot" },
    update: {},
    create: {
      slug: "test-bot",
      name: "測試小編",
      description: "用來測 dry-run 發文流程，可以隨時刪掉",
      avatarText: "測",
      avatarColor: "bg-violet-500",
      bio: "假裝是個熱愛分享的部落客",
      audience: "20-35 歲、對 AI / 自媒體有興趣",
      tone: "輕鬆口語、帶點幽默",
      systemPrompt:
        "你是一位專注分享 AI 工具與自媒體經營的創作者，文風口語、案例具體。",
      isActive: true,
    },
  });
  console.log(`     ✓ identity.id = ${identity.id}`);

  // ===== 2. 假的社群帳號 =====
  console.log("\n[2/5] 塞 4 筆假 SocialAccount (DRY_RUN token) ...");
  const platforms = [
    { platform: "FACEBOOK", label: "Facebook (測試粉專)", accountId: "fake_fb_123" },
    { platform: "INSTAGRAM", label: "Instagram (測試帳號)", accountId: "fake_ig_456" },
    { platform: "THREADS", label: "Threads (測試帳號)", accountId: "fake_threads_789" },
    { platform: "TWITTER", label: "X (測試帳號)", accountId: "fake_x_012" },
  ] as const;

  for (const p of platforms) {
    await db.socialAccount.upsert({
      where: {
        identityId_platform_accountId: {
          identityId: identity.id,
          platform: p.platform,
          accountId: p.accountId,
        },
      },
      update: { isActive: true },
      create: {
        identityId: identity.id,
        platform: p.platform,
        accountName: p.label,
        accountId: p.accountId,
        accessToken: "DRY_RUN", // ← publisher 看到這個會自動走 dry-run
        isActive: true,
      },
    });
    console.log(`     ✓ ${p.platform.padEnd(10)} (${p.label})`);
  }

  // ===== 3. 假文章 =====
  console.log("\n[3/5] 建一篇 APPROVED 狀態的測試文章 ...");
  const article = await db.article.create({
    data: {
      identityId: identity.id,
      title: "AI 自動發文真的有用嗎？三個月實測結果",
      content:
        "上週一位朋友問我：「你用 AI 自動發文，真的有人看嗎？」\n\n我笑了笑，給他看數據——三個月內，我經營的兩個小帳號從 0 漲到 3000 追蹤。\n\n但這不是 AI 的功勞，是「人設一致 + 內容節奏」的功勞。AI 只是把我從重複勞動裡解放出來。\n\n核心心得：\n1. 先想清楚人設語氣（不是丟 prompt 就好）\n2. Hook 模板比內容本身重要\n3. 排程比即興有效\n\n你呢？敢讓 AI 替你發文嗎？",
      excerpt:
        "三個月、兩個帳號、3000 追蹤——但秘密不是 AI，是人設與節奏。",
      hashtags: ["#AI寫作", "#自媒體", "#內容行銷"],
      status: "APPROVED",
      targetPlatforms: platforms.map((p) => p.platform),
    },
  });
  console.log(`     ✓ article.id = ${article.id}`);
  console.log(`       title    = ${article.title}`);
  console.log(`       targets  = ${article.targetPlatforms.join(", ")}`);

  // ===== 4. 呼叫 publish API (dry-run) =====
  const publishUrl = `${APP_URL}/api/articles/${article.id}/publish`;
  console.log(`\n[4/5] POST ${publishUrl}  (dryRun=true) ...`);
  let res;
  try {
    res = await fetch(publishUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dryRun: true }),
    });
  } catch (err) {
    console.error("\n     ✗ fetch 失敗:", err);
    console.error("     檢查 dev server 是否在跑 (curl " + APP_URL + "/api/identities)\n");
    process.exit(1);
  }

  if (!res.ok) {
    console.error(`     ✗ ${res.status} ${res.statusText}`);
    console.error(await res.text());
    process.exit(1);
  }
  const data = (await res.json()) as {
    articleId: string;
    summary: { total: number; success: number; failed: number };
    results: Array<{
      platform: string;
      ok: boolean;
      dryRun?: boolean;
      externalId?: string;
      externalUrl?: string;
      error?: string;
    }>;
  };

  console.log(
    `     ✓ HTTP 200 — total ${data.summary.total} / success ${data.summary.success} / failed ${data.summary.failed}\n`
  );
  for (const r of data.results) {
    const status = r.ok ? "✓" : "✗";
    const dry = r.dryRun ? " [DRY-RUN]" : "";
    console.log(
      `       ${status} ${r.platform.padEnd(10)}${dry}  → ${r.externalUrl ?? r.error}`
    );
  }

  // ===== 5. 驗證 DB 寫入 =====
  console.log("\n[5/5] 驗證 PublishResult 與 Article 狀態 ...");
  const after = await db.article.findUnique({
    where: { id: article.id },
    include: { publishResults: true },
  });
  console.log(`     ✓ article.status   = ${after?.status}`);
  console.log(`     ✓ article.publishedAt = ${after?.publishedAt?.toISOString() ?? "null"}`);
  console.log(`     ✓ PublishResult 共 ${after?.publishResults.length} 筆：`);
  for (const r of after?.publishResults ?? []) {
    console.log(
      `       - ${r.platform.padEnd(10)} ${r.status.padEnd(8)} ${r.externalUrl ?? r.errorMessage ?? ""}`
    );
  }

  console.log("\n================================");
  console.log("  ✅ 測試完成");
  console.log("================================");
  console.log(`瀏覽器看：${APP_URL}/agent/socialmaster/i/test-bot`);
  console.log(`想重跑：刪資料 → npx tsx scripts/clean-test-data.ts（之後補）`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
