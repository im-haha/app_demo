# account-app-shared

跨端共享业务层（方案 A 第一版）：

- 共享类型定义：`src/types`
- 共享常量：`src/constants`
- 共享离线业务服务：`src/services/localAppService.ts`
- 共享默认分类：`src/data/defaultCategories.ts`
- 共享格式化工具：`src/utils/format.ts`

当前 `account-app-mp` 使用 `src/shared` 的同结构同步副本（Taro 外部 TS 目录打包有限制）。
后续可通过构建产物或 workspace 依赖方式，让 `account-app-rn` / `account-app-mp` 统一直接依赖该目录。
