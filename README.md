# 记账 App

这个仓库按你提供的方案文档拆成两部分：

- `account-app-rn`：React Native 离线优先客户端，当前版本可单机本地使用。
- `account-app-server`：Spring Boot + SQLite 服务端骨架，表结构和接口已对齐，便于后续上线改造成远程服务。

## 当前交付重点

这次实现优先保证你“自己先能用”：

- 本地注册 / 登录
- 新增、编辑、删除账单
- 账单列表与详情
- 月预算
- 分类管理
- 首页概览
- 最近 7 天 / 30 天趋势
- 本月分类占比

移动端当前采用 `AsyncStorage + Zustand` 做本地持久化，目的是先把离线可用版本跑通。后续如果切换到线上版，只需要把 `src/api/*` 的本地调用替换成真实后端请求。

## 目录结构

```text
app_demo/
├── account-app-rn/
└── account-app-server/
```

## 本地启动建议

### 1. React Native 客户端

当前代码已把业务层、页面层和状态层搭好，但当前工作区是空仓库起步，没有自动生成 `ios/`、`android/` 原生壳。

建议你在 `account-app-rn` 下执行标准 RN CLI 初始化后，把现有业务代码接进去：

```bash
cd account-app-rn
npx @react-native-community/cli init AccountAppShell --directory .
npm install
```

然后补装依赖：

```bash
npm install zustand dayjs react-hook-form yup @hookform/resolvers
npm install @react-native-async-storage/async-storage
npm install react-native-paper react-native-vector-icons react-native-safe-area-context
npm install react-native-screens react-native-gesture-handler react-native-reanimated
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npm install react-native-svg victory-native
```

iOS 还需要安装 CocoaPods 并执行：

```bash
cd ios
pod install
cd ..
```

### 2. Spring Boot 服务端

当前工作机里没有 `mvn`，所以我把 Maven 配置和源码准备好了，但没有实际下载依赖构建。

后续你本机装好 Maven 后：

```bash
cd account-app-server
mvn spring-boot:run
```

SQLite 文件默认会落在：

```text
account-app-server/data/account.db
```

## 后续上线建议

如果你后面准备把离线版升级成可上线版本，建议按这个顺序推进：

1. 先补全 `account-app-server` 的 repository / service 实现，把现在的骨架接口接上 SQLite。
2. 把 `account-app-rn/src/api/*` 从本地 store 调用切换成 `fetch` 请求。
3. 登录态从本地 token 占位改成 JWT。
4. 再考虑云端部署、数据备份、导出和多设备同步。
