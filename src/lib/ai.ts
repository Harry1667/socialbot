/**
 * ProxyCLI TypeScript Wrapper
 * 透過 REST API 呼叫 ProxyCLI 服務,統一存取多家 AI 供應商
 */

const REST_URL = process.env.AI_PROXY_REST_URL ?? "http://cli.twloop.com:8080";
const TOKEN = process.env.AI_PROXY_TOKEN ?? "";
const PROJECT = process.env.AI_PROXY_PROJECT ?? "";
const GROUP = process.env.AI_PROXY_GROUP ?? "";

export type AITier = "high" | "mid" | "fast";
export type AIProvider = "claude" | "gpt" | "gemini";

export interface AIOptions {
  provider?: AIProvider;
  model?: string;
  tier?: AITier;
  system?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIResult {
  content: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs?: number;
  provider?: string;
  model?: string;
}

function headers() {
  if (!TOKEN) throw new Error("AI_PROXY_TOKEN 未設定,檢查 .env");
  return {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
    "X-Project": PROJECT,
    "X-Group": GROUP,
  };
}

/**
 * 一行呼叫 — 回傳純文字
 */
export async function ai(prompt: string, opts: AIOptions = {}): Promise<string> {
  const result = await aiDetail(prompt, opts);
  return result.content;
}

/**
 * 詳細呼叫 — 含 token 用量與延遲
 */
export async function aiDetail(
  prompt: string,
  opts: AIOptions = {}
): Promise<AIResult> {
  const body = {
    prompt,
    provider: opts.provider,
    model: opts.model,
    tier: opts.tier ?? "mid",
    system: opts.system,
    temperature: opts.temperature,
    max_tokens: opts.maxTokens,
  };

  const res = await fetch(`${REST_URL}/api/chat`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`ProxyCLI ${res.status}: ${errText || res.statusText}`);
  }

  const data = (await res.json()) as {
    content?: string;
    output?: string;
    text?: string;
    input_tokens?: number;
    output_tokens?: number;
    latency_ms?: number;
    provider?: string;
    model?: string;
  };

  return {
    content: data.content ?? data.output ?? data.text ?? "",
    inputTokens: data.input_tokens,
    outputTokens: data.output_tokens,
    latencyMs: data.latency_ms,
    provider: data.provider,
    model: data.model,
  };
}

/**
 * 串流呼叫 — async iterator
 */
export async function* aiStream(
  prompt: string,
  opts: AIOptions = {}
): AsyncGenerator<string, void, undefined> {
  const body = {
    prompt,
    provider: opts.provider,
    model: opts.model,
    tier: opts.tier ?? "mid",
    system: opts.system,
    stream: true,
  };

  const res = await fetch(`${REST_URL}/api/chat/stream`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    throw new Error(`ProxyCLI stream ${res.status}: ${res.statusText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE 格式:每行以 "data: " 開頭,結束於空行
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") return;
      try {
        const json = JSON.parse(payload) as { content?: string; delta?: string };
        const chunk = json.content ?? json.delta ?? "";
        if (chunk) yield chunk;
      } catch {
        if (payload) yield payload;
      }
    }
  }
}

/**
 * 文章生成 — 套用人設 system prompt
 */
export interface GenerateArticleOptions {
  topic: string;
  angle?: string;
  systemPrompt?: string;
  tier?: AITier;
  hookTemplate?: string;
}

export interface GeneratedArticle {
  title: string;
  content: string;
  excerpt: string;
  hashtags: string[];
}

export async function generateArticle(
  opts: GenerateArticleOptions
): Promise<GeneratedArticle> {
  const userPrompt = [
    `主題:${opts.topic}`,
    opts.angle ? `角度:${opts.angle}` : "",
    opts.hookTemplate ? `Hook 模板:${opts.hookTemplate}` : "",
    "",
    "請以 JSON 格式回傳,結構:",
    `{
  "title": "吸睛標題(20 字內)",
  "content": "完整文章內容(200~400 字)",
  "excerpt": "摘要(50 字內)",
  "hashtags": ["#標籤1", "#標籤2", "#標籤3"]
}`,
    "只回傳 JSON,不要加任何額外說明。",
  ]
    .filter(Boolean)
    .join("\n");

  const raw = await ai(userPrompt, {
    system: opts.systemPrompt,
    tier: opts.tier ?? "mid",
  });

  // 嘗試解析 JSON(處理被包在 ```json 區塊裡的情況)
  const jsonText = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(jsonText) as GeneratedArticle;
    return {
      title: parsed.title ?? "",
      content: parsed.content ?? "",
      excerpt: parsed.excerpt ?? "",
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
    };
  } catch {
    return {
      title: opts.topic,
      content: raw,
      excerpt: raw.slice(0, 50),
      hashtags: [],
    };
  }
}
