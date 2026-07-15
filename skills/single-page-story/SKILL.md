---
name: single-page-story
zh_name: "单页叙事长图"
en_name: "Single-page Story"
emoji: "📄"
description: "One-page vertical narrative (9:16 or A4) for launches, event posters, campaign summaries."
zh_description: "9:16 或 A4 单页叙事长图；发布会海报 / 复盘长图 / 产品说明单页"
en_description: "Vertical single-page story: launch poster, event summary, product one-pager."
category: poster
scenario: marketing
aspect_hint: "9:16 (1080×1920) or A4"
tags: ["poster", "one-pager", "single-page", "海报", "长图"]
featured: 12
example_name: "单页叙事 · 发布会海报"
example_desc: "Hero + 章节序号 + KPI + 引言 + Footer"
od:
  mode: prototype
  surface: web
  scenario: marketing
  design_system:
    requires: cuiwei-preset
    default_accent: indigo
    default_theme: light
  preview:
    type: html
    entry: index.html
    aspect: 9:16
---

# 单页叙事长图

## 何时使用

- "做一张发布会海报 / 活动长图"
- "一页说明 / 一屏概览 / one-pager"
- "微信朋友圈 9:16 图 / 小红书封面"
- "打印海报 A4"

## 输入协议

必需：
- `brief`: 主题 + 想传达的核心信息

可选：
- `aspect`: `single-9x16` (默认) | `poster-a4`
- `accent`: `indigo` | `jade` | `ember`
- `sections`: 大纲数组；缺省用「默认大纲」

## 默认大纲（叙事五段）

1. **Hero** — 大标题（衬线 96px+）+ 一句话 tagline + 品牌/日期
2. **Prologue** — 引言段，最多 120 字，说明「为什么」
3. **Highlights** — 3 条关键要点或 3 个 KPI（Big Number 版式）
4. **Body / Timeline** — 时间轴或章节列表；每节 ≤ 60 字
5. **Footer / CTA** — 二维码 + 联系方式 + 品牌页脚

## 生成规则

1. 单一 HTML 文件；`viewport` 按 aspect 固定。
2. 中央栏 720px，两侧留白；避免出血边贴文字。
3. 打印场景（`poster-a4`）额外注入 `@page { size: A4; margin: 12mm; }`。
4. 图片使用 `<img>` + `loading="lazy"`；未提供图片则使用几何色块占位。
5. 遵循 `cuiwei-preset` DESIGN.md 反模式清单。

## 交付格式

- `index.html`（内联样式，可打印）
- 建议后处理：PDF（`@media print`）、PNG（headless Chrome 截图）
