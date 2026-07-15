# cuiwei-preset · Modern Chinese Editorial

> Category: Presentation & Editorial
> Purpose: 中文商业演示 / 单页叙事 / 品牌网站——三合一通用底座。

一套面向 **PPT · 单页 · 网页演示** 的中性偏东方审美设计系统。深浅两套主题、克制的强调色、字号阶梯适合 16:9、9:16、A4、1440 网页多种画幅。

## 1. Visual Theme & Atmosphere

- **氛围**：现代编辑物 × 极简瑞士栅格，画面留白 60% 以上；正文优先阅读、图形优先呼吸。
- **反 AI-Slop**：禁止玻璃拟态 glassmorphism / 彩虹渐变 / emoji 泛滥 / 圆角贴纸卡片；一屏聚焦一个信息点。
- **气质关键词**：精确、松弛、克制、可打印、可放大到 4K 不糊。

## 2. Color Palette

### 中性（默认 Light）
- `--bg`            `#FAFAF7`（象牙白）
- `--surface`       `#FFFFFF`
- `--surface-alt`   `#F2F2EE`
- `--ink`           `#111114`（正文主色，接近纯黑但更暖）
- `--ink-2`         `#3A3A3F`
- `--muted`         `#8A8A93`
- `--divider`       `rgba(17,17,20,0.08)`

### 深色（Dark，供 deck / dashboard 切换）
- `--bg-dark`        `#0E0F12`
- `--surface-dark`   `#16181C`
- `--ink-dark`       `#F5F5F0`
- `--muted-dark`     `#8B8F98`

### 强调色（三选一，同一份稿件只选一色）
- `--accent-indigo` `#4C5BD4`（默认，商业稳重）
- `--accent-jade`   `#2F7D6A`（东方杂志风）
- `--accent-ember`  `#D0511C`（活动 / 发布会）

### 状态色（仅用于 dashboard / 数据卡）
- `--success` `#2E7D32`
- `--warning` `#B26A00`
- `--danger`  `#B3261E`

## 3. Typography

- **中文正文**：`"Noto Sans SC", "PingFang SC", "HarmonyOS Sans SC", system-ui`
- **中文标题**：`"Source Han Serif SC", "Songti SC", "Noto Serif SC", serif`（大标题、章节封面用衬线，产生「杂志感」）
- **英文/数字**：`"Inter", "Söhne", ui-sans-serif`；数字位对齐：`font-variant-numeric: tabular-nums`。
- **等宽**：`"JetBrains Mono", "SF Mono", ui-monospace`。

### 字号阶梯（clamp 响应式）
| 语义 | 桌面 | 演示（16:9） | 移动 |
| -- | -- | -- | -- |
| Display   | 72px | 96–120px | 40px |
| H1        | 48px | 64px     | 32px |
| H2        | 32px | 44px     | 26px |
| H3        | 24px | 30px     | 20px |
| Body      | 16px | 22px     | 15px |
| Small     | 13px | 16px     | 12px |

- 字重使用：正文 400，强调 500，标题 600–700。
- 负字距仅在 ≥40px 时启用（`letter-spacing: -0.02em`）。

## 4. Spacing & Grid

- 8pt 基线：`4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96`。
- 桌面栅格：12 列，最大宽 `1200px`，gutter `24px`。
- Deck（16:9 1920×1080）：内边距 `120px 96px`；单屏最多 3 层信息层级。
- 单页叙事（1080×1920）：中央栏 720px，上下呼吸 120px。

## 5. Layout / Aspect Presets

在同一系统内提供 4 套画幅预设，skill 通过 `aspect_hint` 引用：

| 名称 | 尺寸 | 用途 |
| -- | -- | -- |
| `deck-16x9`     | 1920 × 1080 | PPT 演示（默认） |
| `deck-4x3`      | 1600 × 1200 | 兼容旧投屏 |
| `single-9x16`   | 1080 × 1920 | 小红书 / 抖音竖版单页 |
| `poster-a4`     | 794 × 1123 (72dpi) → 打印 210×297mm | 打印海报 / PDF 分发 |
| `web-1440`      | 1440 宽自适应 | 落地页 / 官网 |

## 6. Components

组件均以真实 HTML + Tailwind v4 tokens 输出。默认包含：

- Hero（标题 + 引言 + 单一 CTA + 装饰栅格）
- KPI Card（数字 tabular-nums，单位下沉）
- Section Header（章节序号 + 中英双标题 + 细分割线）
- Quote Block（衬线大字号 + 左侧竖线）
- Timeline（水平横条 + 节点）
- Feature Grid（2/3/4 列自动）
- Deck Slide 版式：Cover / Big Number / Two Column / Quote / Photo Full-bleed / Section Divider / Closing。

## 7. Motion

- 默认过渡：`cubic-bezier(0.22, 1, 0.36, 1)`，120–260ms。
- Deck 翻页：横向 260ms，缓入缓出，禁止 3D 翻转。
- 单页滚动：`prefers-reduced-motion` 优先；元素入场 fade-up 12px。

## 8. Voice & Content

- **文案调性**：像杂志编辑写导语——短、准、有观点，避免"赋能 / 抓手 / 生态位"。
- **中英混排**：中文与英文/数字之间加半角空格。
- **标点**：中文全角，代码 / URL 除外；破折号统一 `——`。
- 每屏 / 每一页仅一个「主张」。

## 9. Anti-Patterns

- 禁：彩虹渐变背景、玻璃卡片 blur、AI 常用的 emoji 装饰（✨🚀💡）。
- 禁：一屏多张卡片挤在一起、四周圆角 + 阴影 + 边框三件套。
- 禁：正文使用衬线体（衬线仅用于 ≥32px 的标题）。
- 禁：低对比灰字（`#999` 及以下）作为正文色。
- 禁：把 emoji 当图标；请用 `heroicons` / `lucide` outline 24。
