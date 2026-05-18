#!/usr/bin/env bash
# DB tunnel：本機 localhost:5433 → Oracle 137.131.7.230:5432
# 跑這個讓 prisma / dev server 可以連到 Oracle 上的 Postgres
set -e

SSH_KEY="$HOME/Documents/important file/ssh-key-2026-04-08.key"
LOCAL_PORT=5433
REMOTE_HOST=137.131.7.230
REMOTE_USER=ubuntu

# 已經有 tunnel 在跑就直接結束
if pgrep -fl "${LOCAL_PORT}:.*:5432" >/dev/null 2>&1; then
  echo "✓ 本機 ${LOCAL_PORT} 已有 tunnel"
  pgrep -fl "${LOCAL_PORT}:.*:5432"
  exit 0
fi

ssh -i "$SSH_KEY" -fN -L ${LOCAL_PORT}:127.0.0.1:5432 ${REMOTE_USER}@${REMOTE_HOST}
echo "✓ Tunnel 已啟動：localhost:${LOCAL_PORT} → ${REMOTE_HOST}:5432"
echo "  關閉：pkill -f '${LOCAL_PORT}:.*:5432'"
