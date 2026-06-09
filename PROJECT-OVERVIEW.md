# 寻路记 · 新华生涯访谈 — 项目总览

> 公益生涯教育视频平台，展示 B站「新华生涯教育 | 生涯人物访谈系列」合集。
> 线上地址：https://ccca.xhef.org

---

## 1. 项目概况

| 维度 | 说明 |
|------|------|
| 项目名称 | 寻路记 · 新华生涯访谈 |
| 所属体系 | 织吾涯 · 新华生涯教育 CCCA 体系（咨询支柱） |
| 发起机构 | 浙江省新华爱心教育基金会 |
| 运营机构 | 青少年发展研究中心 |
| 域名 | ccca.xhef.org |
| 数据源 | B站合集 season_id=131230, UID=395341214（新华教育基金会） |
| 视频数量 | 117 期生涯人物访谈 |
| 职业分类 | 16 个大类，70 个细类话题 |

---

## 2. 技术栈

| 层 | 技术 |
|----|------|
| 前端框架 | React 19 + React Router 7 |
| 构建工具 | Vite 8 |
| UI 组件 | Ant Design 6 + Font Awesome 7 |
| 样式 | SCSS Modules（组件级隔离） |
| 后端 | Node.js 原生 HTTP Server（server.mjs） |
| 数据库 | PostgreSQL 17（访问量统计） |
| 进程管理 | pm2 |
| 反向代理 | Nginx（HTTPS + gzip + 静态资源直出 + 30天缓存） |
| 部署目标 | 腾讯云 ten-xhit-OS（119.45.23.156） |

---

## 3. 项目结构

```
career-interview/
├── index.html                     # 入口 HTML（含 OG 标签，社交分享优化）
├── vite.config.js                 # Vite 配置（B站 API 代理、构建时间注入）
├── vercel.json                    # Vercel 部署配置（SPA rewrites + API routes）
├── package.json                   # 依赖与脚本
│
├── src/
│   ├── main.jsx                   # React 入口（Ant Design ConfigProvider + 中文 locale）
│   ├── App.jsx                    # 根组件（路由定义 + Header/Footer 布局）
│   ├── App.module.scss            # 全局布局样式
│   │
│   ├── components/                # 公共组件
│   │   ├── Header.jsx             # 顶部导航（5个菜单项：首页/访谈/分类/话题/关于）
│   │   ├── Hero.jsx               # 首页英雄区（标语 + CTA 按钮）
│   │   ├── Features.jsx           # 首页概况卡片区（视频数/分类数/话题数/学生主导）
│   │   └── Footer.jsx             # 页脚（品牌/链接/社交/邮箱/访问量/备案号）
│   │   └── *.module.scss          # 对应样式文件
│   │
│   ├── pages/                     # 页面组件
│   │   ├── Home/                  # 首页 = Hero + Features
│   │   ├── Interviews/            # 访谈列表（搜索/分类筛选/排序/分页/12条每页）
│   │   ├── Categories/            # 职业分类（16个大类卡片，每类显示视频数）
│   │   ├── Topics/                # 热门话题（词云式标签，按数量/名称排序）
│   │   ├── About/                 # 关于我们（项目信息/CCCA体系/基金会介绍）
│   │   ├── Terms/                 # 用户协议
│   │   └── Privacy/               # 隐私政策
│   │
│   ├── services/
│   │   └── videos.service.js      # 核心数据服务（326行）
│   │                              # - 从 public/data/videos.json 加载静态数据
│   │                              # - 后台静默刷新 B站 API（更新播放/评论数）
│   │                              # - 职业提取 + 分类匹配 + 话题归一化
│   │                              # - 发布/订阅模式通知组件更新
│   │
│   ├── config/
│   │   ├── categories.json        # 16 个职业大类（name/icon/keywords/color）
│   │   └── topics.json            # 70 个话题细类（topic/keywords[]）
│   │
│   ├── hooks/
│   │   └── useVisitTracker.js     # 路由变化时 POST /api/visit 记录访问
│   │
│   └── styles/
│       └── global.scss            # 全局样式（reset + 字体 + 基础变量）
│
├── public/
│   ├── data/videos.json           # B站视频数据（117条，fetch-bilibili.mjs 生成）
│   ├── acca.png                   # 站点图标
│   ├── wechat-qr.png              # 微信公众号二维码
│   ├── xhef-logo.png              # 基金会 LOGO
│   ├── favicon.ico / apple-touch-icon.png / icons.svg
│
├── api/                           # Vercel Serverless Functions
│   ├── bili/[...path].js          # B站 API 代理（/api/bili/* → api.bilibili.com/*）
│   └── wechat-qr.js               # 微信二维码图片代理（OSS → Vercel Edge）
│
├── deploy/
│   ├── deploy-ccca.sh             # 一键部署脚本（build → rsync → 上传server → pm2 restart → 健康检查）
│   ├── server.mjs                 # 生产服务器（静态文件 + B站 API 代理 + 访问统计 API）
│   ├── visits.js                  # PostgreSQL 访问记录模块（recordVisit / getVisitCount）
│   ├── ecosystem.config.cjs       # pm2 配置（name: ccca-career-interview, port: 13682）
│   ├── DEPLOY.md                  # 部署详细文档
│   └── scripts/
│       └── fetch-bilibili.mjs     # B站数据抓取（合集 → 逐个视频详情 → JSON）
│
└── dist/                          # 构建产物
```

