# 同组卡片对齐协议

当两个或以上卡片在视觉上属于同一组、同一行、同一列或同一矩阵时，必须先建立统一的对齐关系，再处理内部排版。

## 1. 识别分组

- 同一行的同层级卡片是横向卡片组；同一列的同层级卡片是纵向卡片组；多行多列的同层级卡片是矩阵卡片组。
- 只有同一语义层级的卡片才强制统一尺寸。不同功能、不同层级或明确强调的主卡片可不等尺寸，但仍须遵守共同基线。

## 2. 横向卡片组

横向组必须满足：

```text
top(card_i) = top(card_j)
bottom(card_i) = bottom(card_j)
height(card_i) = height(card_j)
```

- 水平间距一致，卡片不得单独发生垂直偏移。
- 内容量差异不得改变外框对齐关系。

## 3. 纵向与矩阵卡片组

纵向组必须满足：

```text
left(card_i) = left(card_j)
right(card_i) = right(card_j)
width(card_i) = width(card_j)
```

- 垂直间距一致，卡片不得单独发生水平偏移。
- 矩阵组中，同一行共享顶部和底部基线，同一列共享左、右基线；行高、列宽、行间距和列间距统一决定。
- 禁止每张卡片独立计算位置。

## 4. 父级与内部控制

- 使用共同父容器的 Grid 或 Flex 控制同组卡片的位置、尺寸变量、间距和对齐；无必要时禁止逐张绝对定位。
- 同组卡片禁止分别设置 `top`、`left`、`margin-top`、`margin-left`、`translateX`、`translateY`，或混用不同的 `box-sizing`、边框宽度和尺寸计算方式。
- 外框对齐优先于内容对齐。结构相似时，标签顶部、标题起始线、正文起始线，以及底部按钮或结论区也应建立共同锚点。
- 缺失内容可保留结构占位，但禁止用无意义文本填充。

## 5. 内容高度不一致

按以下顺序处理：

1. 以内容最多的同组卡片确定统一外框尺寸，不得以画布剩余高度为基准拉伸；
2. 内容顶部对齐；
3. 用卡片内部弹性空间吸收高度差；
4. 底部操作区或结论区固定到底部；
5. 必要时缩短冗余文字；
6. 禁止通过移动整张卡片解决内容高度差。

## 6. 允许例外与生成后检查

- 仅明确的主次卡、大卡带小卡、瀑布流、时间轴错落或刻意非对称构图可不等高或不等宽；页面计划必须说明设计意图。
- 生成后检查同组卡片的边界误差不超过 2px，且不存在单卡片横向或纵向偏移、内容长度造成的外框失配，或视觉接近但实际未对齐的情况。

## 7. 同一内容带中的异构模块与卡片对齐（高优先级）

本节适用于多个一级模块位于同一横向内容带的页面。它优先于“异构模块可不同
宽高”的一般规则：同一内容带内，模块内部结构可以不同，但所有一级模块必须共享
完整的外部矩形关系。

### 7.1 共同内容带高度

共同父级 Grid 或 Flex 必须先定义内容带高度 `H`：

```text
top(module_i) = top(module_j)
bottom(module_i) = bottom(module_j)
height(module_i) = height(module_j) = H
```

- `H` 由页面内容密度和同带模块的正常内容需求统一决定，通常为画布高度的 35%～55%。
- `H` 不得由异常偏高的单卡决定，不得取页面剩余高度，也不得使用 `100vh`、独立 `min-height`、`flex: 1` 或单模块固定高度撑满。
- 所有一级模块必须由同一个父级容器控制，顶部、底部和高度误差不得超过 2px。
- 此处的 `height: 100%` 只允许用于已由父级定义 `H` 的一级模块及其内部等分轨道；不得用于让卡片自行吞噬页面留白。

### 7.2 复合列表模块

当一级模块是“标题条 + 多张卡片”时，模块整体占满 `H`，标题条高度和标题至卡片区的
间距必须是同带共享变量。剩余高度全部交给卡片区的父级 Grid，而不是分别由文字高度决定。

```text
cardsAreaHeight = H - titleHeight - titleToCardsGap
singleCardHeight =
  (cardsAreaHeight - cardGap × (cardCount - 1)) / cardCount
```

- 卡片区使用 Grid；同组卡片等分剩余高度，间距一致。
- 两组存在逐项对应关系的卡片必须共享相同行轨道：

```text
top(leftCard_n) = top(rightCard_n)
bottom(leftCard_n) = bottom(rightCard_n)
height(leftCard_n) = height(rightCard_n)
```

- 此规则只要求同一内容带/同一对应行内等分；不要求不相关的内容带使用相同高度。

### 7.3 单体数据、成果和图表模块

