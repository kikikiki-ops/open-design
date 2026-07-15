# HTML Output Contract

## 1. Slide 容器

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

## 2. 来源与关系绑定

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

## 3. DOM 顺序

DOM 阅读顺序应与内容账本的叙事顺序一致，不能仅通过绝对定位制造视觉顺序。

## 4. 可编辑性

标题、正文、数字、单位、标签、图例和图表说明必须为真实可编辑 DOM。禁止把整页或正文烘焙成图片。

## 5. 风格 Token

使用 CSS variables 接收视觉风格，不得在总控中硬编码整套色彩。

## 6. 超宽屏

固定画布 `3696 × 1008`；内容区横向展开，但不得将普通 16:9 卡片无限拉宽。通过列数、间距、分组和横向叙事利用宽度。
