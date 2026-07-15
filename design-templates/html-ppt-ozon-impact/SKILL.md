---
name: html-ppt-ozon-impact
description: |
  Ozon Impact — Electric blue gradient background with floating 3D decorative objects, orbit rings, heavy white typography, and lime-green / hot-pink accents. Bold, modern, tech-forward. Best for product launches, job fairs, company introductions, tech conferences, recruitment campaigns, or any deck that needs high visual impact and brand confidence. Use when the user wants 蓝色渐变科技风, 3D装饰球PPT, 招聘海报风PPT, 科技发布会风格, bold impact deck, ozon style.
triggers:
  - "ozon"
  - "ozon impact"
  - "ozon style"
  - "electric blue"
  - "蓝色渐变"
  - "科技发布会"
  - "招聘海报"
  - "3D装饰"
  - "bold impact"
  - "impact deck"
  - "发布会PPT"
  - "产品发布"
  - "招聘PPT"
od:
  mode: deck
  scenario: marketing
  preview:
    type: html
    entry: example.html
  design_system:
    requires: false
  speaker_notes: false
  animations: true
  example_prompt: "用 ozon-impact 风格做一份产品发布会 PPT，10 页，主题是「快手电商 2026 新能力发布」。包含：封面、核心数据亮点、三大产品方向、案例展示、行动号召。要全力释放蓝色渐变 + 3D 装饰物的视觉冲击力。"
---

# html-ppt-ozon-impact — Electric Bold Impact

> 深蓝渐变 + 浮动 3D 装饰物 + 轨道线 + 超粗白字 + 荧光绿/粉点缀。

大冲击力视觉 PPT 模板，灵感来自 Ozon Bank 招聘海报设计语言。Stay inside this system — fonts, gradient palette, 3D ornament vocabulary, and orbit lines are all tuned together.

## At a glance

- **Scheme:** dark（深蓝渐变）
- **Formality:** medium（专业但不拘谨）
- **Density:** low–medium（大字 + 大留白 + 视觉冲击优先）
- **Slides in demo:** 10
- **Primary font:** Inter / SF Pro Display / system-ui

## Best for

产品发布会 / 招聘活动 / 科技大会 / 公司介绍 / 战略宣讲。任何需要视觉震撼力和品牌自信感的场合。

## Avoid for

数据密集型汇报（表格多、文字多）；学术论文类；需要轻盈柔和感的消费者内容。

## Design System

### Color Tokens
```
--oi-bg-deep:    #0A1566      深海蓝，最暗底色
--oi-bg-mid:     #1230D4      电蓝中调
--oi-bg-bright:  #2B5FF5      亮蓝高光
--oi-accent-lime:#7AE03D      荧光绿
--oi-accent-pink:#FF3D8A      热粉红
--oi-accent-sky: #5BE5FF      天蓝高光
--oi-white:      #FFFFFF      主文字
--oi-white-70:   rgba(255,255,255,.7)   副文字
--oi-white-40:   rgba(255,255,255,.4)   弱化文字
--oi-card-bg:    rgba(255,255,255,.08)  卡片背景
--oi-card-border:rgba(255,255,255,.15)  卡片边框
```

### Typography Scale
```
display:  80px / 900 weight  ← 封面主标题
h1:       52px / 800         ← 页面主结论
h2:       36px / 700         ← 模块标题
h3:       24px / 600         ← 卡片标题
body:     16px / 400         ← 正文
body-sm:  13px / 500         ← 标签/说明
metric:   56px / 800         ← 核心数字
```

### 3D Ornament Vocabulary
每页右侧放 1–3 个 CSS/SVG 装饰物：
- **Sphere** `.oi-orb` — 带光泽高光的球体（CSS radial-gradient）
- **Orbit rings** `.oi-orbit` — 细白线椭圆轨道
- **Cube** `.oi-cube` — 3D 等距方块（CSS transform）
- **Coin** `.oi-coin` — 带浮雕效果的硬币（CSS + SVG）
- **Stars** `.oi-stars` — 散布小星点（CSS before/after）
- **Blob** `.oi-blob` — 流体渐变色块

### Layout Rules
- 画布：`1920 × 1080`（全屏 16:9）
- 文字区：左侧 40–50%，装饰区：右侧 50–60%
- 左侧内边距：`80px`；上边距：`64px`
- 标题超大字号，2–4 行以内
- 每页只表达 1 个核心信息

### Anti-patterns
1. 把装饰物缩小到看不见
2. 用浅色背景（破坏深沉感）
3. 文字超过 6 行（密度过高）
4. 同页超过 2 种强调色
5. 去掉轨道线（少了动感）

## Workflow

1. **Clone `example.html`** 为工作文件
2. **替换内容**：标题、副标题、数字，保留装饰物位置
3. **扩展页数**：复制最接近的页面布局，只改文案和轨道色
4. **调色**：可整体替换 `--oi-bg-mid` 改变主色调（换成紫、青都可以）
5. **装饰物**：每页 1–3 个，只放右侧区域或背景角落

## Output contract

```
<artifact identifier="ozon-impact-deck" type="text/html" title="Deck Title">
<!doctype html>
<html>...</html>
</artifact>
```
