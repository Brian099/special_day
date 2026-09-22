# 纪念日 (Anniversary Reminder for fnOS)

精致优雅的纪念日、生日、结婚纪念日、传统节日与周期日程（经期、升旗等）智能提醒应用，专为飞牛私有云 **fnOS** 及全平台设计打造。

---

## ✨ 核心特性

- 🌸 **新中式雅致设计**：采用温暖纸白、深酒红与香槟金构筑的东方雅致美学，搭配二十四节气诗词与传统节气色谱。
- 📅 **公历 / 农历双引擎**：深度集成农历算法，支持闰月推算、生肖天干地支展示。
- ⏳ **智能时间轴与倒计时**：
  - 倒计时 / 正数天数双向推算；
  - 置顶重要提醒、按类别/周期多维度动态筛选；
  - 自动高亮即将到来的纪念日。
- 🔤 **动态字体自由更换**：只需将任意 `.ttf` / `.otf` / `.woff2` 字体文件放入 `frontend/public/fonts/` 目录即可全站自动加载生效。
- 🚀 **飞牛原生 FPK 应用生态**：
  - 符合飞牛 fnOS 1.2+ 应用标准体系；
  - 预配置生命周期管理（`cmd/main`、`cmd/install_init` 等）；
  - 支持飞牛桌面直接点击启动（端口 6921）。
- 💾 **跨平台零依赖存储**：基于纯 WebAssembly SQLite（`sql.js`），支持 x86_64 与 ARM64 飞牛设备，零编译依赖。

---

## 🛠️ 本地开发与调试

### 1. 安装依赖
```bash
# 根目录
npm install

# 前端与后端
cd frontend && npm install
cd ../backend && npm install
```

### 2. 启动开发服务
```bash
# 启动后端 API（端口 6921）
npm run dev:backend

# 启动前端开发服务器（端口 5173，支持 HMR 热更新）
npm run dev:frontend
```

---

## 📦 打包与发布为 FPK

只需执行一条命令即可自动完成前端构建、后端编译、资源同步与 `fnpack` 打包：

```bash
npm run package
```

打包完成后将在项目根目录生成 `anniversary-reminder.fpk` 文件。

---

## 📄 开源许可
[MIT License](LICENSE)
