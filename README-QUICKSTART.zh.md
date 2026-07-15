# Open Design · 中文 Quickstart（cuiwei03 定制版）

面向 **PPT 演示 · 单页设计 · 网页设计** 三种场景开箱即用。

## 0. 前置

- macOS，已装 `nvm`
- Node `24.x`，pnpm `10.33.x`（本仓库 `.nvmrc` 已固定）

## 1. 一次性初始化

```bash
cd /Users/cuiwei/Desktop/OpenDesign
nvm use              # 读取 .nvmrc 自动切到 Node 24
corepack enable
corepack prepare pnpm@10.33.0 --activate
pnpm install         # 首次约 5–10 分钟
```

## 2. MoonShot BYOK

已写入 `.env.local`（gitignored），无需再配置。默认模型 `kimi-k2-turbo-preview`。

如果想换模型，在 Web UI: `Settings → Providers → MoonShot` 或直接编辑 `.env.local` 的 `OPEN_DESIGN_BYOK_MODEL`：

| 模型 | 特点 |
| -- | -- |
| `kimi-k2-turbo-preview` | ✅ 主力，代码 / HTML 强，128K，速度快 |
| `moonshot-v1-128k`      | 稳定长文，适合超长 deck |
| `moonshot-v1-32k`       | 便宜 / 快 |
| `kimi-k2-0711-preview`  | K2 普通版，成本更低 |

## 3. 启动

```bash
pnpm tools-dev run web
```

浏览器打开 `http://localhost:7456`。

## 4. 第一次生成

**PPT 路演**：
- Design System 选 `Cuiwei Preset`
- Skill 选 `pitch-deck-cn`
- Brief：`帮我做一份 10 页的 AI 编程助手 A 轮融资 deck，风格克制，accent 用 indigo`

**单页海报**：
- Skill 选 `single-page-story`
- Brief：`做一张 9:16 竖版单页，主题：Open Design 0.14 新版本发布`

**落地页**：
- Skill 选 `saas-landing`
- Design System 选 `linear-app`（或 `stripe` / `vercel`）
- Brief：`一个面向设计师的 SaaS 落地页，Hero + Value + Feature × 3 + Pricing + CTA`

## 5. 导出

- **HTML**：直接下载单文件
- **PDF**：预览界面右上 → 打印 → 保存为 PDF
- **PPTX**：右上 Export → PPTX（首次会拉起 `pptx-generator` skill）
- **截图 PNG**：Studio 右侧 Screenshot 按钮

## 6. 目录速览

```
/Users/cuiwei/Desktop/OpenDesign
├── design-systems/
│   ├── cuiwei-preset/     ← 你的默认设计系统（Modern Chinese Editorial）
│   ├── linear-app/        ← 内置 150 套之一
│   └── ...
├── skills/
│   ├── pitch-deck-cn/     ← 自定义：中文路演 deck
│   ├── single-page-story/ ← 自定义：单页海报 / 长图
│   ├── ppt-keynote/       ← 内置：Apple Keynote 风
│   ├── deck-guizang-editorial/  ← 内置：归藏墨水风
│   ├── saas-landing/      ← 内置：SaaS 落地页
│   └── ...
├── WORKSPACE.md           ← 大纲模板 & 场景速查
├── .env.local             ← MoonShot BYOK（勿提交）
├── .nvmrc                 ← 锁定 Node 24
└── README-QUICKSTART.zh.md
```

## 7. 常见问题

**Q: `pnpm install` 卡在 postinstall？**
A: 首次要下载 sqlite / chromium 依赖，正常，观察 `pnpm tools-dev logs -f`。

**Q: MoonShot 报 SSRF 内网 IP？**
A: MoonShot 是公网 API，不会触发。若你把 base URL 改成公司内网网关，需要在 `.env.local` 加：
```
OD_ALLOWED_INTERNAL_HOSTS=your-internal-host
```

**Q: 想加自己的品牌 DESIGN.md？**
A: 拷贝 `design-systems/cuiwei-preset/` 一份，改名和内容即可，重启 daemon 后 Home 页会自动出现。

**Q: PPTX 导出失真？**
A: 用 `pptx-html-fidelity-audit` skill 二次校对；或直接导 PDF 交付。

## 8. 后续增强建议

- **图像生成**：MoonShot 暂无 image API。要生图请接 SiliconFlow / DashScope（OpenAI 兼容），在 Settings → Providers 增加一个 provider 即可。
- **视频 / HyperFrames**：需要 `brew install ffmpeg`；首次运行会下载 Chromium。
- **MCP 接入 Codex / CodeFlicker**：`node apps/daemon/bin/od.mjs mcp install codex`。

---

Made for cuiwei03 · Open Design 0.14.x
