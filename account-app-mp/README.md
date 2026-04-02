# account-app-mp（微信小程序端）

这是方案 A 的第一版落地：

- 保留原 `account-app-rn` 不动
- 新增 `account-app-mp`（Taro + React）小程序端
- 在小程序端通过 `src/shared` 复用同一套离线业务逻辑（本地账本）

## 本地开发

```bash
cd account-app-mp
npm install
npm run dev:weapp
```

构建结果默认输出到：

```text
account-app-mp/dist
```

已验证 `npm run build:weapp` 可成功产出 `dist`。

## 在微信开发者工具中调试

1. 打开微信开发者工具
2. 选择“导入项目”
3. 项目目录指向 `account-app-mp/dist`
4. 填入你自己的小程序 `AppID`（开发阶段也可用测试号）

## 真机预览

1. 保持 `npm run dev:weapp` 运行
2. 在微信开发者工具点击“预览”
3. 手机微信扫码进入开发版

## 当前页面

- `/pages/auth/index`：登录/注册（离线本地）
- `/pages/home/index`：首页概览 + 最近账单
- `/pages/bills/index`：账单列表 + 快速新增/删除
- `/pages/mine/index`：个人信息 + 修改昵称 + 退出登录
