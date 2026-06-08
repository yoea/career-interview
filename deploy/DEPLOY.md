# 部署指南

## 目标环境

- **服务器**: 腾讯云 (ten-xhit-OS)
- **域名**: ccca.xhef.org
- **端口**: 13682 (Node.js) → nginx 443 (HTTPS)
- **项目目录**: /opt/xhef-career-interview/ccca.xhef.org/

## 从 X96Max 部署

```bash
cd ~/projects/career-interview
./deploy/deploy-ccca.sh
```

脚本自动执行：构建 → rsync 到腾讯云（排除 server.mjs / ecosystem.config.cjs）→ pm2 restart → 健康检查。

## 服务器目录结构

```
/opt/xhef-career-interview/ccca.xhef.org/
├── server.mjs              # Node.js 服务（静态文件 + B站/微信 API 代理）
├── ecosystem.config.cjs    # pm2 配置（port 13682）
├── index.html
├── assets/                 # 构建产物（JS/CSS）
├── data/videos.json        # 视频数据
└── ...
```

## Nginx 配置

路径: `/etc/nginx/conf.d/ccca.xhef.org.conf`

- 80 → 301 到 HTTPS
- SSL 证书: `/etc/nginx/cert/ccca.xhef.org-*`
- `/assets/` 和 `/data/` 由 nginx 直接服务（30天/7天缓存）
- 其余请求 proxy_pass 到 127.0.0.1:13682

## 更新数据

```bash
cd ~/projects/career-interview
npm run fetch       # 刷新 B站视频数据
npm run build       # 重新构建
./deploy/deploy-ccca.sh  # 部署
```
