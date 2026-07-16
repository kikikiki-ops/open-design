# 页面组合、信息链路与多媒体模板组件库

本库将公开 HTML / PPT 演示技能中的语义布局选择、单页布局目录、源资产保留和渲染 QA 方法，与 AutoBoard 的 3696 × 1008 超宽约束结合。它提供的是可复用 `compositionVariant`，不是按某一页参考稿复制的模板。

参考方向：公开 HTML PPT Skill 的单页布局目录覆盖内容列、指标、表格、比较、流程、时间轴、路线图、图像、图表和架构图；源优先的 PPT Skill 也要求先声明视觉类型再选布局并在交付前 QA。详见文末参考资料。

## 1. 规划前的视觉声明

每一张内容页在选择 `templateId` 后，必须声明：

```json
{
  "compositionVariant": "ChartInsightSplit",
  "primaryClaim": "页面只回答的一个核心问题",
  "informationLinks": [
    { "from": "source-011-problem", "to": "source-011-solution", "relation": "causes" }
  ],
  "componentPlan": ["ChartPanel", "InsightRail", "Connector"],
  "rejectedVariants": ["EqualCards"],
  "capacityCheck": "pass"
}
```

`compositionVariant` 必须由内容关系决定。没有“所有内容默认三等分卡片”的兜底；`cards-N` 只能在 N 个对象确实同级、同结构、同容量时使用。

## 2. 组合模式目录

### 2.1 叙事与结论

| 变体 | 使用条件 | 组件 | 容量 | 禁止使用 |
|---|---|---|---|---|
| `ClaimEvidenceRail` | 一个核心结论，2～4 个证据 | `ClaimHero`、`EvidenceRail`、`EvidenceNote` | 1 条结论 + 2～4 条证据 | 多个无关结论、完整表格 |
| `QuoteEvidence` | 来源中有正式引语或一句立场 | `QuoteBlock`、`Attribution`、`SupportingMetric` | 1 条引语 + 1～2 条支撑 | 以 AI 生成口号替代内容页 |
| `ContextActionOutcome` | 背景、动作、结果存在因果 | `ContextPanel`、`ActionMechanism`、`OutcomeMetric`、`Connector` | 3 个一级模块 | 多阶段路线图、无结果的纯说明 |
| `ProblemSolutionImpact` | 问题、解决路径、业务影响明确 | `ProblemCard`、`SolutionMechanism`、`ImpactMetricRail` | 1 个问题 + 最多 3 个解法 + 最多 4 个指标 | 仅有并列功能清单 |

### 2.2 多文与分栏信息

| 变体 | 使用条件 | 组件 | 容量 | 禁止使用 |
|---|---|---|---|---|
| `EqualEvidenceColumns` | 2～5 个同级对象，字段结构一致 | `ColumnHeader`、`EvidenceCard`、`SharedBaseline` | 每列 1 标题 + 1～3 条短项 | 文本长度或语义层级差异很大 |
| `PrimarySecondaryColumns` | 一个主论点配 1～3 个补充论据 | `PrimaryPanel`、`SecondaryEvidenceStack` | 主区 40%～55%，副区 45%～60% | 彼此同级却强行主次 |
| `TaxonomyMatrix` | 分类 × 指标/能力存在交叉关系 | `TaxonomyHeader`、`MatrixCell`、`Legend` | 3～5 类，最多 16 单元格 | 长段落、非交叉的卡片列表 |
| `DecisionTable` | 需要逐行扫描的对象、条件、建议 | `TableHeader`、`TableRow`、`PriorityMarker` | 3～7 行，3～5 列 | 单一结论、远距离不可读的密集数据 |
| `AccordionEvidenceList` | 多条说明共享同一主题但不需要等权卡片 | `ListRail`、`ListItem`、`InlineMetric` | 3～6 条 | 每项必须逐列比较的内容 |

### 2.3 数据、图表与量化叙事

