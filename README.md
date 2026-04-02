# 记账 App（离线优先）

仓库包含以下项目：

- `account-app-rn`：React Native 客户端（离线可用，当前主用）
- `account-app-server`：Spring Boot + SQLite 服务端骨架（后续联网同步可接入）
- `account-app-shared`：多端共享业务层（类型、离线业务规则）
- `account-app-mp`：微信小程序端（方案 A 第一版）
- `account-app-web`：Web App 端（离线优先，可切换后端模式）

## 依赖安装（根目录一键）

在仓库根目录执行：

```bash
npm install
```

会自动安装以下子项目依赖：

- `account-app-rn`
- `account-app-mp`
- `account-app-shared`
- `account-app-web`

## 前后端快速启动命令

### 前端（React Native，iOS 模拟器）

真机运行说明见：[iPhone 真机运行说明](./zhenjiREADME.md)

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

### 前端（微信小程序）

```bash
cd account-app-mp
npm install
npm run dev:weapp
```

然后在微信开发者工具中导入 `account-app-mp/dist` 目录进行模拟器/真机预览调试。

说明：当前小程序端的共享逻辑位于 `account-app-mp/src/shared`（与 `account-app-shared` 同源结构），用于规避 Taro 对外部 TS 目录的打包限制。

### 前端（Web App）

推荐在仓库根目录直接启动：

```bash
npm run dev:web
```

或进入 Web 项目目录启动：

```bash
cd account-app-web
npm install
npm run dev
```

默认离线模式（`VITE_DATA_MODE=local`）。如需切后端模式，配置：

```bash
VITE_DATA_MODE=remote
VITE_API_BASE_URL=http://localhost:8080/api
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

## Android GitHub Release 发包（APK 直装）

本仓库已支持自动打包并上传 APK 到 GitHub Release，流程如下：

### 1. 一次性准备签名

先在本地生成正式签名（不要提交到仓库）：

```bash
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore release.keystore \
  -alias accountapp \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

把 `release.keystore` 转成 Base64（用于 GitHub Secret）：

```bash
base64 release.keystore | tr -d '\n'
```

### 2. 配置 GitHub Secrets

在仓库 `Settings -> Secrets and variables -> Actions` 新增：

- `ANDROID_KEYSTORE_BASE64`：上一步 Base64 内容
- `ANDROID_KEYSTORE_PASSWORD`：keystore 密码
- `ANDROID_KEY_ALIAS`：别名（例如 `accountapp`）
- `ANDROID_KEY_PASSWORD`：key 密码（可选；若未单独设置，通常与 `ANDROID_KEYSTORE_PASSWORD` 相同）

本地签名模板参考：

- [account-app-rn/android/keystore.properties.example](./account-app-rn/android/keystore.properties.example)

### 3. 触发发版

已内置工作流：

- [.github/workflows/android-release.yml](./.github/workflows/android-release.yml)

可选两种方式：

1. 推送标签触发（推荐）

```bash
git tag v1.0.1
git push origin v1.0.1
```

2. 在 GitHub Actions 页面手动触发 `Android Release APK`，输入 `tag`。

### 4. 下载与安装

工作流成功后，会自动创建/更新对应的 GitHub Release，并上传 APK 资产（文件名类似 `accountapp-v1.0.1-android.apk`），安卓手机可直接在 Release 页面下载安装。

### 5. 结构化 Release 说明（新增/修复/优化）

当前工作流默认会生成结构化发布说明，包含：

- 重要说明
- 新增功能
- 修复问题
- 优化改进
- 其他变更
- 下载地址（按 Android / Windows / macOS / Linux 分区展示）

说明归类来源于提交信息（commit message），建议发版前使用如下前缀提交：

- `feat:` 归类到“新增功能”
- `fix:` 归类到“修复问题”
- `perf:` / `refactor:` / `optimize:` / `chore:` 归类到“优化改进”

如果你手动触发工作流并填写 `release_notes`，则会优先使用你手填的内容。

### 常见报错排查

如果出现：

```text
Given final block not properly padded
```

通常是 `ANDROID_KEY_PASSWORD` 与 keystore 中私钥密码不一致。当前工作流会先做私钥校验，并在 `ANDROID_KEY_PASSWORD` 不可用时自动回退使用 `ANDROID_KEYSTORE_PASSWORD`；但建议仍修正 Secret，避免后续混淆。

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
