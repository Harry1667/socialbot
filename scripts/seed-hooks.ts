/**
 * Seed 預設 Hook 模板
 * 跑法: npx tsx scripts/seed-hooks.ts
 */
import "dotenv/config";
import { db } from "../src/lib/db";

const DEFAULTS = [
  {
    name: "場景式開場",
    category: "敘述",
    template:
      "上週 {時間},{對象} 跟我說 {一句話}。當下我楞住,因為...",
    variables: ["時間", "對象", "一句話"],
  },
  {
    name: "反差對比",
    category: "對比",
    template: "以前我以為 {誤解},直到 {事件} 發生之後才發現 {真相}。",
    variables: ["誤解", "事件", "真相"],
  },
  {
    name: "數據震撼",
    category: "資料",
    template:
      "{比例} 的人都不知道:{冷門事實}。我花了 {時間/金額} 才搞懂這件事。",
    variables: ["比例", "冷門事實", "時間/金額"],
  },
  {
    name: "痛點直擊",
    category: "情緒",
    template: "你是否也曾 {痛點情境}?今天分享一個 {解法/觀念}。",
    variables: ["痛點情境", "解法/觀念"],
  },
  {
    name: "實務案例",
    category: "案例",
    template:
      "上週一位 {身份} 朋友問我:「{問題}?」我想了想,給了他 {建議}。",
    variables: ["身份", "問題", "建議"],
  },
  {
    name: "三點清單",
    category: "結構",
    template:
      "做 {主題} 之前,先記住三件事:1. {重點1} 2. {重點2} 3. {重點3}",
    variables: ["主題", "重點1", "重點2", "重點3"],
  },
  {
    name: "問句鉤子",
    category: "互動",
    template: "如果 {假設情境},你會 {選擇A} 還是 {選擇B}?",
    variables: ["假設情境", "選擇A", "選擇B"],
  },
  {
    name: "反直覺結論",
    category: "對比",
    template: "{主流觀念} 聽起來合理,但實際上往往是錯的。原因是...",
    variables: ["主流觀念"],
  },
  {
    name: "Before / After",
    category: "對比",
    template:
      "Before:{以前狀態} → After:{現在狀態}。中間我做了 {關鍵改變}。",
    variables: ["以前狀態", "現在狀態", "關鍵改變"],
  },
  {
    name: "新聞時事鉤",
    category: "時事",
    template:
      "最近 {新聞主題} 鬧得很大,但很多人忽略了一個關鍵點:{觀點}。",
    variables: ["新聞主題", "觀點"],
  },
];

async function main() {
  console.log(`Seeding ${DEFAULTS.length} hook templates...`);

  for (const hook of DEFAULTS) {
    // 用 name + isGlobal 當唯一性檢查
    const existing = await db.hookTemplate.findFirst({
      where: { name: hook.name, isGlobal: true },
    });
    if (existing) {
      console.log(`  ⊘ skip: ${hook.name}`);
      continue;
    }
    await db.hookTemplate.create({
      data: {
        name: hook.name,
        category: hook.category,
        template: hook.template,
        variables: hook.variables,
        isGlobal: true,
      },
    });
    console.log(`  ✓ ${hook.name}`);
  }

  const count = await db.hookTemplate.count();
  console.log(`Total hook templates: ${count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
