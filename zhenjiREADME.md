# iPhone 真机运行说明（React Native）

## 1. 首次准备（只需要做一次）

```bash
cd account-app-rn
npm install
npm run ios:pods
```

## 2. 启动 Metro（终端 1）

```bash
cd account-app-rn
npm run start:ios
```

如果真机连不上 Metro，可改用：

```bash
cd account-app-rn
npx react-native start --host 0.0.0.0 --port 8081
```

## 3. 获取电脑局域网 IP

```bash
ipconfig getifaddr en0
```

示例输出：`192.168.1.23`

## 4. 用 Xcode 首次安装到真机（详细）

### 4.1 打开工程并连接手机

1. 用 Xcode 打开：`account-app-rn/ios/AccountApp.xcworkspace`（不是 `.xcodeproj`）。
2. 用数据线连接 iPhone 到 Mac，手机弹窗时点「信任此电脑」。
3. Xcode 顶部设备下拉框里选择你的 iPhone。

### 4.2 配置签名（Signing）

1. 在 Xcode 左侧点最上方蓝色项目 `AccountApp`。
2. 中间区域切到 `TARGETS` 里的 `AccountApp`。
3. 打开 `Signing & Capabilities`。
4. 勾选 `Automatically manage signing`。
5. `Team` 选择你的 Apple 开发者账号。
6. 把 `Bundle Identifier` 改成唯一值，例如：`com.chen.accountapp.dev`。

如果 `Team` 为空：
1. 打开 Xcode 菜单 `Xcode -> Settings -> Accounts`。
2. 添加你的 Apple ID。
3. 回到工程重新选择 `Team`。

### 4.3 运行到真机

1. 确认左上角 Scheme 是 `AccountApp`，配置是 `Debug`。
2. 按 `Run`（三角按钮）开始编译安装。
3. 首次安装可能提示证书不信任，在手机中信任开发者证书：
   - `设置 -> 通用 -> VPN 与设备管理`
   - 找到你的开发者账号，点击「信任」。
4. 回到桌面再次打开 App。

### 4.4 常见 Xcode 报错快速处理

- `No profiles for ... were found`：在 `Signing & Capabilities` 页面点 `Try Again` 或 `Fix Issue`。
- `A valid provisioning profile for this executable was not found`：确认 `Team` 已选、`Bundle Identifier` 唯一。
- `Developer Mode required`：手机打开 `设置 -> 隐私与安全性 -> 开发者模式`，按提示重启后再运行。

## 5. 在真机里配置 Bundler 地址（详细）

### 5.1 前置条件

1. 电脑上 Metro 必须在运行（见第 2 步）。
2. 手机和电脑必须在同一个局域网（同一个 Wi-Fi）。
3. 电脑局域网 IP 已拿到（见第 3 步）。

### 5.2 打开 Dev Menu

1. 在真机上打开 App（Debug 包）。
2. 摇一摇手机，出现 React Native Dev Menu。

如果摇一摇没反应：
- 先确认你装的是 `Debug` 包，不是 `Release` 包。
- 先在 Xcode 重新 `Run` 一次，再试摇一摇。

### 5.3 配置 Bundler 地址

1. 在 Dev Menu 里进入 `Dev Settings`。
2. 找到以下任一入口（不同 RN/iOS 版本文案不同）：
   - `Configure Bundler`
   - `Debug server host & port for device`
3. 输入：`电脑局域网IP:8081`，例如 `192.168.1.23:8081`。
4. 返回后点击 `Reload`（或在 Dev Menu 里点 `Reload`）。

### 5.4 验证是否连通

1. 在手机浏览器访问：`http://电脑局域网IP:8081/status`
2. 如果页面返回 `packager-status:running`，说明手机已经能连到 Metro。

如果访问失败：
- 检查 Metro 是否仍在运行。
- 检查是否连了 VPN/代理导致局域网隔离。
- 检查 macOS 防火墙是否拦截 `node` 进程。

## 6. 常见问题排查

- 手机和电脑必须在同一个 Wi-Fi 局域网。
- 电脑开着 Metro 时，不要退出终端 1。
- 关闭或绕过会影响局域网访问的 VPN/代理。
- 如果防火墙拦截 `node`，需要放行。
- 可以在手机浏览器访问 `http://电脑局域网IP:8081/status`，返回 `packager-status:running` 说明连通正常。

## 7. 是否需要后端

当前是离线记账 App，日常记账不依赖后端服务。  
开发调试时需要 Metro；不需要启动 `account-app-server` 才能使用本地账本功能。
