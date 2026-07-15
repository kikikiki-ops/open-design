---
name: html-ppt-ks-alliance
description: |
  快手联盟·轻奢数据叙事 PPT — 快手品牌营销内部提案风格：克制高级、轻奢品牌感、数据可信、自然科技。深青蓝主色 + 金系点缀 + 柔和渐变，使用 OPPOSans 字体。适合快手商业化提案、闭门会 / 行业峰会 Deck、品牌合作案例汇报、电商增长数据复盘。Use when the user asks for 快手风格 PPT, 快手联盟提案, 轻奢数据叙事, 品牌提案, 营销汇报, ks-alliance, kuaishou marketing deck.
triggers:
  - "快手联盟"
  - "快手风格"
  - "轻奢数据"
  - "品牌提案"
  - "营销汇报"
  - "ks-alliance"
  - "ks alliance"
  - "kuaishou"
  - "闭门会"
  - "行业峰会"
  - "商业化提案"
  - "数据叙事"
  - "快手PPT"
od:
  mode: deck
  scenario: marketing
  preview:
    type: html
    entry: example.html
  design_system:
    requires: false
  speaker_notes: false
  animations: false
  example_prompt: "用 ks-alliance 风格做一份快手电商增长汇报 PPT，12 页，受众是快手联盟商家和运营负责人。包含：封面、年度成果数据、三大增长策略、核心案例、资源配置、行动计划、结语。"
---

# html-ppt-ks-alliance — 快手联盟·轻奢数据叙事

> 快手品牌营销内部提案风格：克制、高级、轻奢、品牌感、数据可信、自然科技。

A single self-contained HTML deck system — all design tokens, component CSS, and layout vocabulary are built in. Stay inside this system; mixing in other templates breaks the visual identity.

## At a glance

- **Scheme:** light（米白 + 深青蓝 + 金色）
- **Formality:** medium-high（提案感强，不失温度）
- **Density:** medium（留白充分，数字突出）
- **Slides in demo:** 10
- **Primary font:** OPPOSans / PingFang SC / Microsoft YaHei

## Best for

快手品牌内部营销提案、闭门会 / 行业峰会 Deck、商业化数据汇报、品牌合作案例复盘、电商增长策略分享。用于需要兼顾品牌感与数据可信度的场合。

## Avoid for

蓝紫科技光效风格、重拟物金属、赛博网格感；也不适合纯消费者端轻松玩法内容（用小红书风格 PPT 更合适）。

## Design System

### 风格定位
- 风格名称：快手品牌营销·轻奢数据叙事体系
- 参考气质：Interbrand / Landor 式品牌提案感 + 国内大厂业务汇报效率感
- 核心关键词：克制、高级、轻奢、品牌感、数据可信、自然科技
- 不做方向：蓝紫科技光效大铺满、重拟物金属、赛博网格、过度3D炫技

### Color Tokens
```
--kc-color-title: #052941        深青蓝，页面主标题
--kc-color-text-strong: #295957  深绿调，次级强调
--kc-color-text-body: #1f2d33    深灰，正文
--kc-color-text-muted: #6f7d86   柔灰，辅助说明
--kc-color-bg-page: #f8faf8      页面背景
--kc-color-bg-surface: #ffffff   卡片背景
--kc-color-gold: #d5ae79         金色点缀
--kc-color-accent-green: #20846f 绿色强调（成功/增长）
--kc-color-accent-pink: #ff2b5e  粉色（快手标志色）
--kc-gradient-orb: linear-gradient(135deg, #ff2b5e 0%, #f238e2 45%, #7fc236 100%)
--kc-gradient-gold: linear-gradient(135deg, #e9d5b9 0%, #d5ae79 60%, #ac8348 100%)
```

### Typography Scale
```
display-xl: 72px / bold     ← 封面主标题
h1: 36px / bold             ← 页面主结论标题
h2: 28px / medium           ← 模块标题
h3: 22px / medium           ← 卡片标题
body: 14px / regular        ← 正文
body-sm: 12px / medium      ← 标签/辅助
metric: 44px / bold         ← 核心数字
metric-unit: 24px / heavy   ← 单位
```

### Component Vocabulary（按层级使用）

| 组件 | 类名 | 用途 |
|------|------|------|
| Hero 结论标题 | `.kc-hero-title` | 页面级主结论，单页一句话 |
| 品牌栏目眉 | `.kc-header-strap` | 承接章节归属 / 品牌归属 |
| 策略圆角卡 | `.kc-card` / `.kc-card--soft` | 方法/策略/路径拆解 |
| 指标成果卡 | `.kc-metric` | 核心增长数字展示 |
| 标签胶囊 | `.kc-pill` / `.kc-pill--solid` | 策略点/资源位/状态 |
| 关系节点 | `.kc-node-dot` / `.kc-node-diamond` | 流程串联/递进关系 |
| 渐变装饰球 | `.kc-orb` | 边角提气，每页 1–3 个 |

### Layer Priority（层级规则）
- L1：页面结论标题 → `.kc-hero-title`
- L2：模块标题 → h2
- L3：策略标签 / 方法项 → `.kc-pill`
- L4：关键指标 → `.kc-metric__number`
- L5：辅助说明 → `.kc-card__desc`

**严禁把 L3/L4 做得比 L1 更抢眼。**

### Page Layout Rules
- 画布：`1920 × 1080`（3:1.6875 宽屏）
- 左右边距：`72px`；上下边距：`56px`
- 同级间距：`24–32px`；大模块间距：`40–56px`
- 高级感主要靠留白，不靠堆装饰

### Combination Rules（可以这样组合）
- Hero 标题 + Header Strap + 双栏 Card
- Hero 标题 + Metric Card 组三联 + Strategy Card
- Hero 标题 + 左图形关系区 + 右指标区

### Anti-patterns（反模式）
1. 大面积蓝紫科技渐变背景
2. 赛博网格、地球、粒子轨道
3. 发光描边标题字
4. 金色过厚、过亮（像婚庆海报）
5. 卡片阴影太重（像后台管理系统）
6. 一页超过 3 个主强调色
7. 装饰球过多（像彩妆广告）
8. ECharts 蓝橙绿全家桶直接上

## Slide Templates

### 封面页
- 左/中大标题（`kc-hero-title` + display-xl）
- 小副标题 + 日期/机构
- 一处大装饰球（右上角）
- 金色细线 / 品牌标识条

### 结论页
- 顶部 Hero 标题
- 中部栏目眉
- 下部 2–3 个内容卡
- 右上或右下放装饰节点

### 双栏策略页
- 顶部标题
- 左右两张大卡并列
- 中间用节点连接过渡
- 底部可接指标成果卡

### 成果数据页
- 顶部标题
- 中区指标卡并列（3–4 个）
- 下区方法解释 / 资源组合说明

## Workflow

1. **Clone `example.html`** 为工作文件
2. **替换占位内容**：标题、正文、数字、日期、机构名
3. **保留设计系统**：绝不替换字体、颜色、圆角、装饰元素
4. **扩展页数**：复制最接近的页面模板，不新增颜色/卡片样式
5. **装饰球控制**：每页 1–3 个，只放边角/空白区，不压正文
6. **保留导航 runtime**：键盘 ← → 翻页逻辑保持原样

## Output contract

```
<artifact identifier="ks-alliance-deck" type="text/html" title="Deck Title">
<!doctype html>
<html>...</html>
</artifact>
```
