# account-app-web

Web 端（离线优先）实现，默认运行在 `local` 模式；后续可通过环境变量切换为后端接口模式。

## 启动

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

## 环境变量

复制 `.env.example` 到 `.env` 并按需修改：

- `VITE_DATA_MODE=local`：离线模式（默认）
- `VITE_DATA_MODE=remote`：接口模式（调用 `VITE_API_BASE_URL`）
- `VITE_API_BASE_URL=http://localhost:8080/api`：后端 API 根路径
