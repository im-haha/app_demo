# 记账 App（离线优先）

仓库包含两部分：

- `account-app-rn`：React Native 客户端（离线可用，当前主用）
- `account-app-server`：Spring Boot + SQLite 服务端骨架（后续联网同步可接入）

## 前后端快速启动命令

### 前端（React Native，iOS 模拟器）

终端 1：

```bash
cd account-app-rn
npm install
npm run ios:pods
npm run start:ios
```

终端 2：

```bash
cd account-app-rn
npm run ios:sim
```

### 后端（Spring Boot）

```bash
cd account-app-server
mvn spring-boot:run
```

## 2026-04-01 运行与兼容性验证结果

已完成真实构建/启动验证：

- iOS 构建：`xcodebuild ... build` 成功（`BUILD SUCCEEDED`）
- iOS 启动：`run-ios` 已在 `iPhone 17 (iOS 26.2)` 模拟器成功安装并启动
- Metro：可正常启动
- TypeScript/ESLint：通过（仅样式类 warning，无阻断错误）

当前环境限制与缺失项：

- Android 未安装 SDK（`ANDROID_HOME`、`adb`、`Android Studio` 缺失），因此 Android 无法在当前机器直接构建
- `account-app-server` 需要 Maven，但当前机器无 `mvn`

## iOS 本地运行（推荐）

在 `account-app-rn` 目录执行：

```bash
npm install
npm run ios:pods
```

开两个终端：

终端 1（启动 Metro）：

```bash
npm run start:ios
```

终端 2（启动模拟器并安装 App）：

```bash
npm run ios:sim
```

说明：`ios:sim` 使用 `--no-packager`，可避免某些终端环境下 `run-ios` 自动拉起新终端失败的问题。

## Android 运行前置

需要先补齐 Android 环境：

1. 安装 Android Studio
2. 安装 Android SDK Platform 35 + Build-Tools 35
3. 配置 `ANDROID_HOME`（或 `ANDROID_SDK_ROOT`）
4. 确保 `adb` 在 PATH

然后在 `account-app-rn/android/local.properties` 配置：

```properties
sdk.dir=/Users/<你的用户名>/Library/Android/sdk
```

完成后可执行：

```bash
npm run android:assemble
npm run android
```

## 已修复的兼容性问题

1. `run-ios` 在当前终端环境无法自动启动 Metro：已提供 `start:ios + ios:sim` 双命令方案
2. iOS bundle 命令可能触发 Metro `EMFILE: too many open files`：新增 `bundle:ios`（`CI=1`）稳定通过

## 服务端说明（可选）

`account-app-server` 是后续在线化预留。当前离线版记账功能不依赖它。

如需运行服务端：

```bash
cd account-app-server
mvn spring-boot:run
```

SQLite 数据文件默认在：

```text
account-app-server/data/account.db
```
