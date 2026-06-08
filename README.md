# 寻路记 · 新华生涯访谈

公益生涯教育视频平台，展示 B站生涯人物访谈视频。对话生涯人物，指引自我人生。

🔗 线上地址：https://ccca.xhef.org

## 技术栈

- **前端**：React 19 + Vite + SCSS Modules + Ant Design + Font Awesome
- **数据源**：Bilibili 合集 (season 131230)
- **后端**：Node.js (server.mjs) 静态文件服务 + B站 API 代理
- **数据库**：PostgreSQL（访问量统计）
- **部署**：pm2 进程管理 + Nginx 反代 + HTTPS

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
│   ├── hooks/         # 自定义 hooks (useVisitTracker)
│   ├── services/
│   │   └── videos.service.js  # 视频数据服务（处理、分类、导出）
│   ├── config/
│   │   ├── categories.json    # 职业分类规则（16个大类，含颜色）
│   │   └── topics.json        # 话题分类规则（70个细类）
│   └── styles/        # 全局样式
├── public/
│   ├── data/
│   │   └── videos.json        # B站视频数据（运行时 fetch 读取）
│   ├── acca.png               # 站点图标
│   ├── wechat-qr.png          # 微信公众号二维码
│   └── xhef-logo.png          # 基金会 LOGO
├── deploy/
│   ├── deploy-ccca.sh         # 部署到腾讯云 ccca.xhef.org
│   ├── server.mjs             # 生产服务器（静态文件 + API 代理 + 访问统计）
│   ├── visits.js              # PostgreSQL 访问记录模块
│   ├── ecosystem.config.cjs   # pm2 配置
│   ├── DEPLOY.md              # 部署详细文档
│   └── scripts/
│       └── fetch-bilibili.mjs # B站数据抓取脚本
└── index.html                 # 入口 HTML（含 OG 标签）
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

## 功能特性

- 📺 访谈视频浏览，支持搜索、分类筛选、排序
- 🏷️ 16 个职业大类，70 个热门话题，每类独立配色
- 📊 访问量统计（PostgreSQL 存储，记录 IP/UA/路由/时间）
- 📱 移动端自适应，桌面/移动双布局
- 🔗 分享优化：OG 标签、微信/微博分享卡片
- ⚡ Nginx 静态资源直出 + gzip + 30天缓存

## 分类规则修改

### 职业分类（大类）

编辑 `src/config/categories.json`：

```json
{
  "name": "教育",
  "icon": "graduation-cap",
  "color": "#f5222d",
  "keywords": ["教师", "校长", "教授"]
}
```

### 话题分类（细类）

编辑 `src/config/topics.json`：

```json
{ "topic": "高中教师", "keywords": ["高中教师", "高中数学教师"] }
```

修改后重新构建部署即可。

## 部署

```bash
./deploy/deploy-ccca.sh    # 部署到腾讯云 ccca.xhef.org
```

详细部署文档见 [deploy/DEPLOY.md](deploy/DEPLOY.md)。

## 关于

本项目是 [浙江省新华爱心教育基金会](https://www.xhef.org)「织吾涯·新华生涯教育」的子系统，由公益数字化团队开发维护。
