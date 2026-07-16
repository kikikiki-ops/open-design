# 超宽 HTML PPT 溢出与裁切验收协议

本协议是 `quality_check.md` 的强制执行补充。它解决“页面看起来有内容，但实际被画布裁切、文本从卡片溢出或缩放后遮挡”的问题。

## 1. 不可省略的 DOM 审计

每次生成或修改 HTML PPT 后，必须在浏览器中对每一张 slide 执行审计。不能只检查当前可见页，不能只凭截图肉眼判断。

审计对象：

- 每个 `.ppt-slide`；
- 每个 `[data-source-id]` 正式内容节点；
- 每个文本节点：`h1`、`h2`、`h3`、`h4`、`p`、`li`、`dt`、`dd`、`strong`、`span`；
- 每个 `[data-group-id]` 卡片组与内容带；
- 任何带固定高度、`grid`、`flex` 或 `overflow` 的模块。

必须同时验证 100% 画布和等比缩放预览。审计应输出机器可读 JSON，并将结果写入 `quality_report.json`。

## 2. 硬失败条件

任意一项命中即为失败，不得交付：

```text
slide.scrollWidth  > 3696 + 2
slide.scrollHeight > 1008 + 2
正式内容节点越出 slide 边界超过 2px
正式内容节点越出安全区超过 2px（FixedBrandLogo 与明确允许的背景装饰除外）
任一文本节点 scrollWidth  > clientWidth + 2
任一文本节点 scrollHeight > clientHeight + 2
卡片或容器使用 overflow: hidden 将正式内容裁切
不可见内容仅因父级 display / height / transform 被遮挡
```

`overflow: hidden` 只允许用于 `.ppt-slide`、背景图遮罩、裁切图片或明确的媒体框；不得用于承载正式文字的卡片、列表、指标或流程节点。

## 2.1 先诊断溢出原因（强制）

发现溢出后，必须先将问题记录为下列两类之一，再选择修复动作。禁止不经诊断直接缩小边距、字号或安全区。

### A. 安全区越界

若内容本身容量足够，只是标题、正文、数字、标签或卡片越过安全区，则必须：

- 将所有核心内容约束在 `left: 220px`、`right: 220px`、`top: 90px`、`bottom: 90px` 的安全区内；
- 通过共同父级的 `padding`、Grid/Flex 轨道、内容带位置或共享尺寸变量修复；
- 保持标题、正文、数字和标签与画布边缘之间的最小安全距离，不得贴边或越界；
- 不得以缩小安全区、负 margin、`translate`、单元素绝对定位或遮罩裁切作为补偿。

### B. 内容容量超限

若文本、指标、图表标签或关系模块在安全区内仍无法完整容纳，则必须依次执行：

1. 重新分组内容；
2. 更换容量更合适的布局或模板；
3. 必要时拆成两页或多页连续页面；
4. 保持原文内容完整，不省略、不截断、不改写。

容量超限时严禁：

- 缩小左右 `220px` 或上下 `90px` 安全边距；
- 压缩标题区、内容区或安全区以硬塞内容；
- 通过缩小字号、行高或内边距突破最小可读性要求；
- 删除、概括、截断或改写正式内容。

无论属于哪一类，最终都必须满足：100% 画布下无溢出、无遮挡、无裁切；等比缩放预览下标题、正文、数字和关系仍清晰可读。

## 3. 生成前尺寸预算

在写 HTML 前，每页先建立尺寸预算：

```text
safeHeight = 1008 - 90 - 90 = 828px
titleBand = 100px ~ 180px
contentBand = 360px ~ 550px
auxiliaryBand = 150px ~ 300px
```

每个布局必须声明：

- `titleBandHeight`；
- `contentBandHeight` 或 `contentBandRows`；
- 卡片列数、行数与 gap；
- 每张卡片最大内容行数；
- 正文字号、行高与内边距；
- 超限时的 fallback template 或拆页动作。

禁止先写一堆绝对定位内容，再依赖 `overflow:hidden` 或缩字号处理结果。

## 4. CSS 防溢出基线

所有输出必须包含下列基线；它们不替代 DOM 审计：

```css
.ppt-slide *,
.content-band > *,
[data-group-id] > * {
  min-width: 0;
}

.content-band,
[data-group-id] {
  min-height: 0;
}

.content-band[data-layout="grid"],
[data-group-id][data-layout="grid"] {
  display: grid;
}

.text-node {
  overflow-wrap: anywhere;
  word-break: normal;
}
```

同组卡片使用 Grid/Flex 的共同轨道。固定内容带允许 `height: 100%`，但子项必须 `min-height: 0`，且只在父级已声明的内容带中使用。

## 5. 必须内嵌的审计接口

每个交付 HTML 必须暴露：

```text
window.__odLayoutAudit()
```

该函数返回：

```json
{
  "status": "pass | fail",
  "canvas": { "width": 3696, "height": 1008 },
  "slides": [
    {
      "slideIndex": 1,
      "issues": [],
      "checkedSourceNodes": 0,
      "checkedTextNodes": 0
    }
  ]
}
```

