# 页面级纵向容量预算与溢出检测协议（P0 硬约束）

本协议用于解决纵向卡片组、列表、步骤、属性项或多模块在固定画布中超出页面底部、越过安全区，或被 `overflow: hidden` 静默裁切的问题。

**本协议优先级高于**：
- 卡片等高规则
- 卡片自动高度规则
- 页面低信息密度规则
- 模块视觉对齐规则
- 模板默认布局
- 通过裁切或省略限制正式内容的规则

---

## 1. 区分两类溢出

生成页面前必须分别检查以下两类溢出。

### 1.1 卡片内部溢出

指文字、数字、图片、图表或其他正式内容超出单张卡片内部边界。

### 1.2 页面级溢出

指卡片、卡片组、标题、列表或其他正式模块超出页面安全区，或被画布的 `overflow: hidden` 裁切。

**不得因为单张卡片内部没有溢出，就判定整个页面没有溢出。**

---

## 2. 页面可用高度必须显式计算

固定画布参数：

```text
画布高度：1008px
上安全边距：90px
下安全边距：90px
安全区总高度：828px
```

主体内容区高度必须按以下公式计算：

```
bodyAvailableHeight
= safeZoneHeight
  - pageHeaderHeight
  - headerToBodyGap
  - optionalFooterHeight
  - bodyTopPadding
  - bodyBottomPadding
```

页面规划阶段必须明确记录：

```json
{
  "safe_zone_height": 828,
  "page_header_height": 120,
  "header_body_gap": 48,
  "optional_footer_height": 0,
  "body_top_padding": 0,
  "body_bottom_padding": 0,
  "body_available_height": 660
}
```

**禁止在未计算 `bodyAvailableHeight` 的情况下，直接生成纵向卡片组或多行列表。**

---

## 3. 纵向卡片组必须进行容量预估

纵向卡片组所需总高度按以下公式计算：

```
stackRequiredHeight
= 所有卡片预估高度之和
  + (卡片数量 - 1) × 卡片间距
  + 卡片组顶部内边距
  + 卡片组底部内边距
```

必须满足：

```
stackRequiredHeight <= bodyAvailableHeight
```

建议至少预留 16px 的安全余量：

```
stackRequiredHeight <= bodyAvailableHeight - 16px
```

如果不满足，**不得继续使用当前纵向结构生成页面，必须切换布局、更换模板或拆页。**

---

## 4. 左右分栏必须共享同一主体内容带

左右分栏页面中，左右两列必须使用相同的顶部位置、底部位置和可用高度：

```
top(leftColumn) = top(rightColumn)
bottom(leftColumn) = bottom(rightColumn)
height(leftColumn) = height(rightColumn)
```

页面标题、章节标签和辅助眉题必须放在**统一标题区**中，不得只占用左侧栏的高度。

推荐 HTML 结构：

```html
<section class="safe-zone">
  <header class="page-header">
    页面标签与主标题
  </header>
  <div class="body-band">
    <div class="left-column">左侧内容</div>
    <div class="right-column">右侧内容</div>
  </div>
</section>
```

禁止：
- 页面标题只放在左列内部；
- 左列从标题下方开始，右列从页面更高位置开始；
- 左右两列分别计算主体高度；
- 一列使用固定高度，另一列由内容无限撑高；
- 左右两列底部明显不对齐；
- 一列溢出后依靠画布裁切隐藏。

---

## 5. 四个同级短模块的布局切换规则

当单个内容区域包含 4 个语义同级、内容量相近的短模块时，生成前必须评估以下布局：

| 布局选项 | 适用条件 |
|---------|---------|
| 2 × 2 卡片矩阵 | 默认优先 |
| 四行纵向紧凑列表 | 容量验证通过 |
| 两列双行结构 | 内容较长时 |
| 拆分为连续两页 | 容量明显不足时 |

默认优先级：`2 × 2 卡片矩阵 > 四行纵向紧凑列表 > 拆分页面`

