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

规划页面时，以下比例为**参考区间**（软建议），不作为硬性审计指标，不得因满足数字而机械填充内容：

- 标题区：约 10%～18% 画布高度（**参考值**，根据标题数量灵活调整）
- 主体内容区：约 45%～65% 画布高度（**参考值**，内容密度低时可适当降低）
- 辅助视觉区：约 15%～30% 画布高度（**参考值**，关系图/流程图页可超出）
- 连续无功能留白：建议不超过 25%（**参考值**，封面/章节页允许更多留白）
- 有效信息与视觉覆盖面积：建议 55%～75%（**参考值，不是溢出字号的指令**）

> ⚠️ 以上数值仅用于评估视觉平衡，**不得用于驱动 AI 添加无关内容、放大字号、拉伸卡片来达到覆盖率**。若内容本身确实密度低，应遵循"低密度页面填充策略"（第3节），而非凑数字。

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
或图表域，不得拉伸任何卡片、图片、截图或图形。禁止用"参考页 N"创建一次性模板。

## 6. 跨页布局多样性协议（建议级指引）

> ⚠️ **本节从「硬约束」降级为「建议级指引」（P1）。**
> 原因：内容密度差异大时，机械轮换会导致错误匹配（数据页强行换成流程布局）。
> 规则：**优先保证内容与布局语义匹配；在内容支持的前提下，主动追求多样性。**

### 6.1 为什么需要此协议

同一份 PPT 连续多页若使用相同的卡片结构（如"三等分横排卡"），视觉上会让观众快速产生"都一样"的疲劳感，信息层级失效。本协议通过 **布局家族多样性建议 + 卡片样式调度建议** 两个维度提升多样性。

### 6.2 布局家族多样性建议（P1 建议）

**定义：** 每种 `layoutComponent`（如 `ColumnGridLayout`、`DualWingLayout`、`HubBridgeLayout` 等）属于一个布局家族。

**建议：**
- 连续 3 页内容页（`data-page-role="content"`）中，优先避免同一布局家族出现超过 **2 次**。
- 连续 2 页使用相同的 `data-page-variant` 时，建议第 3 页切换为不同 variant。
- **例外：** 内容语义强烈要求相同布局时（如连续数据对比页），可保持相同家族，须在 `page_plan` 中注明理由。
- 封面（cover）、目录（contents）、章节分隔（section）、封底（closing）不计入连续计数。

**布局家族分组（用于判断是否"同家族"）：**

| 家族代号 | 包含的 layoutComponent |
|---------|----------------------|
| A-Column | `ColumnGridLayout`、`ThreeColumnLayout`、`FourColumnMatrixLayout`、`ThreeZoneColumnLayout`、`ThreeColumnContentsLayout` |
| B-DualWing | `DualWingLayout`、`DualChainLayout` |
| C-Hub | `HubBridgeLayout`、`radial-capability-map` 对应组件 |
| D-Case | `CaseStudyLayout`、`CaseReviewLayout` |
| E-Process | `ProcessLayout`、`RoadmapLayout`、`StageFlowLayout` |
| F-Data | `ChartAnalysisLayout`、`ShowcaseGalleryLayout`、`ThreeMetricCardLayout` |
| G-Scene | `ThreeCardLayout`、`SceneProgressionLayout`、`OpportunityLayout` |

**规划时动作：** 在生成 `page_plan` 之前，先列出已规划页面的布局家族序列，检查是否出现连续重复。如果连续同家族 > 2 页，且内容等等泡许切换，则考虑换用不同家族。如果内容确实适合同一布局，不强制切换。

### 6.3 卡片样式调度建议（P1 建议）

同一份 PPT 的内容页中，**建议避免在所有卡片组件中只使用 `.card`（金色描边白底）一种样式**。

可参考以下**卡片样式调度表**，建议同一样式在连续 3 个内容页中不超过 2 次：