若状态为 `fail`，生成器必须停止交付并进入修复循环。不得把审计结果只写到控制台后继续声明完成。

## 5.1 受限内容带内的纵向卡片组

当一个一级模块已被共同内容带高度 `H` 约束，而其内部需要纵向堆叠 `N` 张同组卡片时，必须显式定义内部行轨道。禁止让 Grid 根据默认 `auto` 行轨道、内容高度或 stretch 行为自行扩张。

推荐实现：

```css
.bounded-stack {
  display: grid;
  grid-template-rows: repeat(var(--card-count), minmax(0, 1fr));
  gap: var(--card-gap);
  height: 100%;
  min-height: 0;
}

.bounded-stack > .card {
  min-height: 0;
  height: auto;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
```

规则：

- `N` 必须与真实卡片数量一致；
- 每张卡的可用高度由共同 `H` 和统一 gap 计算，不得由其中一张卡的内容决定；
- 子卡不得设置独立 `min-height`、`height`、`margin-top`、`margin-bottom` 或位移；
- 若任何卡的正式文字在等分轨道内溢出，必须换为更高容量模板或拆页，不得让父级内容带变高、让最后一张卡越出画布、或裁切文字；
- 审计必须额外检查 `bottom(lastCard) <= bottom(parentStack) + 2px`。

### 百分比高度参照（强制）

禁止让受限内容带仅靠绝对定位的 `top` 与 `bottom` 推导高度后，再让内部模块使用 `height: 100%`。部分浏览器会让该百分比回退到整张 slide 高度，导致每张内层卡片按 1008px 轨道计算并从底部越界。

必须先定义明确的高度变量，再将其赋给父级内容带：

```css
:root {
  --safe-height: 828px;
  --content-band-height: 610px;
}

.safe-zone {
  top: 90px;
  height: var(--safe-height);
  bottom: auto;
}

.content-band {
  top: 280px;
  height: var(--content-band-height);
  bottom: auto;
}
```

只有在父级 `height` 为确定像素值或确定的 CSS 变量时，子级才允许使用 `height: 100%`、`minmax(0, 1fr)` 或等分行轨道。若父级高度仍由 `top + bottom` 推导，必须改为显式高度后再布局。

## 6. 失败修复顺序

按以下顺序修复，完成一次修复后必须重新执行全部 slide 审计：

1. 先按 2.1 判断是安全区越界还是内容容量超限，并记录诊断结果；
2. 安全区越界时，修正 title/content/auxiliary 三段高度预算与共同父级边界，不得移动安全边距；
3. 修正共同父级 Grid/Flex 的轨道、列数、行数、`gap` 与 `minmax(0, 1fr)`；
4. 容量超限时，重新分组内容并换为更适合的内容型模板；
5. 仍超限时拆成连续页面，保留原文、数字、单位和关系；
6. 仅在未突破最小可读字号的前提下，最后才微调字阶。

禁止的“修复”：

- 给文本卡片增加 `overflow:hidden`；
- 缩小正文到 18px 以下；
- 缩小左右 220px、上下 90px 的安全边距，或压缩安全区硬塞内容；
- 将整个内容带向上/下平移；
- 以独立 `height`、`min-height`、`margin`、`translate` 补偿单个模块；
- 删除、截断、省略正式内容。

## 7. 交付记录

`quality_report.json` 必须记录：

```json
{
  "layoutAudit": {
    "status": "pass",
    "checkedSlides": 10,
    "checkedSourceNodes": 0,
    "checkedTextNodes": 0,
    "maxCanvasOverflowPx": 0,
    "maxSafeAreaOverflowPx": 0,
    "maxTextOverflowPx": 0
  }
}
```

不能运行浏览器审计时，状态必须为 `blocked`，不得标记为 `complete` 或 `pass`。


## 8. 卡片内部防溢出基线（硬约束）

本节补充 §4"CSS 防溢出基线"，专门处理**卡片内部**各子区域的溢出问题。

### 8.1 卡片外框规则

卡片的外框尺寸必须由**父级 Grid/Flex 轨道**决定，不得依赖内容自动撑高。

```css
/* 卡片外框 */
.card,
[class*="-card"] {
  box-sizing: border-box;
  min-width: 0;
  min-height: 0;
  overflow: hidden;          /* 仅裁切圆角视觉区域，不作为内容容器 */
}
```

> **重要**：卡片外框的 `overflow: hidden` 仅允许为圆角（`border-radius`）视觉裁切服务。
> 卡片内部任何承载正式文字、指标或列表的子区域，**禁止**用 `overflow: hidden` 将文字截断。

### 8.2 文字区防溢出

文字区（标题、正文、说明、结论）使用基于行数的显式上限，而非无限自动扩张。

```css
/* 通用文字节点 */
.card-title,
.card-body,
.card-summary,
.metric-title,
.metric-summary,
h2, h3, h4, p, li, dt, dd {
  overflow-wrap: anywhere;   /* CJK + 长英文均可换行 */
  word-break: normal;
  /* 禁止 white-space: nowrap（除胶囊标签外） */
}
```

