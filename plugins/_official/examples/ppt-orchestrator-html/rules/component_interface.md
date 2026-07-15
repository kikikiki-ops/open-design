# Component Interface Rules
# 组件 Skill 抽象调用接口

## 1. 目标

当 PPT 组件 Skill 尚未完整接入时，总控 Skill 不应写死具体 React 组件名称，而应输出“抽象组件能力”。

这样总控 Skill 可以先稳定完成页面类型判断、拆页、内容保真和组件能力规划，后续再由组件 Skill 将抽象能力映射为真实组件。

## 2. 抽象组件能力格式

推荐输出：

```json
{
  "pageType": "MetricOverviewPage",
  "variant": "FourMetrics",
  "requiredCapabilities": [
    "PageTitle",
    "MetricGroup",
    "MetricCard",
    "TrendIcon",
    "SummaryNote"
  ]
}
```

## 3. 组件能力分类

### 3.1 页面组件

- CoverPage
- AgendaPage
- MetricOverviewPage
- MultiColumnComparisonPage
- EcosystemRelationshipPage
- StrategyPanoramaPage
- StageEvolutionPage
- DualCoreArchitecturePage
- FormulaDecompositionPage
- CaseStudyPage
- ProcessFlowPage
- CentralModelPage
- ShowcaseGalleryPage
- TransformationPage
- CapabilityRoadmapPage
- CapabilityMatrixPage
- GeneralStructuredPage

### 3.2 布局组件

- SafeArea
- HeaderArea
- TitleArea
- ContentGrid
- ThreeColumnLayout
- FourColumnLayout
- CenterFocusLayout
- SplitLayout
- TimelineLayout
- RoadmapLayout
- MatrixLayout
- GalleryLayout

### 3.3 内容组件

- PageTitle
- Subtitle
- BodyText
- MetricCard
- MetricGroup
- TrendIcon
- TagGroup
- ComparisonColumn
- StageCard
- FlowNode
- ArrowConnector
- FormulaBlock
- FactorCard
- ResultCard
- CapabilityColumn
- CapabilityItem
- GalleryItem

### 3.4 基础视觉组件

- Card
- PillTag
- IconLabel
- Divider
- ConnectorLine
- BackgroundVisual
- ChartContainer

## 4. 组件容量检查

调用组件前必须判断容量。

示例：

```json
{
  "component": "MetricGroup",
  "maxMetrics": 4,
  "currentMetrics": 6,
  "decision": "split_page"
}
```

如果内容超过组件容量：

- 不得强行塞入
- 不得删除指标
- 应拆页或更换组件

## 5. 调用优先级

当真实组件 Skill 可用时，总控 Skill 调用顺序为：

```text
页面组件
↓
布局组件
↓
内容组件
↓
基础视觉组件
```

## 6. 输出中的内容绑定

组件接收的内容应使用 `contentInventoryRefs`，而不是重新生成一份可能改写的文本。

示例：

```json
{
  "component": "MetricCard",
  "contentRefs": ["source-012", "source-013"],
  "role": "growth_metric"
}
```

## 7. 组件缺失处理

如果组件 Skill 暂不支持某个页面类型：

1. 使用最接近的页面类型
2. 或使用 `GeneralStructuredPage`
3. 保留所有正式内容
4. 在输出中标记组件缺口
5. 不得为了适配现有组件删除信息


---

## 背景组件能力 `SlideBackground`

组件 Skill 需要提供或兜底实现背景组件能力：

```json
{
  "capability": "SlideBackground",
  "props": {
    "backgroundVariant": "cover | content | closing",
    "assetPath": "string",
    "canvasWidth": 3696,
    "canvasHeight": 1008
  }
}
```

渲染要求：

- 背景层必须位于页面最底层
- 背景层不可拦截鼠标事件
- 背景图使用 `object-fit: cover`
- 背景图不承载必须可编辑的文字、数字、图表标签
- 内容安全区必须位于背景层之上

推荐 HTML：

```html
<div class="slide-background" aria-hidden="true">
  <img src="./assets/bg-content.png" alt="" />
</div>
```

## FixedBrandLogo 组件能力接口

### 能力名称

`FixedBrandLogo`

### 作用

在封面 / 内容页 / 封尾页左上角渲染独立高清 Logo。

### 入参建议

```json
{
  "assetRole": "fixed-brand-logo",
  "sourceUrl": "https://p5-ad.adkwai.com/udata/pkg/ks-ad-fe/md-tools/quick-cut/6689:5117.b90a9c9d53932e9b.svg",
  "localPath": null,
  "position": {
    "left": 96,
    "top": 54,
    "width": 170
  },
  "showOn": ["cover", "content", "closing"]
}
```

### 禁止

- 不得从背景图裁切 Logo
- 不得把 Logo 作为背景层一部分
- 不得额外生成品牌文字
