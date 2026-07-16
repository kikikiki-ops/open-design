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

## 3. 内容密度判定与填充策略

布局前必须先为每页标记内容密度，并据此选择结构；禁止将所有页面默认渲染为三等分卡片。

| 内容密度 | 首选结构 | 填充策略 |
|---|---|---|
| 高密度 | 紧凑卡片、分栏、表格 | 以内容分组和扫描效率为先，必要时拆页 |
| 中密度 | 卡片 + 数据图形 | 用关键数字、对比图形或关系线补足视觉层级 |
| 低密度 | 少量大模块、主视觉数据、流程图、主题图形 | 放大核心信息，调整垂直重心，使用主题相关视觉而非拉伸容器 |

页面内容不足时必须按以下顺序处理：

1. 放大核心信息，而不是放大容器；
2. 将关键数据升级为主视觉；
3. 将并列模块改为流程、路径或关系结构；
4. 增加与主题相关的信息图形；
5. 调整页面垂直重心；
6. 最后才调整模块尺寸。

禁止：通过增大卡片 `height`、`min-height`、`padding`，添加无意义长文、重复信息或纯装饰图形来填满画布。

规划页面时还必须满足：标题区约占画布高度 10%～18%，主体内容区约占 45%～65%，辅助视觉区约占 15%～30%；连续无功能留白不得超过 25%，有效信息与有效视觉元素覆盖面积应达到 55%～75%。留白必须分散在标题、模块和视觉元素之间，不得集中形成空洞区域。

禁止将高、中、低密度页面统一套用三等分卡片布局。

每个内容页必须读取 `page_composition_library.md`，在 `page_plan` 中声明 `compositionVariant`、一个 `primaryClaim`、`componentPlan`、`informationLinks` 和 `capacityCheck`。布局库覆盖结论证据、分栏、表格、清单、指标、图表、前后对比、组合矩阵、流程、并行链路、时间轴、生态桥接、分层架构、径向能力与图文证据；不得把这些关系退化为同样大小的卡片墙。

来源明确包含闭环反馈、能力阶段、同口径前后效果、连续转化、条件分支、双轴优先级、总分解 KPI 或可复算增减时，必须再读取 `advanced_relation_components.md` 并声明 `advancedRelationSpec`。其字段至少包括 `relationType`、`sourceRefs`、`requiredFacts`、`geometryAnchors`、`rejectedAlternatives` 与 `auditChecks`。缺少闭环、基线、数值、条件或坐标中的任一必需事实时，禁止使用相应高级图形，改用真实关系可支持的普通变体。

当来源材料含图片、截图、产品图、人物图或场景图时，必须再读取 `image_text_composition.md`：按主图 + 证据文本、主图 + 双证据卡、文本主体 + 竖向图片带、双图对照或图片流程选择变体。承载论据的来源图片必须进入 `contentMapping`；重复模板背景和纯装饰图可记录为 optional，但不得被误作为正式图片证据。

同组卡片必须先按横向、纵向或矩阵分组，再由共同父容器控制。横向语义组必须顶边、底边对齐且外框等高；纵向语义组必须左、右边缘对齐且外框等宽；矩阵组各行等高、各列等宽且间距一致。主次、大卡带小卡、瀑布流、时间轴或刻意非对称构图才可例外，并须在页面计划中说明设计意图。

当页面存在列表、卡片、箭头、数据指标、图表等异构模块时，页面计划必须先声明外边界、行轨道与中心线锚点：对应列表逐行对齐；因果关系以连接对象中心为准绘制箭头或连接线；总结模块至少与主体模块共享一个外边界。不同模块允许不同宽高，但必须另共享一个内容锚点；禁止以单独偏移补偿。

低密度页面若在一排自适应卡片下方出现接近画布高度 25% 的连续留白，必须改为流程、路径、关系结构、主视觉数据或主题信息图形；禁止保留“顶部一排卡片 + 下方大面积空白”的布局。案例页优先构造“挑战 → 策略 → 结果”的关系叙事。

## 4. 内容映射

布局选择后必须输出 `contentMapping`：

```json
[
  {"region": "title", "contentRefs": ["source-001"]},
  {"region": "column-1", "contentRefs": ["source-002", "source-003"]},
  {"region": "result-rail", "contentRefs": ["source-010"]}
]
```

所有 `must-render` 的 `source-id` 必须进入且只能进入一个主要内容区域；需要重复用于图例或注释时，应标记 `intentionalDuplicate = true`。

## 5. 模板库选择

布局组件确定后，必须读取 `template_library.md`。页面模板不是页面类型的替代品：

```text
pageType -> layoutComponent -> templateId -> allowedComponents
```

优先选择模板的 `primaryPattern`；只有语义完全兼容时才可选择
`secondaryPatterns`。每页必须映射全部 `requiredSlots`，并检查
`contentCapacity`。模板不匹配时，按 `fallbackTemplates` 选择内容型替代方案或拆页。

交付时固定使用 `ultrawideVariant`：增加模块间距、流程轨道长度、证据/总结侧栏
或图表域，不得拉伸任何卡片、图片、截图或图形。禁止用“参考页 N”创建一次性模板。