| 变体 | 使用条件 | 组件 | 容量 | 禁止使用 |
|---|---|---|---|---|
| `MetricStoryTriple` | 三个同口径指标共同证明一个结论 | `MetricHero`、`MetricBlock`、`ConclusionTag` | 恰好 3 个指标 | 互不相关的 KPI 集合 |
| `ChartInsightSplit` | 一张主图表配 1～3 条解释 | `ChartPanel`、`InsightRail`、`ChartAnnotation` | 1 张主图 + 1～3 条洞察 | 没有来源数据的装饰图表 |
| `MetricTaxonomyMatrix` | 指标按业务维度分组 | `TaxonomyHeader`、`MetricBlock`、`SummaryBar` | 3～5 类、2～4 项/类 | 长叙事正文 |
| `BeforeAfterDelta` | 前后状态、基线和变化值明确 | `BeforePanel`、`DeltaArrow`、`AfterPanel` | 1 组对比 + 最多 3 个变化指标 | 多阶段演进、没有同口径基线 |
| `PortfolioQuadrant` | 两个来源维度构成机会/优先级矩阵 | `PortfolioGrid`、`AxisLabel`、`PriorityLegend` | 最多 12 个对象 | 虚构坐标或没有两个维度 |

### 2.4 信息链路、流程与关系

| 变体 | 使用条件 | 组件 | 容量 | 禁止使用 |
|---|---|---|---|---|
| `LinearFlowTrack` | 2～6 个有顺序的步骤 | `FlowNode`、`FlowTrack`、`Connector` | 2～6 个节点 | 无顺序的分类列表 |
| `ParallelTrackFlow` | 两条或三条并行链路存在逐项对应 | `TrackHeader`、`TrackNode`、`RowConnector` | 每条 2～5 节点 | 节点不能逐项对应 |
| `TimelineRoadmap` | 有日期、阶段或里程碑 | `TimelineAxis`、`Milestone`、`StageRail` | 3～7 个阶段 | 没有时间逻辑的策略罗列 |
| `HubBridgeExchange` | 两个系统通过平台、机制或价值交换相连 | `SystemCluster`、`BridgeCore`、`ExchangeLabel` | 两侧各最多 4 个实体 | 多个独立生态、线性流程 |
| `LayeredArchitecture` | 输入、能力层、输出存在层级 | `InputNode`、`CapabilityLayer`、`OutputNode` | 2～4 层、最多 5 个输出 | 仅有并列功能点 |
| `RadialCapabilityMap` | 一个中心能力连接多个独立方向 | `CoreRing`、`CapabilityPetal`、`RadialConnector` | 3～6 个方向 | 存在严格先后顺序 |

### 2.5 图文与多图证据

图文搭配具体几何规则以 `image_text_composition.md` 为准；本库定义其在页面组合中的位置：

| 变体 | 使用条件 | 组件 | 容量 | 禁止使用 |
|---|---|---|---|---|
| `MediaTextSplit` | 1 张主图 + 2～4 条分析 | `SourceMediaFrame`、`MediaTextSplit`、`EvidenceCard` | 1 图 + 2～4 条 | 没有来源图片、图片不相关 |
| `PairedMediaInsight` | 主图对应两条互补洞察 | `SourceMediaFrame`、`PairedEvidenceStack` | 1 图 + 2 卡 | 三条以上不等量卡片 |
| `EvidenceMediaRail` | 文本主体配 1～4 张竖向证据图 | `SourceMediaRail`、`MediaCaption`、`EvidenceRail` | 1～4 图 | 图片只是无关装饰 |
| `DualMediaCompare` | 两张媒体构成明确对比 | `DualMediaCompare`、`ComparisonAxis`、`ConclusionTag` | 2 图 + 1 结论 | 没有共同对比维度 |
| `MediaFlowTrack` | 截图/图片存在顺序或旅程 | `MediaFlowTrack`、`StageCaption`、`Connector` | 2～5 图 | 图片集合没有阅读顺序 |
| `MediaGalleryMetric` | 多张媒体本身是主要证据，指标为辅助 | `MediaStrip`、`MediaFrame`、`MetricRail` | 3～8 图 + 2～4 指标 | 媒体不是主要信息 |

