# 寻路记 · 新华生涯访谈

公益生涯教育视频平台，展示 95 期 B站生涯人物访谈视频。对话生涯人物，指引自我人生。

🔗 线上地址：https://career.ewing.top

## 技术栈

- **前端**：React 19 + Vite + SCSS Modules + Ant Design + Font Awesome
- **数据源**：Bilibili 合集 (season 131230)
- **部署**：Node.js 静态服务器 + B站 API 代理，pm2 进程管理

## 快速开始

```bash
npm install
npm run dev      # 开发服务器 http://localhost:5173
npm run build    # 构建到 dist/
```

## 项目结构

```
├── src/
│   ├── components/    # 公共组件 (Header, Footer, Hero, Features)
│   ├── pages/         # 页面 (首页, 访谈列表, 分类, 话题, 关于, 条款, 隐私)
│   ├── data/          # 视频数据 + 缓存/刷新逻辑
│   ├── config/        # 配置 (话题分类规则)
│   └── styles/        # 全局样式
├── public/            # 静态资源 (logo, favicon)
├── deploy/            # 部署相关
│   ├── deploy.sh      # 一键部署脚本
│   ├── server.mjs     # 生产服务器 (静态文件 + API 代理)
│   ├── ecosystem.config.cjs  # pm2 配置
│   ├── DEPLOY.md      # 部署指南
│   └── scripts/
│       └── fetch-bilibili.mjs  # B站数据抓取脚本
└── index.html         # 入口 HTML
```

## 部署

```bash
bash deploy/deploy.sh
```

详细说明见 [deploy/DEPLOY.md](deploy/DEPLOY.md)。

## 数据更新

```bash
npm run fetch    # 从 B站刷新视频数据
npm run build    # 重新构建
```

前端也会自动在浏览器端每小时静默刷新一次（通过 API 代理）。

## 关于

本项目是 [浙江省新华爱心教育基金会](https://www.xhef.org)「织吾涯·新华生涯教育」的子系统，由公益数字化团队开发维护。
