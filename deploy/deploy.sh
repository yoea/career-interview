#!/usr/bin/env bash
set -euo pipefail

# ─── Config ───────────────────────────────────────────────────────
REMOTE="fischerecs"
REMOTE_DIR="/opt/1panel/www/sites/career.ewing.top"
SUDO_PASS="kaelvean"

# ─── Colors ───────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'
info() { echo -e "${GREEN}▸${NC} $*"; }
warn() { echo -e "${YELLOW}▸${NC} $*"; }

cd "$(dirname "$0")/.."

# Step 1: Build
info "构建中..."
npm run build 2>&1 | tail -3

# Step 2: Upload static files
info "上传 dist/..."
rsync -avz --delete dist/ "$REMOTE:/tmp/career-dist/" 2>/dev/null | tail -1
ssh "$REMOTE" "echo $SUDO_PASS | sudo -S cp -r /tmp/career-dist/* $REMOTE_DIR/index/"
info "静态文件上传完成"

# Step 3: Upload server files (only if changed)
NEED_RESTART=false

for f in deploy/server.mjs deploy/ecosystem.config.cjs; do
  LOCAL_HASH=$(md5sum "$f" 2>/dev/null | cut -d' ' -f1)
  BASENAME=$(basename "$f")
  REMOTE_HASH=$(ssh "$REMOTE" "md5sum $REMOTE_DIR/$BASENAME 2>/dev/null | cut -d' ' -f1" || true)
  if [ "$LOCAL_HASH" != "$REMOTE_HASH" ]; then
    info "上传 $BASENAME（有变更）..."
    scp "$f" "$REMOTE:/tmp/$BASENAME" 2>/dev/null
    ssh "$REMOTE" "echo $SUDO_PASS | sudo -S cp /tmp/$BASENAME $REMOTE_DIR/$BASENAME"
    NEED_RESTART=true
  fi
done

# Step 4: Restart pm2 if needed
if $NEED_RESTART; then
  warn "重启 pm2..."
  ssh "$REMOTE" "pm2 restart career-interview" 2>/dev/null | grep -E 'status|online'
else
  info "服务端文件无变更，跳过重启"
fi

# Step 5: Verify
STATUS=$(ssh "$REMOTE" "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:35173/")
if [ "$STATUS" = "200" ]; then
  info "部署完成！https://career.ewing.top:35173 ✓"
else
  warn "健康检查失败（HTTP $STATUS），请检查 pm2 日志"
fi
