# 部署指南

## 目标环境

- **服务器**: 腾讯云 (ten-xhit-OS)
- **域名**: ccca.xhef.org
- **端口**: 13682 (Node.js) → nginx 443 (HTTPS)
- **项目目录**: /opt/xhef-career-interview/ccca.xhef.org/
- **数据库**: PostgreSQL 17（MaxKB 容器复用，career_interview 库）

## 从 X96Max 部署

```bash
cd ~/projects/career-interview
./deploy/deploy-ccca.sh
```

脚本自动执行：
1. `npm run build` 构建
2. `rsync dist/` → 腾讯云（排除 server.mjs / ecosystem.config.cjs / node_modules）
3. 检测 server 端文件变更，按需上传 server.mjs / visits.js / ecosystem.config.cjs
4. `pm2 restart`
5. 健康检查

## 服务器目录结构

```
/opt/xhef-career-interview/ccca.xhef.org/
├── server.mjs              # Node.js 服务（静态文件 + B站 API 代理 + 访问统计）
├── visits.js               # PostgreSQL 访问记录模块
├── ecosystem.config.cjs    # pm2 配置（port 13682, name: ccca-career-interview）
├── package.json            # pg 依赖
├── node_modules/           # npm 依赖
├── index.html
├── assets/                 # 构建产物（JS/CSS）
├── data/videos.json        # 视频数据
├── acca.png                # 站点图标
├── wechat-qr.png           # 微信二维码
├── xhef-logo.png           # 基金会 LOGO
└── ...
```

## Nginx 配置

路径: `/etc/nginx/conf.d/ccca.xhef.org.conf`

```nginx
server {
    listen 80;
    server_name ccca.xhef.org;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    http2 on;
    server_name ccca.xhef.org;

    ssl_certificate      /etc/nginx/cert/ccca.xhef.org-FullSSL.crt;
    ssl_certificate_key  /etc/nginx/cert/ccca.xhef.org-SSL.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:1m;
    ssl_session_timeout 10m;
    ssl_session_tickets on;

    add_header Strict-Transport-Security "max-age=31536000" always;

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1000;

    # 静态资源 — nginx 直接服务，30天缓存
    location /assets/ {
        alias /opt/xhef-career-interview/ccca.xhef.org/assets/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location /data/ {
        alias /opt/xhef-career-interview/ccca.xhef.org/data/;
        expires 7d;
        add_header Cache-Control "public";
        access_log off;
    }

    location ~* \.(ico|png|svg|xml|webmanifest)$ {
        root /opt/xhef-career-interview/ccca.xhef.org;
        expires 30d;
        add_header Cache-Control "public";
        access_log off;
    }

    # 其余 → Node.js
    location / {
        proxy_pass http://127.0.0.1:13682;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 数据库（访问量统计）

复用 MaxKB 的 PostgreSQL 容器，独立库 `career_interview`：

```bash
# 连接信息
Host: 127.0.0.1:5432
User: root
Password: Password123@postgres
Database: career_interview
```

```sql
-- visits 表结构
CREATE TABLE visits (
  id BIGSERIAL PRIMARY KEY,
  ip VARCHAR(45),
  ua TEXT,
  route VARCHAR(500),
  referer TEXT,
  method VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

API 端点：
- `POST /api/visit` — 记录访问（body: `{ "route": "/path" }`）
- `GET /api/visit/count` — 返回 `{ "count": N }`

## 更新数据

```bash
cd ~/projects/career-interview
npm run fetch              # 刷新 B站视频数据
./deploy/deploy-ccca.sh    # 构建并部署
```

## Git Remote

| Remote | 地址 | 用途 |
|--------|------|------|
| origin | git@github.com:yoea/career-interview.git | GitHub（触发 Vercel 构建） |
| gitea | ssh://git@101.132.172.82:15022/yoea/career-interview.git | Gitea 备份 |