## 3. 信息链路协议

信息链路不是装饰箭头。每条连接必须映射来源中的一种关系：

- `causes`：原因 → 结果；
- `enables`：能力/动作 → 产出；
- `compares`：同口径对象对照；
- `progressesTo`：阶段/流程顺序；
- `proves`：证据/图片/图表 → 结论；
- `belongsTo`：对象 → 分类/系统；
- `summarizes`：多个证据 → 总结模块。

实现规则：

- 源、目标和连接线必须共享 `data-relation-id`；
- 连接线的端点对准关联对象中心或对应行中心，不对准整页中心；
- 有逐项关系的双列表必须共享行数、行高和行间距；
- 没有来源关系时，不得为了“科技感”添加箭头、环线、流程或网络图；
- 一个模块最多建立 3 条直接连接，超过时改用分组、矩阵或拆页。

## 4. 多组件协作与父级控制

页面先建立标题区、共同内容带 `H` 和辅助视觉区，再放置模块。无论是文字卡、图表、图片带、流程、表格或总结条，只要位于同一横向内容带，就必须：

```text
top(module_i) = top(module_j)
bottom(module_i) = bottom(module_j)
height(module_i) = height(module_j) = H
```

- `H` 通常为画布高度的 35%～55%，由共同父级 Grid/Flex 明确控制；
- 主模块可不同宽，但必须共享至少一个外边界锚点和一个内容锚点；
- 复合列表、媒体带、流程轨道和表格行必须分别由内部 Grid 统一计算；
- 禁止用单个 `top`、`left`、`margin`、`translate`、绝对定位或空白 padding 修正局部对齐；
- 内容不足时优先升级为关系、数据、图文证据或主题视觉，不增加无意义卡片。

## 5. 选择与失败恢复

按以下顺序进行：

1. 判断页面的一个核心问题与正式关系；
2. 选择页面类型与 `templateId`；
3. 从本库选择 `compositionVariant` 与组件计划；
4. 检查组件容量、来源绑定、信息链路和超宽变体；
5. 失败时重组 → 换变体 → 换内容型模板 → 拆页；
6. 禁止用更多卡片、缩小字、压缩安全区或删除正式内容掩盖不匹配。

## 6. 审计清单

交付前除了布局审计，还必须检查：

- 每页是否有一个明确 `primaryClaim`；
- `compositionVariant` 是否符合内容关系和容量；
- 每个 `must-render` 来源文本、指标、媒体、表格和图表是否都有唯一 `contentMapping`；
- 每条 `informationLinks` 是否有合法来源关系、真实端点与 `data-relation-id`；
- 表格、双列表、矩阵和时间轴是否共享行/列轨道；
- 图表、媒体、连接线、标签和结论是否没有因局部定位造成伪对齐；
- 是否将非同级、多层级或高密度内容错误地渲染为等宽等高卡片；
- 是否在 100% 画布和缩放预览下保持可读、无溢出、无裁切。

## 7. 参考资料

- `html-ppt-skill`：公开 HTML 演示 Skill 的单页布局目录，覆盖列、比较、流程、时间轴、图像、图表、架构和 CTA：<https://github.com/lewislulu/html-ppt-skill>
- `pptx-from-layouts-skill`：按语义视觉类型选择布局并执行验证的公开 PPTX Skill：<https://github.com/tristan-mcinnis/pptx-from-layouts-skill>
- `frontend-slides`：转换 PPT 时提取并保留原始图片与内容，再应用可选布局系统：<https://github.com/zarazhangrui/frontend-slides>
