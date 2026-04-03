# Pacta Chain Journal

## 当前架构

- 前端：Vite + React + React Router
- 后端：同一套 Node API 处理器，同时支持本地 `mock-api/server.mjs` 和 Vercel Serverless
- 数据库：Supabase
- 前端请求入口：统一走 `/api`
- 本地开发时：Vite 通过代理把 `/api` 转发到 `http://localhost:8787`
- Vercel 部署时：`/api/*` 直接命中 [api/[...route].mjs](file:///Users/susanban/pacta-chain-journal/api/%5B...route%5D.mjs)

## 本地开发

```bash
npm install
npm run dev:full
```

- 前端默认运行在 `http://localhost:8082`，端口占用时会自动顺延
- API 默认运行在 `http://localhost:8787`
- 默认 `.env` 使用 `PACTA_DATA_PROVIDER=file`，会把数据写入 `mock-api/.data/db.json`

## 切换到 Supabase

1. 在 Supabase 新建项目
2. 打开 SQL Editor，执行 [schema.sql](file:///Users/susanban/pacta-chain-journal/supabase/schema.sql)
3. 复制 `.env.example` 到 `.env.local` 或修改 `.env`
4. 填入：
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_PROJECT_REF`
5. 把 `PACTA_DATA_PROVIDER` 改成 `supabase`
6. 重新运行：

```bash
npm run dev:full
```

7. 如需灌入演示数据，可执行：

```bash
curl -X POST http://localhost:8787/api/demo/reset
```

## 部署到 Vercel

1. 把仓库推到 GitHub
2. 在 Vercel 导入这个仓库
3. Framework 选择会自动识别为 Vite
4. 在 Vercel Project Settings -> Environment Variables 中添加：
   - `PACTA_DATA_PROVIDER=supabase`
   - `VITE_API_BASE_URL=/api`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_PROJECT_REF`
5. 确认 Supabase 已执行 [schema.sql](file:///Users/susanban/pacta-chain-journal/supabase/schema.sql)
6. 点击 Deploy

部署完成后：

- 前端静态资源由 Vercel 托管
- API 由 [api/[...route].mjs](file:///Users/susanban/pacta-chain-journal/api/%5B...route%5D.mjs) 提供
- React Router 回退由 [vercel.json](file:///Users/susanban/pacta-chain-journal/vercel.json) 处理
- 服务端 API 会通过 [app.mjs](file:///Users/susanban/pacta-chain-journal/mock-api/app.mjs) 连接 Supabase

如果线上环境也要灌入演示数据，部署后调用：

```bash
curl -X POST https://你的域名/api/demo/reset
```

## 关键接口

- `GET /api/health`
- `GET /api/users/:wallet/dashboard`
- `POST /api/pacts`
- `POST /api/pacts/sync`
- `POST /api/checkins`
- `POST /api/pacts/:id/claim`
- `POST /api/demo/reset`

## 校验命令

```bash
npm test
npm run build
npm run lint
```
