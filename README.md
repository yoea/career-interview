# 寻路记 · 新华生涯访谈

公益生涯教育视频平台，展示 B站生涯人物访谈视频。对话生涯人物，指引自我人生。

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
│   ├── data/
│   │   └── videos.service.js  # 视频数据服务（处理、分类、导出）
│   ├── config/
│   │   ├── categories.json    # 职业分类规则（17个大类）
│   │   └── topics.json        # 话题分类规则（56个细类）
│   └── styles/        # 全局样式
├── public/
│   └── data/
│       └── videos.json        # B站视频数据（运行时 fetch 读取）
├── deploy/
│   ├── deploy.sh              # 一键部署脚本
│   ├── server.mjs             # 生产服务器（静态文件 + API 代理）
│   ├── ecosystem.config.cjs   # pm2 配置
│   └── scripts/
│       └── fetch-bilibili.mjs # B站数据抓取脚本
└── index.html         # 入口 HTML
```

## 数据架构

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  B站 API        │────▶│ fetch-bilibili   │────▶│ public/data/    │
│  (合集视频)     │     │ .mjs             │     │ videos.json     │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                                                          │ fetch (运行时)
                                                          ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ React 组件      │◀────│ videos.service.js│◀────│ categories.json │
│ (Interviews,    │     │ (处理、分类、    │     │ topics.json     │
│  Categories,    │     │  导出)           │     │ (分类规则)      │
│  Topics)        │     └──────────────────┘     └─────────────────┘
└─────────────────┘
```

### 关键文件说明

| 文件 | 运行环境 | 作用 |
|------|----------|------|
| `public/data/videos.json` | 服务器静态文件 | B站视频数据，前端 fetch 读取 |
| `src/data/videos.service.js` | 浏览器 | 处理数据、分类、导出给组件 |
| `src/config/categories.json` | 浏览器 | 职业分类规则，改分类改这里 |
| `src/config/topics.json` | 浏览器 | 话题分类规则，改话题改这里 |
| `deploy/scripts/fetch-bilibili.mjs` | Node.js (服务器) | 抓取 B站数据，更新 videos.json |

## 数据更新

```bash
# 1. 抓取最新 B站数据
node deploy/scripts/fetch-bilibili.mjs

# 2. 部署（不需要重新构建，videos.json 是静态文件）
scp public/data/videos.json user@server:/path/to/public/data/
```

前端每次加载都会 fetch 最新的 `videos.json`，不需要重新构建。

## 部署

### 一键部署（推荐）

```bash
bash deploy/deploy.sh
```

脚本自动完成：构建 → 上传 dist → 同步服务端文件 → 按需重启 pm2 → 健康检查。

### 部署配置

编辑 `deploy/deploy.sh` 顶部：

```bash
REMOTE="fischerecs"                                    # SSH Host 别名（~/.ssh/config）
REMOTE_DIR="/opt/1panel/www/sites/career.ewing.top"    # 远程目录
SUDO_PASS="***"                                        # 服务器 sudo 密码
```

### 手动部署

```bash
npm run build
rsync -avz --delete dist/ YOUR_HOST:/tmp/career-dist/
ssh YOUR_HOST "sudo cp -r /tmp/career-dist/* /opt/1panel/www/sites/career.ewing.top/index/"
ssh YOUR_HOST "pm2 restart career-interview"
```

### 服务器架构

- 运行时：Node.js (server.mjs) + pm2 进程管理
- 端口：35173（内部），通过 1Panel/Nginx 反代到 443
- 域名：career.ewing.top / career.xhef.org
- 目录：`/opt/1panel/www/sites/career.ewing.top/`
  - `index/` — 静态文件（dist 构建产物）
  - `server.mjs` — 生产服务器
  - `ecosystem.config.cjs` — pm2 配置

## 分类规则修改

### 职业分类（大类）

编辑 `src/config/categories.json`：

```json
[
  { "name": "教育", "icon": "graduation-cap", "keywords": ["教师", "校长", "教授"] },
  { "name": "科技·互联网", "icon": "laptop-code", "keywords": ["程序员", "软件", "人工智能"] }
]
```

### 话题分类（细类）

编辑 `src/config/topics.json`：

```json
[
  { "topic": "高中教师", "keywords": ["高中教师", "高中数学教师"] },
  { "topic": "软件工程师", "keywords": ["程序员", "软件", "计算机"] }
]
```

修改后重新构建部署即可。

## 关于

本项目是 [浙江省新华爱心教育基金会](https://www.xhef.org)「织吾涯·新华生涯教育」的子系统，由公益数字化团队开发维护。
