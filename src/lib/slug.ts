/**
 * 將字串轉成 URL-safe slug
 * 中文 → 拼音化太複雜,改用 timestamp 後綴避免衝突
 */
export function slugify(input: string): string {
  const cleaned = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9一-鿿\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  // 含中文 → 加亂數後綴避免無法 URL-encode 的問題
  if (/[一-鿿]/.test(cleaned)) {
    const suffix = Math.random().toString(36).slice(2, 7);
    return `identity-${suffix}`;
  }

  return cleaned || `identity-${Math.random().toString(36).slice(2, 7)}`;
}

const COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-orange-500",
  "bg-cyan-500",
];

export function randomAvatarColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}
