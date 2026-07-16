# Component Interface

## 1. 调用层级

```text
页面语义类型
→ 布局组件
→ 页面模板（Page Layout + Content Pattern）
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

## 4. 可复用组件分类

组件分类与可用组件详见 `template_library.md`。规划器必须从下列分类中选择，
并在页面模板的 `allowedComponents` 范围内使用：

| 分类 | 组件 | 适用关系 |
|---|---|---|
| `Metrics` | `MetricHero`、`MetricBlock`、`MetricRail`、`DeltaBadge`、`OutcomeMetric`、`KpiStrip`、`SummaryBar` | 结果、目标、增量、KPI 证明 |
| `Charts` | `TrendChart`、`BarChart`、`PortfolioGrid`、`RadialChart`、`Legend`、`AxisLabel`、`ChartAnnotation` | 定量关系、趋势、分布、二维机会 |
| `FlowAndRelationship` | `FlowNode`、`FlowTrack`、`JourneyStage`、`StageRail`、`Connector`、`RowConnector`、`RadialConnector`、`ComparisonAxis`、`BridgeCore` | 流程、依赖、因果、连接、比较 |
| `NarrativeAndComposition` | `ClaimHero`、`EvidenceRail`、`QuoteBlock`、`ActionMechanism`、`DecisionTable`、`ListRail`、`TimelineAxis`、`PortfolioGrid`、`InsightRail` | 结论、证据、表格、清单、时间、机会与数据叙事 |
| `AdvancedRelation` | `LoopCore`、`LoopNode`、`ArcConnector`、`CapabilityLevel`、`UpgradeVector`、`BaselinePanel`、`DeltaBridge`、`FunnelStage`、`DecisionNode`、`RiskCell`、`KpiTowerHero`、`WaterfallStep` | 真实闭环、升级、同口径前后效果、转化、分支、双轴优先级、总分解与可复算增减 |
| `CaseAndEvidence` | `CaseContextPanel`、`ProblemCard`、`SolutionMechanism`、`ScreenshotFrame`、`MediaFrame`、`EvidenceTrack`、`EvidenceNote`、`ImpactMetricRail` | 案例、界面、媒体、证据与影响 |
| `ImageTextEvidence` | `SourceMediaFrame`、`SourceMediaRail`、`MediaTextSplit`、`PairedEvidenceStack`、`MediaCaption`、`DualMediaCompare`、`MediaFlowTrack` | 来源图片与市场洞察、对比、流程、案例证据 |
| `TaxonomyAndMatrix` | `TaxonomyHeader`、`MatrixCell`、`PillarHeader`、`CapabilityCell`、`CapabilityLayer`、`FoundationBar`、`PriorityLegend` | 分类、支柱、矩阵、架构 |
| `PageChrome` | `SlideBackground`、`FixedBrandLogo`、`TopBrandBar`、`SectionEyebrow`、`PageTitle`、`PageFooter`、`BackgroundFlow`、`DividerRail` | 重复页框与品牌识别 |

`PageChrome` 不得承载被遗漏的正式内容。`Charts` 不得生成原始材料不存在的数据。
`CaseAndEvidence` 中的截图和图片必须保持原始宽高比。
`ImageTextEvidence` 必须遵守 `image_text_composition.md`：来源证据图片需独立映射、保持比例，并与关联文字建立共同内容带或关系绑定。
`NarrativeAndComposition` 必须遵守 `page_composition_library.md`：每个组件计划必须服务于来源中的主结论或信息链路，不得作为无依据的装饰性拼贴。
`AdvancedRelation` 必须遵守 `advanced_relation_components.md`：只可在 `advancedRelationSpec` 的来源事实、组件容量和几何锚点全部成立时使用；任何缺失事实都必须回退为普通关系布局。

## 5. 规划格式

```json
{
  "outputSlideIndex": 6,
  "pageType": "CaseStudyPage",
  "layoutComponent": "CaseStudyLayout",
  "templateId": "case-problem-solution-impact",
  "variant": "BackgroundSolutionResult",
  "requiredCapabilities": ["PageTitle", "CaseContextPanel", "SolutionMechanism", "ImpactMetricRail"],
  "templateSelection": {
    "canvasVariant": "ultrawideVariant",
    "adaptationActions": ["reserved evidence side rail"]
  },
  "contentMapping": []
}
```

## 6. 组件缺失

真实组件不存在时，使用同名语义 class 的 HTML 兜底，并保留 `data-component-role`。不得切换为 Hero 页面绕过组件缺口。

## 7. 背景与 Logo

- `SlideBackground` 根据 `backgroundVariant` 渲染；
- `BrandLogo` 读取风格 Skill 的资产、位置和尺寸；
- 背景层不得包含 Logo；
- Logo 保持独立矢量或高清图片组件。