---

## 4. 数据流

```
B站 API (api.bilibili.com)
       │
       ├─→ fetch-bilibili.mjs ──→ public/data/videos.json (静态数据，手动更新)
       │                                  │
       │                                  │ fetch (运行时加载)
       │                                  ▼
       │                          videos.service.js
       │                          ├─ 职业提取（正则 + 手动覆盖表）
       │                          ├─ 话题归一化（topics.json 关键词匹配）
       │                          ├─ 大类分类（categories.json 关键词匹配）
       │                          └─ 发布/订阅通知组件
       │                                  │
       │                                  ▼
       │                     React 组件（Interviews/Categories/Topics/Features）
       │
       └─→ 后台静默刷新 (运行时) ──→ 仅更新 play/comment 数，不覆盖已有数据
```

**数据更新流程：**
1. `npm run fetch` → fetch-bilibili.mjs 抓取 B站合集全部视频详情 → 写入 `public/data/videos.json`
2. `npm run build` → Vite 构建，videos.json 复制到 dist/
3. `./deploy/deploy-ccca.sh` → rsync 到腾讯云 → pm2 restart

**运行时行为：**
- 页面加载时先从 `/data/videos.json` 读取静态数据（秒开）
- 2秒后后台静默请求 B站 API，仅更新播放量/评论数等动态字段
- 10分钟内不重复刷新（localStorage 缓存）

---

## 5. 核心功能

### 5.1 视频浏览（Interviews 页）
- 搜索：按标题/职业关键词
- 筛选：按职业大类（16类）或话题细类（70类）
- 排序：最新/最热/最短/最长
- 分页：12条/页
- URL 参数同步：支持 `?category=教育`、`?broad=科技·互联网`、`?topic=律师` 深链接

### 5.2 职业分类（Categories 页）
- 16 个大类卡片，每类独立配色 + Font Awesome 图标
- 显示每个分类下的视频数量
- 点击跳转到 Interviews 页并自动筛选

### 5.3 热门话题（Topics 页）
- 词云式标签展示，字号按视频数量动态缩放
- 支持搜索和排序（按数量/按名称）
- 点击跳转到 Interviews 页并自动筛选

### 5.4 访问量统计
- 每次路由变化自动 POST `/api/visit`（记录 IP/UA/路由/时间）
- 页脚展示总访问量（`GET /api/visit/count`）
- PostgreSQL 存储，visits 表含 created_at 和 route 索引

### 5.5 社交分享优化
- index.html 含完整 OG 标签（title/description/image/url）
- 微信专用 itemprop 标签
- OG 图使用 acca.png

---

## 6. 分类体系

### 职业大类（16 类）

