# Layout Selection

## 1. 页面类型到布局组件

| 页面类型 | 首选布局 | 常用变体 |
|---|---|---|
| CoverPage | HeroLayout | CoverHero |
| SectionDividerPage | HeroLayout | SectionHero |
| ClosingPage | HeroLayout | ClosingHero |
| AgendaPage | AgendaLayout | NumberedColumns |
| MetricOverviewPage | ColumnGridLayout | MetricGrid |
| MultiColumnComparisonPage | ColumnGridLayout | EqualColumns / PrimarySecondary |
| StrategyPanoramaPage | ColumnGridLayout | StrategyColumns |
| StageEvolutionPage | ColumnGridLayout / RoadmapLayout | StageColumns / Sequence |
| CapabilityMatrixPage | ColumnGridLayout | CapabilityColumns |
| EcosystemRelationshipPage | HubBridgeLayout | Bridge |
| FormulaDecompositionPage | HubBridgeLayout | Equation |
| CentralModelPage | HubBridgeLayout | CoreRing |
| CaseStudyPage | CaseStudyLayout | BackgroundSolutionResult |
| ShowcaseGalleryPage | ShowcaseGalleryLayout | MetricGalleryMetric |
| DualCoreArchitecturePage | DualWingLayout | DualCore |
| TransformationPage | DualWingLayout | BeforeActionAfter |
| ProcessFlowPage | ProcessLayout | Linear / Stepped |
| CapabilityRoadmapPage | RoadmapLayout | Path / Sequence / Curve |
| ChartAnalysisPage | ChartAnalysisLayout | ChartWithInsights |
| StructuredContentPage | StructuredContentLayout | TwoRegion / ThreeRegion / ListWithEvidence |

## 2. 容量门禁

组件容量超限时必须拆页或换变体。

建议上限：

- Hero：4 个 must-render 项，0 个指标；
- MetricGrid：2～4 个指标；
- EqualColumns：2～5 列；
- CaseStudy：1 个案例，3 个主要区域；
- Process：3～7 个节点；
- CapabilityMatrix：3～5 类；
- Gallery：3～8 张主要图片。

## 3. 内容映射

布局选择后必须输出 `contentMapping`：

```json
[
  {"region": "title", "contentRefs": ["source-001"]},
  {"region": "column-1", "contentRefs": ["source-002", "source-003"]},
  {"region": "result-rail", "contentRefs": ["source-010"]}
]
```

所有 `must-render` 的 `source-id` 必须进入且只能进入一个主要内容区域；需要重复用于图例或注释时，应标记 `intentionalDuplicate = true`。