| 样式代号 | HTML class | 视觉特征 | 适用内容语义 |
|---------|------------|---------|-------------|
| S1 | `.card` | 白底 + 金色描边 + 阴影 | 通用：对比、说明、成果 |
| S2 | `.card-sm` | 白底 + 浅金色描边 + 小圆角(16px) | 子卡片、指标组、步骤节点 |
| S3 | `.card-teal` | 青绿软底 + 青绿描边 | 能力/机会/增长方向 |
| S4 | `.card-gold` | 金色渐变底 + 金色描边 | 核心结论、重点强调、关键数字 |
| S5 | `.card-header` | 金色渐变横条 | 封面标签、章节标签（非正文卡片） |
| S6 | 无描边透明底（`background:transparent`）+ 左侧金色竖线装饰 | 无边框、开放感 | 列表式要点、文字主导内容 |
| S7 | 深色底（`var(--dark-surface)`）+ 浅色文字 | 深色强调卡 | 核心对比的"当前 vs 目标"暗侧 |

**调度记录表（规划时必须填写）：**

规划输出 `page_plan` 时，须在每个内容页声明 `cardStyleDistribution`：

```json
{
  "page": "slide-05",
  "pageType": "CapabilityMatrixPage",
  "layoutComponent": "FourColumnMatrixLayout",
  "cardStyleDistribution": ["S3", "S3", "S3", "S3"],
  "prevPageCardStyle": "S1",
  "styleChangeReason": "前页全用S1，本页切换为S3青绿卡凸显能力属性"
}
```

如果连续 2 页的 `cardStyleDistribution` 主样式相同，建议在第 3 页考虑切换主样式，并在 `styleChangeReason` 中说明。如果内容确实适合相同样式，可不切换。

### 6.4 结构形态多样性建议（P1 建议）

**结构形态** 指同一布局家族内的视觉结构，例如 A-Column 家族下包含多种形态：

| 形态代号 | 描述 | 示例 variant |
|---------|------|-------------|
| A1 | 等宽横排卡（N 列等宽） | `MetricGrid`、`CapabilityColumns`、`ThemeStrategyColumns` |
| A2 | 左宽右窄（主体+侧栏） | `PainPointStrategyResult`、`TwoRegion` |
| A3 | 上下分区（标题大区+底部小卡行） | `YoYGrowthCards` |
| A4 | 卡片 + 内嵌流程/关系图 | `DualBidSceneCards` |
| A5 | 矩阵（行×列）| `AICapabilityCards`、`metrics-taxonomy-matrix` |

同一布局家族的连续两页，建议使用不同的形态代号，但内容语义优先。

### 6.5 验证检查清单（建议项，非强制阻断）

在生成所有页面 HTML 之前，可对完整页面序列做以下自查：

```
[ ] 连续 3 个内容页中，同一布局家族是否超过 2 次？ → 建议改第 3 页家族（如内容语义允许）
[ ] 连续 2 个内容页是否使用完全相同的 data-page-variant？ → 建议第 3 页切换 variant
[ ] 所有内容页的卡片主样式是否只有 S1（.card）？ → 建议引入 S3/S4/S6 等其他样式
[ ] 同一布局家族的连续两页是否使用了相同形态（A1/A2/A3...）？ → 建议切换形态
[ ] 封面/目录/封底等特殊页是否意外被计入内容页轮换？ → 不计入
```

### 6.6 建议项

- 💡 **避免所有内容页只用 `.card`（金边白底）** — 容易视觉单调
- 💡 **避免连续 3 页以上使用 `ColumnGridLayout` A1 等宽横排卡** — 布局单一
- 💡 **尽量避免连续 2 页 `data-page-variant` 完全相同** — 失去 variant 的意义
- 💡 **内容相似时，可主动选择不同的视觉形态** — 相似内容可以有多样表达
- ❌ **严禁用 `padding`/`height` 撑高来制造"看起来不同"的假多样性** — 必须是结构形态的真实变化（此项保留为硬约束）