当文字区声明了最大行数限制时，才允许使用 `-webkit-line-clamp`：

```css
/* 允许：组件规格中已明确"最多 N 行"的文字区 */
.metric-title {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;          /* 此处 overflow: hidden 配合 line-clamp 使用，允许 */
}
```

**使用 `-webkit-line-clamp` 的前提**：

1. 组件规格中已声明该区域"最多 N 行"；
2. 审计时 `scrollHeight <= clientHeight`（不超过限制行数）；
3. 被截断的文字必须是"补充描述"而非"核心数字或指标名称"；
4. 核心数字区、指标名称区、卡片顶部状态标签**禁止**用 `line-clamp` 截断。

### 8.3 核心数字防溢出

核心数字区绝对不得截断，必须在设计阶段保证容量足够。

```css
.metric-number,
.number-xl,
.number-lg,
.number-md,
[class*="number"] {
  overflow-wrap: normal;     /* 数字不得从中断行 */
  white-space: nowrap;       /* 数字与单位保持在同一行 */
  /* 禁止 overflow: hidden */
  /* 禁止 width: 100% 无 max-width 而允许数字超出容器 */
}
```

若数字在分配宽度内溢出，**唯一合法修复**是：

1. 缩减数字区最大宽度限制，留出更大横向空间；
2. 降低一级字阶（如从 100px 换 72px），但不得低于字号层级规范的最小值；
3. 换用更宽的布局模板；
4. **禁止**截断数字、加省略号或用 `overflow: hidden` 隐藏。

### 8.4 胶囊标签防溢出

```css
.tag,
.metric-tag,
[class*="-tag"],
[class*="-badge"],
[class*="-kicker"] {
  white-space: nowrap;       /* 标签不换行 */
  flex-shrink: 0;            /* 在 flex 行中不被压缩 */
  max-width: 90%;            /* 禁止超出卡片宽度 */
  overflow: hidden;          /* 允许：标签是明确的行内元素，不含多行正文 */
  text-overflow: ellipsis;   /* 仅在标签文字异常长时生效 */
}
```

### 8.5 列表内容防溢出

卡片内的列表（`ul`、`ol`、`.list-item`）必须放置在**有明确高度的区域**内，不得自由扩张。

```css
/* 列表容器 —— 必须有明确高度 */
.card-list-zone {
  overflow: hidden;          /* 允许：明确的列表容器区域 */
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.card-list-zone > ul,
.card-list-zone > ol {
  min-height: 0;
  overflow: hidden;
}

/* 列表条目 */
.card-list-zone li {
  overflow-wrap: anywhere;
  word-break: normal;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;     /* 每条列表项最多 2 行 */
  overflow: hidden;
}
```

若列表项超过可用高度，必须精简文字或拆页，**禁止**压缩列表项字号或行高至最小字号以下。

### 8.6 图表区防溢出

```css
.metric-chart,
.chart-zone,
[class*="-chart"] {
  min-height: 0;             /* 允许 Grid 1fr 正常收缩 */
  overflow: hidden;          /* 允许：图表是媒体框 */
  width: 100%;
}

.metric-chart svg,
.metric-chart canvas {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;         /* SVG 内部可以超出 viewBox 做轻微视觉装饰 */
}
```

### 8.7 Flex 子项默认设置

凡是卡片内部使用 Flex 布局的子项，必须设置：

```css
.card > *,
.metric-card > *,
[class*="-card"] > * {
  min-width: 0;
  min-height: 0;
  box-sizing: border-box;
}
```

### 8.8 卡片防溢出禁止事项

| 禁止行为 | 原因 |
|----------|------|
| 对承载正文、指标或列表的卡片子区域使用 `overflow: hidden` | 会静默裁切正式内容 |
| 对核心数字区使用 `text-overflow: ellipsis` | 数字被截断等于信息损失 |
| 对卡片的 `padding` 做负值或 0 来硬塞内容 | 视觉贴边，内容不可读 |
| 通过 `transform: scale()` 缩小超出卡片的内容 | 改变布局层的实际尺寸 |
| 对超出内容增加 `position: absolute` 再 clip | 绕过 layout 而非解决问题 |
| 让某一个卡片的高度独立于同组其他卡片 | 破坏等高组件规范 |
| 缩小字号至字号层级最小值（正文 24px）以下 | 破坏字号层级规范 |

### 8.9 DOM 审计新增检查项

在 `§5 必须内嵌的审计接口` 的基础上，`__odLayoutAudit()` 还必须检查：

```text
卡片外框 scrollWidth > clientWidth + 2px
卡片外框 scrollHeight > clientHeight + 2px
核心数字节点 scrollWidth > parentNode.clientWidth + 2px
文字区节点被 overflow:hidden 截断（scrollHeight > clientHeight）
line-clamp 被用于核心数字区或指标名称区
胶囊标签宽度 > 父卡片宽度 × 90%
```
