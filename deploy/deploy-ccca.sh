#!/usr/bin/env bash
set -euo pipefail

# ─── Config ───────────────────────────────────────────────────────
TOS_HOST="xhefer@119.45.23.156"
TOS_KEY="$HOME/.ssh/id_rsa_xhefer_tencentos"
REMOTE_DIR="/opt/xhef-career-interview/ccca.xhef.org"
SSH="ssh -i $TOS_KEY $TOS_HOST"
SCP="scp -i $TOS_KEY"

# ─── Colors ───────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'
info() { echo -e "${GREEN}▸${NC} $*"; }
warn() { echo -e "${YELLOW}▸${NC} $*"; }
fail() { echo -e "${RED}▸${NC} $*"; exit 1; }

cd "$(dirname "$0")/.."

# Step 1: Build
info "构建中..."
npm run build 2>&1 | tail -3

# Step 2: rsync dist → TOS (exclude server configs)
info "同步 dist/ → 腾讯云..."
rsync -avz --delete \
  --exclude='server.mjs' \
  --exclude='ecosystem.config.cjs' \
  --exclude='node_modules' \
  --exclude='package.json' \
  --exclude='package-lock.json' \
  dist/ \
  -e "ssh -i $TOS_KEY" \
  "$TOS_HOST:$REMOTE_DIR/" 2>&1 | tail -1

# Step 2.5: Upload server-side files if changed
for f in deploy/server.mjs deploy/visits.js deploy/ecosystem.config.cjs; do
  LOCAL_HASH=$(md5sum "$f" 2>/dev/null | cut -d' ' -f1)
  BASENAME=$(basename "$f")
  REMOTE_HASH=$($SSH "md5sum $REMOTE_DIR/$BASENAME 2>/dev/null | cut -d' ' -f1" || true)
  if [ "$LOCAL_HASH" != "$REMOTE_HASH" ]; then
    info "上传 $BASENAME（有变更）..."
    scp -i $TOS_KEY "$f" "$TOS_HOST:$REMOTE_DIR/$BASENAME"
  fi
done

# Step 3: Restart pm2
info "重启 pm2..."
$SSH "pm2 restart ccca-career-interview" 2>/dev/null | grep -E 'status|online'

# Step 4: Verify
sleep 1
STATUS=$($SSH "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:13682/")
if [ "$STATUS" = "200" ]; then
  info "部署完成！https://ccca.xhef.org ✓"
else
  fail "健康检查失败（HTTP $STATUS），请检查 pm2 日志"
fi
