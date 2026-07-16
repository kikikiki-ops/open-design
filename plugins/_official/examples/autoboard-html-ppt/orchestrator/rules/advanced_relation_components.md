# 高级关系图、升级图与效果对比组件库

本库补充基础卡片、流程和矩阵之外的高信息密度组件。它借鉴公开 PPT
Skill 中的 Pipeline、Loop Diagram、KPI Tower 与 Duo Compare 等结构方向，
但只抽象内容关系和可复用组件，不复制任何单页视觉或装饰。

## 1. 总门禁

- 高级图形只能表达来源中已存在的顺序、闭环、基线、条件、双轴或数值关系；
  不得为了填充页面生成环线、箭头、坐标、分支、比例或结论。
- 页面计划选择本库变体时，必须额外声明 `advancedRelationSpec`，包括
  `relationType`、`sourceRefs`、`requiredFacts`、`geometryAnchors`、
  `rejectedAlternatives` 和 `auditChecks`。
- 关系节点、比较行、阶段轨道和数据标签由共同父级 Grid / SVG 轨道计算。
  禁止用单个元素的 `top`、`left`、`margin` 或 `translate` 补偿。
- 组件可扩展轨道、侧栏和图表域以适配 3696 x 1008；不得横向拉伸圆环、
  漏斗、图片、卡片或来源截图。

```json
{
  "compositionVariant": "CapabilityUpgradeLadder",
  "advancedRelationSpec": {
    "relationType": "progressesTo",
    "sourceRefs": ["source-021", "source-022", "source-023"],
    "requiredFacts": ["三阶段能力名称", "阶段顺序", "每阶段可验证能力"],
    "geometryAnchors": ["shared-stage-baseline", "upgrade-vector-centerline"],
    "rejectedAlternatives": ["EqualEvidenceColumns"],
    "auditChecks": ["stage-order", "shared-baseline", "no-invented-score"]
  }
}
```

## 2. 高级组合模式目录

| 变体 | 真实使用条件 | 可复用组件 | 容量 | 禁止使用 |
|---|---|---|---|---|
| `GrowthFlywheelLoop` | 3～6 个动作存在明确的“结果反哺起点”闭环 | `LoopCore`、`LoopNode`、`ArcConnector`、`LoopOutcome` | 3～6 节点 + 1 个闭环结果 | 线性步骤、没有反馈关系的分类 |
| `CapabilityUpgradeLadder` | 能力有当前/目标或 3～5 个成熟阶段 | `CapabilityLevel`、`UpgradeVector`、`ReadinessMetric`、`FoundationBar` | 3～5 阶段，每阶段最多 3 条能力 | 互不相关的功能清单、没有顺序的维度 |
| `BeforeAfterEffectCompare` | 同一对象具备明确的前后基线、动作或变化值 | `BaselinePanel`、`DeltaBridge`、`TargetPanel`、`EffectMetric` | 1 组前后状态 + 最多 4 行同口径指标 | 不同时间、不同对象或不同口径的拼接 |
| `FunnelConversion` | 3～6 个连续阶段有数量、比例或明确转化关系 | `FunnelStage`、`ConversionLabel`、`DropoffCallout`、`FunnelOutcome` | 3～6 阶段 | 没有顺序或没有转化事实的流程 |
| `DecisionTreeRoute` | 存在可验证条件、分支规则和至少两个不同结果 | `DecisionNode`、`DecisionBranch`、`OutcomeLeaf`、`RuleNote` | 2～3 层、最多 8 个叶节点 | 只有单一路径、用主观猜测补全条件 |
| `RiskPriorityHeatmap` | 两个来源维度可构成风险/优先级坐标 | `HeatmapGrid`、`AxisLabel`、`RiskCell`、`PriorityMarker` | 2 x 2 至 5 x 5，最多 12 标记 | 虚构概率、影响值或对象坐标 |
| `KpiTower` | 一个总指标由 2～4 个同口径支撑指标证明 | `KpiTowerHero`、`SupportingMetric`、`EvidenceBar`、`ConclusionTag` | 1 主指标 + 2～4 支撑指标 | 指标之间没有证明或分解关系 |
| `WaterfallBridge` | 起点、增减因子与终点的算术关系可以复算 | `WaterfallStart`、`WaterfallStep`、`WaterfallEnd`、`DeltaLabel` | 1 起点 + 2～6 因子 + 1 终点 | 无法验证相加关系的叙事步骤 |

