#!/usr/bin/env bash
# SocialBot 部署腳本
# 用法:
#   ./scripts/deploy.sh            # 一般更新(rsync + build + restart)
#   ./scripts/deploy.sh --logs     # 部署後追蹤 log
#   ./scripts/deploy.sh --skip-build  # 只 rsync,不重 build

set -euo pipefail

# ===== 設定 =====
SSH_KEY="${SSH_KEY:-$HOME/Documents/important file/ssh-key-2026-04-08.key}"
REMOTE_USER="ubuntu"
REMOTE_HOST="137.131.7.230"
REMOTE_PATH="/www/wwwroot/socialbot.looptw.com"
PM2_NAME="socialbot-web"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ===== 顏色 =====
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${BLUE}▶${NC} $*"; }
ok()  { echo -e "${GREEN}✓${NC} $*"; }
warn(){ echo -e "${YELLOW}⚠${NC} $*"; }
err() { echo -e "${RED}✗${NC} $*"; exit 1; }

SKIP_BUILD=false
FOLLOW_LOGS=false
for arg in "$@"; do
  case "$arg" in
    --skip-build) SKIP_BUILD=true ;;
    --logs) FOLLOW_LOGS=true ;;
  esac
done

# ===== Pre-flight =====
[ -f "$SSH_KEY" ] || err "SSH key 不存在: $SSH_KEY"
[ -d "$LOCAL_DIR" ] || err "Local dir 不存在: $LOCAL_DIR"

log "Local dir: $LOCAL_DIR"
log "Remote:    $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH"

# ===== 安全檢查 =====
log "掃描 secrets..."
if git -C "$LOCAL_DIR" diff --cached 2>/dev/null | \
   grep -iE "(ghp_|sk-[a-zA-Z0-9]{20}|AKIA[0-9A-Z]{16}|BEGIN [A-Z ]+PRIVATE KEY)" > /dev/null; then
  err "偵測到可能洩漏的 secret,請先處理"
fi
ok "Secret 檢查通過"

# ===== Rsync =====
log "同步檔案..."
rsync -avz --delete \
  -e "ssh -i '$SSH_KEY' -o StrictHostKeyChecking=accept-new" \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude '.env' \
  --exclude '.env.local' \
  --exclude '.DS_Store' \
  --exclude '*.log' \
  --exclude 'scripts/' \
  --exclude '.well-known/' \
  --exclude '.htaccess' \
  --exclude '.user.ini' \
  "$LOCAL_DIR/" \
  "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/" 2>&1 | tail -3 || true
ok "同步完成"

# ===== 遠端 build + restart =====
log "VPS 上 install / build / restart..."
ssh -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "bash -s" << REMOTE
set -e
export NVM_DIR="/www/server/nvm"
\\. "\$NVM_DIR/nvm.sh"
nvm use 24.14.1 > /dev/null
cd $REMOTE_PATH

echo "▶ npm install"
npm install --no-audit --no-fund 2>&1 | tail -3

if [ "$SKIP_BUILD" != "true" ]; then
  echo "▶ prisma generate"
  npx prisma generate 2>&1 | tail -2

  echo "▶ npm run build"
  npm run build 2>&1 | tail -10
fi

echo "▶ pm2 restart"
pm2 restart $PM2_NAME --update-env
pm2 save > /dev/null

sleep 3
echo "▶ Health check"
curl -sI http://127.0.0.1:3006 | head -1
REMOTE

ok "部署完成"

# ===== 外部驗證 =====
log "驗證 https://socialbot.looptw.com..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -m 10 https://socialbot.looptw.com/ || echo "000")
if [ "$STATUS" = "307" ] || [ "$STATUS" = "200" ]; then
  ok "外部訪問正常 (HTTP $STATUS)"
else
  warn "外部訪問異常 (HTTP $STATUS) - 檢查 pm2 logs"
fi

# ===== Logs =====
if [ "$FOLLOW_LOGS" = true ]; then
  log "追蹤 PM2 logs (Ctrl+C 離開)..."
  ssh -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" \
    "pm2 logs $PM2_NAME --lines 20"
fi

echo ""
ok "🚀 https://socialbot.looptw.com"
