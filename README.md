# SocialBot

社群媒體內容管理平台 — 建立多個品牌人設，AI 生成文章，排程發布至 Facebook、Instagram、Threads、Twitter、LinkedIn。

## 功能
- **多人設管理**：每個 Identity 有獨立的語氣、受眾設定、系統 Prompt、禁用詞
- **AI 文章生成**：SocialMaster Agent 依人設風格生成貼文
- **Hook 模板庫**：常用開場白模板，提升互動率
- **排程發布**：設定發布時間，自動送出至各平台
- **發布結果追蹤**：記錄每篇文章各平台的發布狀態與外部連結
- **媒體庫**：集中管理圖片、影片資源

## 技術棧
- Next.js（App Router）+ TypeScript
- Prisma + PostgreSQL
- Docker Compose

## 支援平台
Facebook · Instagram · Threads · Twitter/X · LinkedIn

## 快速開始
```bash
cp .env.example .env
npm install
npm run dev
```