## 3. 专项实现协议

### 3.1 `GrowthFlywheelLoop`

- 每个 `LoopNode` 必须有来源映射，并通过 `data-relation-id` 与下一节点和
  `ArcConnector` 相连；最后节点必须有来源证明其反馈至首节点。
- 环形只表达闭环，不表达普通顺序。没有反馈事实时改用 `LinearFlowTrack` 或
  `TimelineRoadmap`。
- 节点沿共同圆/椭圆轨道等角或等弧分布，文本始终保持水平可读；中心仅放置
  来源中的共同目标或结果，不能放无依据口号。

### 3.2 `CapabilityUpgradeLadder`

- 阶段必须按来源顺序排列，同一阶段宽度、标题基线、能力条目起始线和升级箭头
  中心线统一；不可将文本多少误当成阶段高度依据。
- 阶段价值通过能力、门槛、指标或交付物表达，不得自行补充 1～5 分成熟度评分。
- 若只有“当前 vs 目标”两个状态，优先使用 `BeforeAfterEffectCompare`；若没有
  路径顺序，改为 `CapabilityPillarMatrix`。

### 3.3 `BeforeAfterEffectCompare`

- `BaselinePanel` 与 `TargetPanel` 必须共享指标行轨道、指标名称、单位、时间口径
  和顶部/底部边界；`DeltaBridge` 对准每一对应行中心。
- 效果只能显示来源明确给出的变化值；未知变化必须标注为待测量，不得以颜色、
  箭头或百分比暗示增长。
- 如果来源是多阶段演进，改为 `CapabilityUpgradeLadder` 或 `TimelineRoadmap`。

### 3.4 `FunnelConversion`

- 阶段顺序来自旅程、漏斗或转化定义；有数量时必须保留原始数字和单位。
- 只有存在可比数值时，宽度才可以按比例表现；否则所有阶段使用等宽轨道，并以
  `ConversionLabel` 表示已知关系，禁止制造伪比例。
- `DropoffCallout` 只能引用已知的流失原因或行动，不得由模型猜测。

### 3.5 `DecisionTreeRoute` 与 `RiskPriorityHeatmap`

- 决策树的每条 `DecisionBranch` 都必须含来源条件，所有叶节点都必须是来源中
  明示的行动或结果；缺少分支时退回 `LinearFlowTrack`。
- 热力图两个轴的含义、方向、刻度和对象位置必须来自来源。没有双轴事实时使用
  `DecisionTable` 或 `PortfolioQuadrant` 的非坐标分类版本。
- 任何风险色阶都必须附 `PriorityLegend`；颜色不能成为唯一的信息载体。

### 3.6 `KpiTower` 与 `WaterfallBridge`

- `KpiTowerHero` 的总指标必须与支撑指标存在来源可解释的贡献、分解或证明关系；
  不能把四个不相关 KPI 竖排成塔。
- 瀑布图每一步需提供方向、数值和单位，且 `start + signed steps = end` 的误差
  不得超过原始数据允许的四舍五入误差；无法复算时改为 `MetricStoryTriple`。

## 4. 几何与质量审计

- 阶梯、漏斗、瀑布与决策树节点必须在共同内容带内；所有文本、标签和连接线
  在 3696 x 1008 画布及安全区内可读。
- 前后比较每一同口径行的 `top`、`bottom` 和 `centerY` 误差不超过 2px；漏斗、
  阶梯和瀑布相邻节点的连接端点对准误差不超过 2px。
- 闭环最后一条连接必须连接至首节点而非页面中心；所有箭头只指向其关系对象。
- `quality_report.json` 对高级图形至少记录：`relationType`、`sourceRefs`、
  `geometryAudit`、`semanticAudit` 和 `fallbackUsed`。任一来源事实、算术验证或
  几何检查失败时，页面必须回退到 `rejectedAlternatives` 之外的普通关系布局，
  不得静默保留图形。

## 5. 选择顺序

1. 先找真实关系：闭环、阶段、前后基线、漏斗、条件分支、双轴、总分解或可复算增减；
2. 关系成立时选择对应高级变体；
3. 关系不完整时选择较弱但诚实的 `LinearFlowTrack`、`DecisionTable`、
   `MetricStoryTriple`、`BeforeAfterDelta` 或 `TaxonomyMatrix`；