| 大类 | 图标 | 颜色 | 关键词示例 |
|------|------|------|-----------|
| 教育 | graduation-cap | #f5222d | 教师、校长、教授、生涯规划 |
| 科技·互联网 | laptop-code | #fa541c | 程序员、人工智能、芯片、产品经理 |
| 法律 | scale-balanced | #fa8c16 | 律师、检察官、法官 |
| 科研·学术 | flask | #d4b106 | 科研、博士、学者、科普 |
| 农业 | seedling | #52c41a | 农业、牧业、农场 |
| 企业·创业 | building | #13c2c2 | 企业家、创业、民营、总经理 |
| 金融·财务 | chart-line | #1677ff | 银行、金融、保险、税务 |
| 媒体·传媒 | bullhorn | #2f54eb | 记者、主持、传媒、摄影师 |
| 公务·公共安全 | shield-halved | #722ed1 | 公务员、警察、消防、飞行员 |
| 医疗健康 | stethoscope | #eb2f96 | 医生、中医、护士、医药 |
| 心理咨询 | heart-pulse | #a0d911 | 心理咨询师、心理教师 |
| 文化·艺术 | pen-nib | #096dd9 | 诗人、作家、书法、非遗、街舞 |
| 环保·公益 | seedling | #08979c | 环保、再生、公益、珍珠 |
| 军旅 | helmet-safety | #c41d7f | 军人、维和、老兵 |
| 工程·制造 | wrench | #ad6800 | 设备、化工、工程、建筑、物流 |
| 数据·分析 | database | #389e0d | 数据分析、数据管理 |

### 话题细类（70 类）
详见 `src/config/topics.json`，覆盖从高中教师到乡村自媒体创作者等 70 个具体职业话题。

---

## 7. 部署架构

```
X96Max (开发机)                    腾讯云 ten-xhit-OS (生产)
┌──────────────────┐              ┌──────────────────────────────┐
│ ~/projects/      │   deploy.sh  │ /opt/xhef-career-interview/  │
│ career-interview │─────────────→│ ccca.xhef.org/               │
│                  │  rsync dist/ │   ├── server.mjs (pm2:13682) │
│ npm run build    │  + server    │   ├── visits.js (PostgreSQL) │
│ npm run fetch    │  files       │   ├── dist/* (静态文件)       │
└──────────────────┘              │   └── data/videos.json       │
                                  └──────────┬───────────────────┘
                                             │
                                  ┌──────────▼───────────────────┐
                                  │ Nginx (443 HTTPS)            │
                                  │ /assets/ → 直出 (30d缓存)    │
                                  │ /data/   → 直出 (7d缓存)     │
                                  │ /*       → proxy :13682      │
                                  └──────────────────────────────┘
```

**一键部署命令：**
```bash
cd ~/projects/career-interview
./deploy/deploy-ccca.sh
```

**部署脚本流程：**
1. `npm run build` — Vite 构建到 dist/
2. `rsync dist/` → 腾讯云（排除 server 配置文件）
3. 检测 server.mjs / visits.js / ecosystem.config.cjs 是否变更，按需上传
4. `pm2 restart ccca-career-interview`
5. 健康检查 `curl http://127.0.0.1:13682/`

---

## 8. Git 信息

| 项 | 值 |
|----|-----|
| 主分支 | main |
| Remote (主) | origin → git@github.com:yoea/career-interview.git |
| Remote (备份) | gitea → ssh://...Gitea备份 |
| 本地目录 | ~/projects/career-interview |

---

## 9. 脚本命令

| 命令 | 用途 |
|------|------|
| `npm run dev` | 开发服务器（localhost:5173，B站 API 自动代理） |
| `npm run build` | 构建到 dist/ |
| `npm run fetch` | 刷新 B站视频数据到 public/data/videos.json |
| `npm run preview` | 预览构建产物 |
| `./deploy/deploy-ccca.sh` | 一键部署到腾讯云 |

---

## 10. 页面路由

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | 首页 | Hero 区 + 概况统计卡片 |
| `/interviews` | 访谈内容 | 视频列表，支持搜索/筛选/排序/分页 |
| `/categories` | 职业分类 | 16 大类卡片展示 |
| `/topics` | 热门话题 | 70 细类词云标签 |
| `/about` | 关于我们 | 项目/基金会/CCCA体系介绍 |
| `/terms` | 用户协议 | 法律条款 |
| `/privacy` | 隐私政策 | 数据收集说明 |

---

## 11. 代码规模

| 范围 | 行数 |
|------|------|
| src/ 全部（jsx + js + scss + json） | ~3,170 行 |
| deploy/（server + visits + deploy + fetch） | ~400 行 |
| api/（Vercel serverless） | ~55 行 |
| 项目源码总计（不含 dist/node_modules） | ~3,600 行 |

---

*生成时间：2026-06-09*