只有当四行卡片的总预估高度不超过主体可用高度的 90% 时，才允许使用四行纵向堆叠：

```
stackRequiredHeight <= bodyAvailableHeight × 0.9
```

如果超过 90%，必须切换为 2 × 2 矩阵、两列双行结构或拆页。

禁止通过以下方式强行保留四行结构：
- 缩小字号；
- 删除正式内容；
- 压缩安全边距；
- 使用负间距；
- 减少卡片内边距至规范以下；
- 裁切最后一张卡片；
- 将最后一张卡片移动到画布以外。

---

## 6. 纵向卡片组父容器规则

纵向同级卡片必须放在共同的 Grid 或 Flex 父容器中，由父容器统一控制可用高度、行间距和卡片边界。

```css
.vertical-card-group {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-rows: repeat(var(--item-count), minmax(0, 1fr));
  gap: 24px;
}

.vertical-card-group > .card {
  min-width: 0;
  min-height: 0;
  height: 100%;
  box-sizing: border-box;
}
```

如果卡片内容无法在父级分配的轨道内完整显示，说明当前布局容量不足，**必须切换布局或拆页，不得让卡片自行撑高并超出父容器。**

---

## 7. 四项内容优先使用 2 × 2 矩阵

当页面存在 4 个同级属性、能力、价值、问题、策略或阶段模块时，优先使用：

```css
.compact-card-matrix {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 24px;
}
```

矩阵卡片必须满足：两列等宽、两行等高、统一圆角、统一内边距、统一标签位置、统一标题基线、统一卡片间距；不逐张设置宽高；不使用单独的 margin 或 transform 修补位置。

---

## 8. 正式内容禁止静默裁切

以下方式**不得**用于解决页面级或卡片内部溢出：

```
overflow: hidden   text-overflow: ellipsis   line-clamp
display: none      visibility: hidden         opacity: 0
将内容移动到画布外  将卡片移动到安全区外
只展示列表前几项   裁掉最后一张卡片
隐藏部分正文       用遮罩覆盖溢出内容
将文字颜色设置为透明  用缩放变换将内容压缩至不可读
```

`overflow: hidden` 只允许用于：

- 画布外的背景装饰；
- 图片容器的等比裁切；
- 图表绘图区；
- 不承载正式信息的装饰元素。

不得用于隐藏：页面标题、正文、标签、数据、图片证据、图表标签、完整卡片、来源文件中的正式内容。

---

## 9. 卡片高度规则的适用边界

### 9.1 独立文本卡片

```css
height: auto; /* 卡片高度由内容决定，但不得超过主体内容区可用高度 */
```

### 9.2 横向同组卡片或矩阵卡片

```css
height: 100%;
min-height: 0; /* 由父级 Grid 轨道决定统一高度 */
```

### 9.3 纵向多卡片组

必须先计算整体容量，再由共同父容器分配轨道高度。

禁止：
- 将独立卡片的 `height: auto` 直接应用于多卡纵向堆叠；
- 在父容器高度不明确时使用 `height: 100%`；
- 让每张卡片根据内容无限向下撑高；
- 使用固定大高度导致最后一张卡片越界。

---

## 10. 页面级真实边界检测

生成 HTML 后，必须通过 DOM 几何信息检查每一个正式内容节点。

必须满足（误差 ±2px）：

```
elementRect.left   >= safeZoneRect.left
elementRect.right  <= safeZoneRect.right
elementRect.top    >= safeZoneRect.top
elementRect.bottom <= safeZoneRect.bottom

element.scrollHeight <= element.clientHeight
element.scrollWidth  <= element.clientWidth
```

推荐检测函数：

