# Component Interface

## 1. 调用层级

```text
页面语义类型
→ 布局组件
→ 内容组件
→ 基础组件
```

总控输出布局组件和抽象能力，不在内容未识别时直接调用视觉组件。

## 2. 布局能力

- `HeroLayout`
- `AgendaLayout`
- `ColumnGridLayout`
- `HubBridgeLayout`
- `CaseStudyLayout`
- `ShowcaseGalleryLayout`
- `DualWingLayout`
- `RoadmapLayout`
- `ProcessLayout`
- `ChartAnalysisLayout`
- `StructuredContentLayout`

## 3. 内容能力

- `PageTitle`
- `BodyText`
- `MetricBlock`
- `MetricRail`
- `MetricCard`
- `StageCard`
- `ChartPanel`
- `TrendChart`
- `TagGroup`
- `IconFeature`
- `MediaFrame`
- `MediaStrip`
- `ContextPanel`
- `MechanismCard`
- `CapabilityRing`
- `ResultCallout`
- `SummaryBar`
- `Connector`

## 4. 规划格式

```json
{
  "outputSlideIndex": 6,
  "pageType": "CaseStudyPage",
  "layoutComponent": "CaseStudyLayout",
  "variant": "BackgroundSolutionResult",
  "requiredCapabilities": ["PageTitle", "ContextPanel", "MechanismCard", "MetricRail"],
  "contentMapping": []
}
```

## 5. 组件缺失

真实组件不存在时，使用同名语义 class 的 HTML 兜底，并保留 `data-component-role`。不得切换为 Hero 页面绕过组件缺口。

## 6. 背景与 Logo

- `SlideBackground` 根据 `backgroundVariant` 渲染；
- `BrandLogo` 读取风格 Skill 的资产、位置和尺寸；
- 背景层不得包含 Logo；
- Logo 保持独立矢量或高清图片组件。