4. 容量超限时拆页，不能压缩字号、缩小安全区或删改正式内容。

## 6. 参考方向

- Guizang PPT Skill 的公开布局方向包含 Pipeline、Loop Diagram、KPI Tower、
  Duo Compare 等：<https://github.com/op7418/guizang-ppt-skill>


## 7. 连接枢纽变体选择协议

本节配合 `components.md §3.9 ConnectionHub` 使用，规定 10 种枢纽结构变体的选择条件、布局逻辑和禁止误用场景。高级数据关系（GrowthFlywheelLoop 等）仍由 §2–§6 管理；本节聚焦**通用关系语言**的结构选择。

### 7.1 变体目录

| 变体 ID | 中文名 | 适用语义 | 最小节点数 | 超宽画布布局 |
|---------|--------|----------|-----------|-------------|
| `CenterHub` | 中心枢纽型 | 多方协同、平台生态、资源整合 | 1核心 + 2外部 | 中心居中，两侧/四周对称分布 |
| `RelayTransform` | 中继转换型 | 数据处理、策略转化、流量承接 | 输入→核心→输出 | 三段横向，居中对齐 |
| `DualNodeCombo` | 双节点协同型 | 两项能力组合、前后链路、产品+服务 | 2节点 + 运算符 | 并排，运算符居中 |
| `MultiNodeFlow` | 多节点流程型 | 业务流程、用户旅程、增长路径 | 3–6节点 | 横向流程轨道，统一基线 |
| `ConvergeHub` | 汇聚型 | 多能力→成果、多渠道→用户 | 2–6外部→1核心 | 扇形汇入或多列→中心 |
| `DivergeHub` | 分发型 | 平台赋能、能力输出、渠道分发 | 1核心→2–6外部 | 中心→扇形分出 |
| `ClosedLoop` | 环形闭环型 | 用户运营闭环、数据反馈闭环 | 3–6节点 | 圆环排列，使用 §3.1 GrowthFlywheelLoop 升级 |
| `ConcentricLayer` | 分层同心圆型 | 能力体系、产品架构、用户圈层 | 内层1 + 外层2+ | SVG 同心圆，文字水平可读 |
| `SpineWithBranch` | 主干分支型 | 战略主线、产品路线图、多业务分支 | 主干3+ 分支各1+ | 水平主干 + 垂直分支 |
| `ContrastBridge` | 对比连接型 | 过去/未来、现状/目标、挑战/方案 | 2组 + 中间桥接 | 左右分区，中间运算符/结论节点 |

### 7.2 变体选择规则

```text
1. 先识别语义：连接 / 协同 / 汇聚 / 分发 / 转化 / 递进 / 支撑 / 驱动 / 承接
             / 对比 / 组合 / 闭环 / 生态 / 阶段 / 因果
2. 根据语义从 7.1 变体目录选择
3. 若有明确闭环 + 3–6 节点 → 优先使用 GrowthFlywheelLoop（§3.1）
4. 若有明确前后基线 → 优先使用 BeforeAfterEffectCompare（§3.3）
5. 若有漏斗转化数据 → 优先使用 FunnelConversion（§3.4）
6. 其余通用关系 → 使用本节 7.1 对应变体
7. 容量超限时拆页，禁止压缩节点或缩小安全区
```

### 7.3 各变体实现要点

#### CenterHub 中心枢纽型

```
布局：CSS Grid（1–4列） / Flex 横向，核心节点居中列
对齐：所有外部模块与核心节点 centerY 对齐（align-items: center）
连接：从核心节点圆周锚点出发，到外部模块左/右边界中心
超宽适配：设置 --hub-max-width；核心节点 max-width；外部模块不超出安全区
禁止：连接线从圆心出发；外部模块被推到画布边缘
```

#### RelayTransform 中继转换型

```
布局：三列 grid-template-columns: 1fr auto 1fr，核心节点在中列
对齐：三元素行基线统一 align-items: center
连接：左侧模块右边界 → 核心节点左圆周；核心节点右圆周 → 右侧模块左边界
标注：左侧标注"输入/现状/来源"，右侧标注"输出/结果/目标"（弱色）
禁止：连接线跨越文字区域；中继节点使用矩形
```

