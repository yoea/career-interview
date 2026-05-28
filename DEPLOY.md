# 部署指南

## 最简部署（推荐）

只需 3 步，一个 Node.js 进程搞定一切（静态文件 + B站 API 代理）。

### 1. 构建

```bash
cd /home/ethan/career-interview
npm install
npm run build
```

### 2. 启动

```bash
node server.mjs
```

默认端口 3000，可通过 `PORT=8080 node server.mjs` 修改。

### 3. 访问

```
http://你的服务器IP:3000
```

## 用 systemd 做持久化（可选）

```bash
sudo tee /etc/systemd/system/career-interview.service << 'EOF'
[Unit]
Description=Career Interview Server
After=network.target

[Service]
Type=simple
WorkingDirectory=/home/ethan/career-interview
ExecStart=/usr/bin/node server.mjs
Restart=always
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now career-interview
```

## 用 nginx 反代（可选，如需 80/443 端口）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # B站 API 代理
    location /api/bili/ {
        proxy_pass https://api.bilibili.com/;
        proxy_set_header Host api.bilibili.com;
        proxy_set_header Referer https://www.bilibili.com;
        proxy_set_header User-Agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
    }

    # 静态文件
    location / {
        root /home/ethan/career-interview/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

## 更新数据

手动刷新 B站视频数据：

```bash
cd /home/ethan/career-interview
npm run fetch
npm run build
```

前端也会自动在浏览器端每 7 天静默刷新一次（通过 API 代理），无需手动操作。
