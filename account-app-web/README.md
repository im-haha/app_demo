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

输出打包体积报告（raw / gzip / brotli）：

```bash
npm run build:report
```

体积预算门禁（超阈值构建失败）默认包含在 `build:report`。如需调整阈值，可在命令前设置：

```bash
BUDGET_MAX_MAIN_JS_GZIP_KB=12 \
BUDGET_MAX_VENDOR_REACT_GZIP_KB=48 \
BUDGET_MAX_TOTAL_GZIP_KB=70 \
BUDGET_MAX_TOTAL_BROTLI_KB=60 \
npm run build:report
```

## 环境变量

复制 `.env.example` 到 `.env` 并按需修改：

- `VITE_DATA_MODE=local`：离线模式（默认）
- `VITE_DATA_MODE=remote`：接口模式（调用 `VITE_API_BASE_URL`）
- `VITE_API_BASE_URL=http://localhost:8080/api`：后端 API 根路径

## 性能策略

- 路由级懒加载：按 `Auth/Home/Bills/Mine` 分 chunk
- 路由预加载：空闲时预取其他 Tab，Tab hover/focus 意图预取
- 关键链路优化：`remote` 模式下自动注入 `dns-prefetch + preconnect` 到 API 域名
- 预压缩产物：构建阶段生成 `.gz/.br` 文件，便于生产环境直接回源静态压缩资源

## 生产部署建议（缓存 + 压缩）

可直接参考 Nginx 示例配置：

- `deploy/nginx.conf.example`

核心策略：

- `/assets/*`（hash 文件）开启 `Cache-Control: public,max-age=31536000,immutable`
- `index.html` 使用 `no-cache`
- 启用 `gzip_static` + `brotli_static` 优先发送预压缩文件