#### DualNodeCombo 双节点协同型

```
布局：三列（节点A | 运算符 | 节点B）
对齐：三元素 centerY 统一
运算符：使用 span.hub-operator（×、+、=），不使用连接线替代
字号：运算符字号 ≥ 36px，颜色弱化（--text-muted）
禁止：两个节点共享同一个圆形（分不清主次）；运算符偏离中心
```

#### MultiNodeFlow 多节点流程型

```
布局：flex-row，align-items: center，等间距 gap
节点：等高等宽；每节点间用单向箭头连接（stroke-width: 2px）
节奏节点：可在箭头中点加 1 个实心小圆，直径 6px
时间轴：可在底部加统一基线（弱色 border-top 或 SVG line）
禁止：节点尺寸不一；箭头偏离节点边界中心
```

#### ConvergeHub 汇聚型 / DivergeHub 分发型

```
布局：SVG 绘制汇聚/分发连接线 + absolute 定位外部节点
外部节点：等角或等距分布在核心节点周围；等高、等圆角
连接：从外部节点边界出发，汇聚至核心节点圆周（或反向）
禁止：连接线从圆心出发；外部节点大小不一
```

#### ConcentricLayer 分层同心圆型

```
实现：纯 SVG circle + text；或 CSS 同心圆嵌套 div（border-radius: 50%）
文字：外层文字保持水平可读（不得跟随圆弧旋转）
层数：2–4层；每层增加的内容必须有语义层级依据
禁止：超过 4 层同心圆；内层文字旋转 / 镜像 / 竖排
```

#### SpineWithBranch 主干分支型

```
主干：水平 flex-row，统一基线（align-items: center）
分支：从主干节点向上/下垂直延伸（SVG vertical line）
分支长度：各分支等长；分支节点等高
禁止：分支长度不一；分支节点尺寸不一；斜线分支（除非横向空间不足）
```

#### ContrastBridge 对比连接型

```
布局：grid-template-columns: 1fr auto 1fr；左右等宽
桥接元素：中间列放运算符 / 结论节点 / 过渡标注
指标行：左右各对应行 top/centerY 误差 ≤ 2px（引用 §3.3 BeforeAfterEffectCompare 要求）
禁止：左右内容行数不对应；桥接元素偏离中心
```

### 7.4 超宽画布（3696 × 1008）枢纽布局策略

```css
/* 推荐：枢纽组统一容器 */
.connection-hub-wrapper {
  width: min(100%, var(--hub-group-max-width, 3000px));
  margin-inline: auto;
  display: grid;
  align-items: center;
}

/* 剩余空间消化方式（按优先级）：
   1. 两侧增加辅助信息带（annotation band）
   2. 左右分区（主关系 | 辅助说明）
   3. 多组并列（CenterHub × 2）
   4. 节点间距扩大但受 --hub-max-width 限制
   禁止：超长连接线；模块被推到边缘 */
```

### 7.5 与高级关系库的交叉引用

| 内容特征 | 优先使用 |
|----------|---------|
| 存在明确闭环反馈 | `GrowthFlywheelLoop`（§3.1） |
| 存在前后基线指标 | `BeforeAfterEffectCompare`（§3.3） |
| 存在漏斗转化数据 | `FunnelConversion`（§3.4） |
| 存在可复算增减关系 | `WaterfallBridge`（§3.6） |
| 其余通用关系语义 | `ConnectionHub` 对应变体（本节 §7.1） |
| 通用连接 + 闭环同时存在 | ConnectionHub 外框 + GrowthFlywheelLoop 内部 |

### 7.6 几何与审计要求

`quality_report.json` 对连接枢纽至少记录：

```json
{
  "hubVariant": "CenterHub",
  "coreNodeIsCircle": true,
  "anchorAlignError": 0,
  "connectorPassesThroughText": false,
  "moduleHeightConsistent": true,
  "maxWidth": 3000,
  "overflowPx": 0
}
```

失败条件（任一触发即失败）：

- 核心节点长宽比 ≠ 1:1（椭圆）
- 连接线端点偏离锚点边界 > 2px
- 连接线穿过文字区域
- 同组外部模块高度差 > 2px
- 单页节点数超过 8 个且未拆页
- 超宽画布节点间距超过 `--hub-max-width`
