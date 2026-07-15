---
name: pitch-deck-cn
zh_name: "中文商业路演 Deck"
en_name: "Chinese Pitch Deck"
emoji: "📊"
description: "16:9 magazine-editorial deck for Chinese pitches, launches, weekly reviews. Serif titles, sans body, tabular numbers."
zh_description: "面向路演 / 产品发布 / 周报的中文 16:9 演示；衬线大标题 + 无衬线正文 + 等宽数字"
en_description: "16:9 editorial deck for Chinese pitches. Serif display + sans body + tabular numerals."
category: slides
scenario: marketing
aspect_hint: "16:9 (1920×1080)"
tags: ["deck", "pitch", "presentation", "中文", "路演", "发布会"]
featured: 15
example_name: "商业路演 · 中文默认"
example_desc: "封面 / 问题 / 方案 / 数据 / 里程碑 / CTA 六段式"
od:
  mode: deck
  surface: web
  scenario: marketing
  design_system:
    requires: cuiwei-preset
    default_accent: indigo
    default_theme: light
  preview:
    type: html
    entry: index.html
    aspect: 16:9
---

# 中文商业路演 Deck

## 何时使用

用户输入含以下任一意图时优先选择本 SKILL：

- "做一份路演 PPT / 商业介绍 / Pitch Deck"
- "产品发布会幻灯片"
- "周报 / 月度回顾 / 数据汇报"
- "16:9 中文演示"

## 输入协议

必需：
- `brief`: 演示的核心信息、目标受众、时长（如 5 分钟 / 20 页）

可选：
- `accent`: `indigo` | `jade` | `ember`（默认 indigo）
- `theme`: `light` | `dark`（默认 light）
- `outline`: 数组，用户自定义大纲。若省略，走下面「默认大纲」
- `data`: 关键数字（KPI、里程碑），用于自动填入 Big Number 板

## 默认大纲（六段式）

1. **Cover** — 主标题（衬线 96–120px）+ 副标题 + 演讲者/日期
2. **Context / Problem** — 一屏一句话主张 + 支撑事实
3. **Solution** — 三点小节；避免超过三点
4. **Big Numbers / Traction** — Big Number 板；tabular-nums；每屏 1–3 个数
5. **Roadmap / Milestone** — Timeline 版式，横向节点
6. **CTA / Thanks** — 联系人 + 关键链接

## 版式（Layout）

严格从 `cuiwei-preset` 的 Deck Slide 版式中选择：
`Cover` · `Big Number` · `Two Column` · `Quote` · `Photo Full-bleed` · `Section Divider` · `Closing`。

## 生成规则

1. 尺寸：`1920×1080`，单文件 HTML，键盘 `←/→` `Space` 切页，`F` 全屏。
2. 每屏只承载一个信息点；正文行宽 ≤ 28 汉字。
3. 中英混排在字符间加半角空格。
4. 数字使用 `font-variant-numeric: tabular-nums`。
5. 不允许 emoji 作装饰；图标用 lucide outline 24。
6. 严格遵守 `DESIGN.md § 9 Anti-Patterns`。
7. 最后一屏必须包含 slide 总数与页脚（品牌 · 日期）。

## 交付格式

单个 `index.html`（内联 CSS + JS），可离线打开；配套导出：PDF（浏览器打印）/ PPTX（skill `pptx-generator` 二次处理）。

## Example prompt

> 帮我做一份 12 页的 A 轮融资路演 deck，主题：智能设计基础设施；受众：VC 合伙人；语气克制、数据优先；accent 用 ember。
