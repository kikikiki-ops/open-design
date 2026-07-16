# HTML Output Contract

## 1. Deck 与 Slide 容器

完整演示必须使用可翻页的 deck 容器组织独立页面，禁止以纵向长页面或单张拼图交付。每个 slide 固定为 3696 × 1008，显示时可缩放预览，但不得改变其内部排版基准。

最终产物必须写入当前项目根目录：

- `index.html`：包含全部可翻页 slide 的可预览 HTML PPT。
- `index.html.artifact.json`：同级 Open Design artifact 元数据，声明 HTML 预览入口。

```json
{
  "kind": "html",
  "entry": "index.html",
  "renderer": "html",
  "status": "complete",
  "source": "autoboard-html-ppt"
}
```

优化 `.pptx` 时还必须输出 `intake_result.json`、`content_inventory.json`、
`page_plan.json` 和 `quality_report.json`。这些辅助文件不能替代 `index.html`。

```html
<main class="deck-stage" data-canvas-width="3696" data-canvas-height="1008">
  <!-- 独立 .ppt-slide 页面 -->
</main>
```

```css
.ppt-slide {
  width: 3696px;
  height: 1008px;
  position: relative;
  overflow: hidden;
}
```

## 2. Slide 容器

```html
<section
  class="ppt-slide"
  data-slide-index="6"
  data-source-pages="6"
  data-page-role="content"
  data-page-type="MultiColumnComparisonPage"
  data-layout-component="ColumnGridLayout"
  data-page-variant="ThreeColumnsWithMetrics">
</section>
```

每页必须声明画布、角色、背景和来源页。`data-slide-index` 从 1 开始连续编号；拆分页仍保留原始 `data-source-pages`。

## 3. 来源与关系绑定

正式内容必须带：

```html
data-source-id="source-031"
```

分组和关系建议带：

```html
data-group-id="group-006-01"
data-relation-id="relation-006-02"
```

组件必须带：

```html
data-component-role="metric-card"
```

## 4. DOM 顺序

DOM 阅读顺序应与内容账本的叙事顺序一致，不能仅通过绝对定位制造视觉顺序。

## 5. 可编辑性

标题、正文、数字、单位、标签、图例和图表说明必须为真实可编辑 DOM。禁止把整页或正文烘焙成图片。

## 6. 风格 Token

使用 CSS variables 接收视觉风格，不得在总控中硬编码整套色彩。

## 7. 超宽屏

固定画布 `3696 × 1008`；内容区横向展开，但不得将普通 16:9 卡片无限拉宽。通过列数、间距、分组和横向叙事利用宽度。

## 8. 交付检查

- 每个 `must-render` 内容节点都应有 `data-source-id`；
- 所有独立 slide 在 100% 尺寸和缩放预览下均不得出现溢出、遮挡或裁切；
- 会议名称、日期、演讲人、联合品牌、二维码只有在源材料或用户指令中存在时才允许渲染；
- Logo、标题、正文、数字、图表标签和二维码不得烘焙进背景图或整页图片。

## 9. 必须内嵌的溢出审计

所有交付 HTML 必须在导航与缩放逻辑之后定义并调用 `window.__odLayoutAudit()`。该函数必须逐页检查，即使 slide 当前处于隐藏状态也不得跳过。

```html
<script>
(function () {
  var CANVAS_W = 3696;
  var CANVAS_H = 1008;
  var SAFE = { left: 220, right: 3476, top: 90, bottom: 918 };
  var TOLERANCE = 2;

  function logicalRect(rect, slideRect, scale) {
    return {
      left: (rect.left - slideRect.left) / scale,
      top: (rect.top - slideRect.top) / scale,
      right: (rect.right - slideRect.left) / scale,
      bottom: (rect.bottom - slideRect.top) / scale
    };
  }

  window.__odLayoutAudit = function () {
    var slides = Array.from(document.querySelectorAll('.ppt-slide'));
    var result = { status: 'pass', canvas: { width: CANVAS_W, height: CANVAS_H }, slides: [] };

    slides.forEach(function (slide) {
      var wasHidden = getComputedStyle(slide).display === 'none';
      var priorDisplay = slide.style.display;
      var priorVisibility = slide.style.visibility;
      if (wasHidden) {
        slide.style.display = 'block';
        slide.style.visibility = 'hidden';
      }

      var issues = [];
      var slideRect = slide.getBoundingClientRect();
      var scale = slideRect.width / CANVAS_W || 1;
      if (slide.scrollWidth > CANVAS_W + TOLERANCE || slide.scrollHeight > CANVAS_H + TOLERANCE) {
        issues.push({ code: 'canvas-scroll-overflow', width: slide.scrollWidth, height: slide.scrollHeight });
      }

      Array.from(slide.querySelectorAll('[data-source-id]')).forEach(function (node) {
        var rect = logicalRect(node.getBoundingClientRect(), slideRect, scale);
        var outsideCanvas = rect.left < -TOLERANCE || rect.top < -TOLERANCE || rect.right > CANVAS_W + TOLERANCE || rect.bottom > CANVAS_H + TOLERANCE;
        var outsideSafe = !node.hasAttribute('data-allow-safe-overflow') && (rect.left < SAFE.left - TOLERANCE || rect.top < SAFE.top - TOLERANCE || rect.right > SAFE.right + TOLERANCE || rect.bottom > SAFE.bottom + TOLERANCE);
        if (outsideCanvas || outsideSafe) issues.push({ code: outsideCanvas ? 'canvas-clip' : 'safe-area-overflow', sourceId: node.dataset.sourceId, rect: rect });
      });

      Array.from(slide.querySelectorAll('[data-bounded-stack]')).forEach(function (stack) {
        var stackRect = logicalRect(stack.getBoundingClientRect(), slideRect, scale);
        var cards = Array.from(stack.children).filter(function (child) { return child.classList.contains('card'); });
        var expected = Number(stack.dataset.cardCount);
        if (expected && cards.length !== expected) issues.push({ code: 'bounded-stack-card-count', expected: expected, actual: cards.length });
        cards.forEach(function (card, index) {
          var cardRect = logicalRect(card.getBoundingClientRect(), slideRect, scale);
          if (cardRect.top < stackRect.top - TOLERANCE || cardRect.bottom > stackRect.bottom + TOLERANCE) {
            issues.push({ code: 'bounded-stack-overflow', cardIndex: index + 1 });
          }
        });
      });

      Array.from(slide.querySelectorAll('h1,h2,h3,h4,p,li,dt,dd,strong,span')).forEach(function (node) {
        if (!node.textContent.trim() || node.clientWidth === 0 || node.clientHeight === 0) return;
        if (node.scrollWidth > node.clientWidth + TOLERANCE || node.scrollHeight > node.clientHeight + TOLERANCE) {
          issues.push({ code: 'text-overflow', text: node.textContent.trim().slice(0, 48) });
        }
        var overflow = getComputedStyle(node).overflow;
        if (overflow === 'hidden' || overflow === 'clip') issues.push({ code: 'text-clipping-style', text: node.textContent.trim().slice(0, 48) });
      });

      result.slides.push({ slideIndex: Number(slide.dataset.slideIndex), issues: issues, checkedSourceNodes: slide.querySelectorAll('[data-source-id]').length, checkedTextNodes: slide.querySelectorAll('h1,h2,h3,h4,p,li,dt,dd,strong,span').length });
      if (issues.length) result.status = 'fail';

      if (wasHidden) {
        slide.style.display = priorDisplay;
        slide.style.visibility = priorVisibility;
      }
    });

    document.documentElement.dataset.odLayoutAudit = result.status;
    return result;
  };
})();
</script>
```