```js
function checkSlideOverflow(slide) {
  const safeZone = slide.querySelector(".safe-zone");
  if (!safeZone) return [{ code: "safe-zone-missing", message: "页面缺少安全区节点" }];

  const safeRect = safeZone.getBoundingClientRect();
  const tolerance = 2;
  const errors = [];

  const selectors = [
    "[data-source-id]", "[data-content-id]",
    ".page-title", ".page-header", ".content-module",
    ".card", ".media-frame", ".chart-frame", ".formal-content"
  ].join(",");

  safeZone.querySelectorAll(selectors).forEach((node) => {
    const rect = node.getBoundingClientRect();
    const outsideSafeZone =
      rect.left   < safeRect.left   - tolerance ||
      rect.right  > safeRect.right  + tolerance ||
      rect.top    < safeRect.top    - tolerance ||
      rect.bottom > safeRect.bottom + tolerance;
    const internalOverflow =
      node.scrollHeight > node.clientHeight + tolerance ||
      node.scrollWidth  > node.clientWidth  + tolerance;

    if (outsideSafeZone || internalOverflow) {
      errors.push({
        code: outsideSafeZone ? "content-outside-safe-zone" : "content-internal-overflow",
        outsideSafeZone, internalOverflow,
        rect: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom },
        scrollSize: { width: node.scrollWidth, height: node.scrollHeight },
        clientSize: { width: node.clientWidth, height: node.clientHeight }
      });
    }
  });
  return errors;
}
```

**只要存在一个正式内容节点越界或被内部裁切，页面质量检查必须失败。**

---

## 11. 最后一项完整可见检查

对于纵向卡片组、列表、步骤组、时间轴和属性列表，必须单独检查最后一个正式内容节点。

必须满足：

```
lastItemRect.bottom <= bodyBandRect.bottom - 2px
```

最后一个节点必须：完整显示、底部圆角可见、底部边框可见、正文完整可读、不与页面底部装饰重叠、不被画布边缘裁掉、不依赖滚动查看。

**如果最后一项仅部分可见，必须判定为页面溢出。**

---

## 12. 溢出修复顺序

发现页面级纵向溢出后，必须**严格按照以下顺序**处理：

1. 检查是否存在重复标题、重复品牌文字或无意义辅助信息；
2. 将标题从局部分栏中移出，建立统一页面标题区；
3. 重新计算主体内容区可用高度；
4. 检查卡片组父容器是否具有明确高度和 `min-height: 0`；
5. 将四行纵向卡片切换为 2 × 2 矩阵；
6. 将单列多卡片切换为两列多行结构；
7. 在规范允许范围内调整卡片间距和内边距；
8. 更换为容量更匹配的页面模板；
9. 将正式内容拆分为连续页面。

禁止优先执行：缩小字号、压缩安全区、使用负 margin、使用 transform 整体上移内容、将卡片移动到画布以外、删除或改写正式内容、使用 `overflow: hidden` 隐藏内容、裁掉最后一张卡片、将内容缩放至远距离不可读。

---

## 13. 页面级失败条件

出现以下任一情况，页面必须判定为失败：

| 失败代码 | 触发条件 |
|---------|---------|
| `page-content-outside-safe-zone` | 正式内容节点越出安全区边界 |
| `page-bottom-overflow` | 模块超出页面底部安全区 |
| `vertical-stack-height-exceeded` | 纵向卡片组总高度超过可用高度 |
| `formal-content-clipped` | 正式内容被 overflow:hidden 静默裁切 |
| `formal-content-hidden-by-overflow` | 正式内容不可见但未声明 do-not-render |
| `column-height-mismatch` | 左右两列主体高度不一致（误差 > 2px） |
| `body-band-height-undefined` | 主体内容带无明确高度约束 |
| `layout-capacity-not-calculated` | 未在 page_plan 中记录 body_available_height |
| `last-card-partially-visible` | 最后一张卡片只有部分可见 |
| `scroll-height-exceeds-client-height` | scrollHeight > clientHeight + 2px |
| `scroll-width-exceeds-client-width` | scrollWidth > clientWidth + 2px |
| `formal-content-moved-outside-canvas` | 正式内容被移动到画布外 |
| `layout-fixed-by-negative-margin` | 使用负 margin 修补溢出 |
| `layout-fixed-by-transform` | 使用 transform 整体上移掩盖溢出 |

**不得生成"存在溢出警告但仍通过"的质量结果。**