单张数据卡、成果卡或图表卡的外框也必须等于 `H`。视觉强调只能来自核心数字、图表、
标题层级或颜色对比，禁止通过扩大空容器制造重点。

- 模块内部内容可以垂直居中。
- 外框仍必须与同带列表模块共享顶部、底部和整体高度。
- 箭头、流程符号和过渡文字不参与一级模块高度计算；它们只对准相关模块的内容中心或对应行中心。

### 7.4 共同父级实现

位置和尺寸必须由共同父级计算。禁止单独设置 `margin-top`、`margin-bottom`、
`top`、`bottom`、`left`、`right`、`translateX`、`translateY`、独立 `height`、
独立 `min-height` 或无意义 `padding` 来补偿对齐。

推荐实现：

```css
.content-band {
  display: grid;
  align-items: stretch;
  height: var(--content-band-height);
}

.level-one-module,
.item-card,
.result-card,
.chart-card {
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
}

.list-module {
  display: grid;
  grid-template-rows: var(--group-title-height) minmax(0, 1fr);
  row-gap: var(--group-title-gap);
}

.card-list {
  display: grid;
  grid-template-rows: repeat(var(--card-count), minmax(0, 1fr));
  row-gap: var(--card-gap);
}
```

### 7.5 修复顺序与几何验收

出现对齐问题时，必须依次修正：

1. 共同父级内容带高度 `H`；
2. 父级 Grid/Flex 的 `align-items: stretch`；
3. 一级模块 `height: 100%`、`min-height: 0` 和 `box-sizing: border-box`；
4. 复合模块内部 Grid 行轨道；
5. 标题条高度、卡片高度和间距变量；
6. 最后才处理模块内文字和图形位置。

生成完成后必须用 `getBoundingClientRect()` 读取一级模块和对应卡片的 DOM 几何数据，
不得只凭肉眼判断。以下误差全部必须小于等于 2px：一级模块的 top、bottom、height；
同组卡片的 height；对应行卡片的 top 和 bottom。任何失败都必须回到父级内容带或行轨道，
不得使用局部位移补偿。

## 8. 卡片高度三层作用域（冲突消解规则）

> 本节解决 `height:auto`、`height:100%`、`align-items:stretch` 三个规则在不同场合的冲突。核心原则：**高度规则只在自己的作用域内生效，不得跨层级引用。**

### 层级一：独立卡片（不属于任何同组外框）

独立卡片没有等高约束，高度完全由内容决定：

```css
/* 独立卡片 → 内容自决 */
.card-standalone {
  height: auto;           /* ✅ 由内容撑开 */
  min-height: 0;          /* ✅ 防止 flex 子项被撑高 */
}
```

**禁止**：对独立卡片使用 `height: 100%` 或 `align-items: stretch`（会拉伸到父容器高度）。

### 层级二：同组外框（横向/纵向/矩阵卡片组）

同组卡片必须共享由父容器 Grid/Flex 控制的统一高度轨道，**外框等高规则在此层生效**：

```css
/* 同组外框 → Grid 轨道控制等高 */
.card-group {
  display: grid;
  grid-template-columns: repeat(N, minmax(0, 1fr));
  align-items: stretch;   /* ✅ 外框等高 */
}
.card-group > .card {
  height: 100%;           /* ✅ 填满 Grid 轨道高度 */
  min-height: 0;
  box-sizing: border-box;
}
```

**禁止**：在同组外框级别对单张卡片单独设置固定 `height: Npx` 或 `min-height`（会破坏等高）。

### 层级三：卡片内部（卡片内的文字/图片/子区域）

卡片内部的文字区、图片区、标签区**各自独立控制高度**，不参与等高计算：

```css
/* 卡片内部 → 各区域自决，弹性吸收高度差 */
.card-inner-text  { flex: 1; min-height: 0; overflow: hidden; }
.card-inner-num   { flex-shrink: 0; }           /* 数字区不收缩 */
.card-inner-label { flex-shrink: 0; height: auto; }  /* 标签区自适应 */
```

**禁止**：在卡片内部对文字区使用 `height: 100%`（会等比拉伸文字容器超出卡片可视区）。

### 规则冲突速查表

| 场景 | 正确规则 | 错误做法 |
|------|---------|---------|
| 独立卡片 | `height: auto` | `height: 100%` |
| 同组外框等高 | 父级 `align-items: stretch` + 子级 `height: 100%` | 子级各自写 `height: Npx` |
| 卡片内部文字区 | `flex: 1; min-height: 0` | `height: 100%` |
| 卡片内部数字区 | `flex-shrink: 0` | `height: 100%` |
| 内容带一级模块 | `height: 100%` + 父级显式 `height` | 父级 `top+bottom` 推导，子级 `height: 100%` |