生成器必须在 100% 画布与缩放预览各调用一次。若任一结果不是 `pass`，必须按 `layout_overflow_protocol.md` 重排或拆页，不能交付。

## 超宽画布内容模块宽度约束

超宽画布只代表页面可用横向空间更大，不代表单个内容模块也可无限变宽。

**文本卡片宽度上限：**

```css
.text-card {
  width: 100%;
  max-width: var(--text-card-max-width); /* 推荐 800px–1200px，不超过画布宽度 38% */
}
.card-copy {
  max-width: 34ch;   /* 中文正文 ≈ 22–40 汉字/行 */
  line-height: 1.5;
}
```

**图片容器必须使用 cover 裁切：**

```css
.image-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;                  /* 禁止 contain */
  object-position: center center;     /* 根据主体位置调整 */
  display: block;
}
```

禁止：`object-fit: contain`、图片悬浮在容器中、图片上下左右出现无意义空白、拉伸变形填满容器。

**图文组合比例约束：**

- 图片主导型：图片 55%–70%，文本 30%–45%
- 信息主导型：文本 55%–65%，图片 35%–45%
- 超宽画布中不建议出现单侧超过模块宽度 75% 的普通内容区

```css
.media-card {
  display: grid;
  grid-template-columns: minmax(0, var(--image-max-width)) minmax(0, var(--text-max-width));
  gap: var(--content-gap);
}
```

**卡片组最大宽度：**

```css
.card-group {
  width: min(100%, var(--group-max-width));
  margin-inline: auto;
  display: grid;
  gap: var(--card-gap);
}
```

禁止主体内容从左安全区一直连续铺到右安全区；内容组必须有明确最大宽度上限。


## 连接枢纽组件 CSS 约束

以下规则与 `components.md §3.9 ConnectionHub` 配套，必须内嵌于所有使用连接枢纽组件的 HTML 输出。

### 核心节点严格正圆

```css
.hub-node,
[class*="hub-node"] {
  aspect-ratio: 1 / 1;
  width: var(--hub-node-size, 220px);
  max-width: var(--hub-node-max, 300px);
  min-width: 100px;
  border-radius: 50%;
  box-sizing: border-box;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
}
```

### 枢纽组超宽画布约束

```css
.connection-hub {
  width: min(100%, var(--hub-max-width, 2800px));
  margin-inline: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--hub-gap, 48px);
}

.hub-modules {
  display: grid;
  align-items: stretch;
  gap: var(--hub-module-gap, 24px);
  width: min(100%, var(--hub-modules-max-width, 900px));
  min-width: 0;
}

.hub-module {
  min-width: 0;
  min-height: 0;
  box-sizing: border-box;
}
```

### 连接线最小线宽（大屏可读性）

```css
.hub-spokes line,
.hub-spokes path,
.hub-spoke {
  stroke-width: 2;            /* 主路径 ≥ 2px */
}

.hub-spokes.secondary line,
.hub-spokes.secondary path {
  stroke-width: 1.5;          /* 辅助路径最小 1.5px */
}
```

### 运算符节点

```css
.hub-operator {
  flex-shrink: 0;
  font-size: 48px;
  font-weight: 300;
  color: var(--gold-main);
  line-height: 1;
  text-align: center;
  min-width: 48px;
}
```

### 外部模块防溢出（复用 §8 card overflow 规则）

```css
.hub-module > * {
  min-width: 0;
  min-height: 0;
  box-sizing: border-box;
}

.hub-module-title {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.hub-module-body {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}
```