---

## 14. 生成前容量检查清单

```text
[ ] 是否计算页面安全区总高度（828px）
[ ] 是否计算标题区实际高度
[ ] 是否计算标题与主体之间的间距
[ ] 是否计算主体内容区可用高度（body_available_height）
[ ] 是否计算纵向卡片组所需总高度（stackRequiredHeight）
[ ] 是否为容量计算预留至少 16px 误差空间
[ ] 左右两列是否共享同一个主体内容带
[ ] 四个同级模块是否评估过 2 × 2 矩阵
[ ] 当前卡片数量是否适合纵向排列
[ ] 当前布局是否会导致最后一项越过主体底部
[ ] 是否没有依赖 overflow:hidden 隐藏正式内容
[ ] 如果当前布局放不下，是否已切换布局或拆页
```

未通过容量检查，不得进入最终 HTML 生成阶段。

---

## 15. 生成后溢出检查清单

```text
[ ] 所有正式内容是否完整位于安全区内
[ ] 页面标题是否未侵占主体内容带
[ ] 左右两列顶部是否对齐（误差 ≤ 2px）
[ ] 左右两列底部是否对齐（误差 ≤ 2px）
[ ] 最后一张卡片是否完整可见
[ ] 最后一项正文是否完整可读
[ ] 是否不存在任何卡片被画布边缘裁切
[ ] 是否不存在任何卡片被其他模块遮挡
[ ] 所有正式节点的 scrollHeight 是否未超过 clientHeight
[ ] 所有正式节点的 scrollWidth 是否未超过 clientWidth
[ ] 是否未使用 line-clamp 隐藏正式内容
[ ] 是否未使用 overflow:hidden 隐藏正式内容
[ ] 是否未通过负 margin 或 transform 修补溢出
[ ] 100% 原始画布下是否无溢出
[ ] 缩放预览状态下是否无溢出
[ ] 如果纵向容量不足，是否已经切换布局或拆页
```

---

## 16. 针对左右双栏品牌价值页的布局规则

当页面结构为：左侧 3～5 个品牌属性 / 价值 / 策略模块 + 右侧 1 个品牌主张 / 核心理念主卡，必须使用统一页面标题区和统一主体内容带。

```html
<section class="page-layout">
  <header class="page-header">
    <div class="section-eyebrow">BRAND · 品牌核心价值</div>
    <h1 class="page-title">品牌核心价值</h1>
  </header>
  <div class="page-body">
    <div class="brand-value-grid">
      <article class="brand-value-card"></article>
      <article class="brand-value-card"></article>
      <article class="brand-value-card"></article>
      <article class="brand-value-card"></article>
    </div>
    <article class="brand-hero-card"></article>
  </div>
</section>
```

```css
.page-layout {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 48px;
}
.page-header { min-height: 0; }
.page-body {
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 32px;
}
.brand-value-grid {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 24px;
}
.brand-value-card,
.brand-hero-card {
  min-width: 0;
  min-height: 0;
  height: 100%;
  box-sizing: border-box;
}
```

当左侧存在 4 个同级模块时，默认使用 2 × 2 矩阵，不得默认使用四行纵向堆叠。只有经过容量计算，确认四行纵向结构不超过主体可用高度的 90% 时，才允许保留四行结构。

---

## 17. 核心执行原则

1. **页面不能滚动，不等于内容可以被裁掉**。`overflow: hidden` 是固定画布的技术约束，不是溢出修复方案。
2. 必须先计算页面容量，再选择页面布局。不得先生成内容，再依靠画布裁切隐藏错误。
3. 四个同级短模块在超宽画布中优先使用 2 × 2 矩阵，而不是默认纵向堆叠。
4. 页面标题必须使用独立标题区，不得只占用某一个分栏的纵向空间。
5. 左右分栏必须共享相同的主体顶部、主体底部和可用高度。
6. 如果正式内容无法在字号、间距、卡片内边距和安全区规范内完整显示，就**必须更换布局或拆页**。
