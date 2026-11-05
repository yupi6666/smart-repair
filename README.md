# 智能报修小助手（smart-repair）

两人协同开发的设备报修系统：提交报修单 → AI 自动生成自助排查建议 → 工单列表跟踪处理状态。

## 技术栈

- Next.js 14（App Router）+ TypeScript
- Tailwind CSS
- Supabase（PostgreSQL，表 `tickets`）
- AI：DeepSeek（配置 `DEEPSEEK_API_KEY` 时启用）；未配置时自动降级到免费模型，保证演示可用

## 页面与功能

| 页面 | 路径 | 功能 |
| --- | --- | --- |
| 报修表单 | `/` | 姓名、办公区（A/B/C）、设备类型（电脑/打印机/投影仪）、故障描述 |
| 工单列表 | `/tickets` | 全部工单、按状态筛选、切换状态、数据源提示 |
| 工单详情 | `/tickets/[id]` | 完整信息 + AI 排查建议 + 重新生成建议 |

## 接口契约（提前约定，不得更改）

`POST /api/suggest`

请求体：

```json
{ "deviceType": "打印机", "description": "进纸卡住" }
```

响应体：

```json
{ "suggestions": ["建议1", "建议2", "建议3"] }
```

## 本地运行

```bash
npm install
cp .env.example .env.local   # 按需填写密钥
npm run dev
```

打开 http://localhost:3000。

## 环境变量

| 变量 | 说明 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key |
| `DEEPSEEK_API_KEY` | DeepSeek API Key（可选） |

`.env.local` 已在 `.gitignore` 中，不会进入仓库。

## 数据库初始化

在 Supabase SQL Editor 中执行 [supabase/schema.sql](supabase/schema.sql)。

> 未配置数据库或数据库暂不可达时，前端自动回退到浏览器 localStorage，保证页面与流程可用。

## 分工

- 小A：界面与上线（表单页、列表页、详情页、Vercel 部署、域名绑定）
- 小B：数据与 AI（Supabase 建表与读写、`/api/suggest` 接口、日志排错）

协作规则：任何人不得直接推送 `main`；一律切分支 → 提交 → 提 Pull Request → 对方审核 → 合并。
