# Page Type Router V2

## 1. 基本原则

页面类型由内容语义模式决定，不由视觉参考、标题大小或背景图决定。

路由输出必须包含：

```json
{
  "pageType": "...",
  "positiveEvidence": [],
  "negativeEvidence": [],
  "rejectedTypes": [],
  "confidence": 0.0
}
```

置信度低于 `0.65` 时，优先使用 `StructuredContentPage`，不得使用 Hero 类兜底。

## 2. 路由顺序

1. 已通过角色硬门槛的 `CoverPage / SectionDividerPage / ClosingPage`；
2. `AgendaPage`；
3. 流程和路线；
4. 案例；
5. 中心关系、公式和双核心；
6. 图片画廊和图表；
7. 并列、对比、阶段和矩阵；
8. 指标总览；
9. `StructuredContentPage`。

## 3. 内容型页面规则

### AgendaPage

证据：章节列表、编号列表、议程顺序。排除：业务指标和复杂说明占主体。

### MetricOverviewPage

证据：2～4 个核心指标，页面目标是证明结果或趋势；每个指标解释较短。

排除：指标分别隶属多个完整业务模块时，应使用多列或案例布局。

### MultiColumnComparisonPage

证据：2～5 个同级对象，每组有标题及说明/指标；可为并列展示，不必一定存在“优劣”。

### EcosystemRelationshipPage

证据：左角色—中心平台—右角色，存在流转、协同、连接或承接关系。

### StrategyPanoramaPage

证据：多个策略模块共同构成全景，重点是整体布局而非严格时间顺序。

### StageEvolutionPage

证据：过去/现在/未来、浅度/深度/超深度、冷启/优化/增长等明确递进阶段。

### DualCoreArchitecturePage

证据：两个核心能力或指标居中，两侧存在能力支撑。

### FormulaDecompositionPage

证据：明确公式、运算符或因素共同驱动结果。公式关系必须原样保留。

### CaseStudyPage

证据：背景/问题—动作/方法—结果，围绕同一案例或问题展开。

### ProcessFlowPage

证据：有明确先后顺序的 3 个及以上节点，或输入—处理—输出链路。

### CentralModelPage

证据：单一中心对象与多个外围因素、输入或结果存在关系。

### ShowcaseGalleryPage

证据：图片、界面或素材是主要证据，文本为结论和说明。

### TransformationPage

证据：明确起点—升级动作—目标状态，强调跃迁而非多阶段细节。

### CapabilityRoadmapPage

证据：多个顺序节点形成长期建设或产品演进路径。

### CapabilityMatrixPage

证据：3～5 个能力分类，每类包含多个能力项，强调分类全景。

### ChartAnalysisPage

证据：图表是页面主体，标题、图例、标注和结论围绕图表解释。

### StructuredContentPage

适用：内容角色明确为 `content`，但不满足其他类型的高置信度证据。

必须采用标题 + 结构化内容区，不得采用：

- 大号章节编号；
- 居中单标题；
- 大面积无信息留白；
- 章节封面式 Hero 构图。

## 4. 典型误判回归

输入包含：

- “深度预算引擎升级”；
- 双留存出价、付费出价、模型与调价能力；
- `300%`、`175%` 等指标。

正确路由：`pageRole = content`；根据分组可选 `MultiColumnComparisonPage`、`CaseStudyPage` 或 `MetricOverviewPage`。

必须拒绝：`SectionDividerPage`、`CoverPage`。
