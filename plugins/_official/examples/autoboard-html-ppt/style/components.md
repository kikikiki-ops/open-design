# PPT 页面组件系统
# 超宽大屏商务增长风格

---

## 1. 页面组件总览

本组件系统服务于 3696 × 1008 超宽大屏页面，所有页面都应满足：

- 中心聚焦
- 左右延展
- 低信息密度
- 远距离可读
- 白色圆角卡片承载内容
- 香槟金强调结果
- 青绿色表达策略 / 数据 / 智能

### 1.1 可复用组件分类

所有模板必须从以下分类组合，不得基于单张参考页制造一次性组件。详细的模板
`allowedComponents`、槽位和容量见 `../orchestrator/rules/template_library.md`。

| 分类 | 核心组件 | 视觉绑定 |
|---|---|---|
| `Metrics` | `MetricHero`、`MetricBlock`、`MetricRail`、`DeltaBadge`、`OutcomeMetric`、`KpiStrip`、`SummaryBar` | 香槟金突出成果，青绿用于策略性增量 |
| `Charts` | `TrendChart`、`BarChart`、`PortfolioGrid`、`RadialChart`、`Legend`、`AxisLabel`、`ChartAnnotation` | 轻网格、清晰轴线、真实数据关系 |
| `FlowAndRelationship` | `FlowNode`、`FlowTrack`、`JourneyStage`、`StageRail`、`Connector`、`RowConnector`、`RadialConnector`、`ComparisonAxis`、`BridgeCore` | 细线连接真实对象中心，不做 HUD 装饰线 |
| `NarrativeAndComposition` | `ClaimHero`、`EvidenceRail`、`QuoteBlock`、`ActionMechanism`、`DecisionTable`、`ListRail`、`TimelineAxis`、`PortfolioGrid`、`InsightRail` | 以一个主结论组织证据、表格、清单、时间、机会和数据叙事 |
| `AdvancedRelation` | `LoopCore`、`LoopNode`、`ArcConnector`、`CapabilityLevel`、`UpgradeVector`、`BaselinePanel`、`DeltaBridge`、`FunnelStage`、`DecisionNode`、`RiskCell`、`KpiTowerHero`、`WaterfallStep` | 只有来源关系完整时才能渲染的闭环、升级、效果、转化、决策、优先级、总分解和增减关系 |
| `CaseAndEvidence` | `CaseContextPanel`、`ProblemCard`、`SolutionMechanism`、`ScreenshotFrame`、`MediaFrame`、`EvidenceTrack`、`EvidenceNote`、`ImpactMetricRail` | 白色证据框，媒体保留原比例 |
| `ImageTextEvidence` | `SourceMediaFrame`、`SourceMediaRail`、`MediaTextSplit`、`PairedEvidenceStack`、`MediaCaption`、`DualMediaCompare`、`MediaFlowTrack` | 主图配证据文本、竖向图片带、双图对照和截图流程，媒体不拉伸 |
| `TaxonomyAndMatrix` | `TaxonomyHeader`、`MatrixCell`、`PillarHeader`、`CapabilityCell`、`CapabilityLayer`、`FoundationBar`、`PriorityLegend` | 统一行列轨道、轻边框、分类明确 |
| `PageChrome` | `SlideBackground`、`FixedBrandLogo`、`TopBrandBar`、`SectionEyebrow`、`PageTitle`、`PageFooter`、`BackgroundFlow`、`DividerRail` | 固定品牌与背景层，不承载正式内容 |

超宽适配时，组件本身不横向变形。可扩大图表可视域、流程轨道或模块间距，
也可新增有来源依据的证据/总结侧栏；不得拉伸卡片、媒体框、Logo 或圆形关系图。

`AdvancedRelation` 的圆环、漏斗、阶梯、瀑布和分支以共同轨道控制：扩展超宽画布时只能延长连接走廊、增加侧栏或扩大图表域，不能变形图形比例，也不能用无依据箭头或渐变制造关系感。

---

## 2. 页面级组件

### 2.1 CoverHero 封面主视觉页

适用：大会封面、主题页、主视觉页。

结构：

```text
TopBrandBar
HeroTitle
HeroSubtitle(optional)
BackgroundFlow
```

布局规则：

- 标题位于画面中心偏上。
- 不放正文卡片。
- 背景流线可以比内容页更明显。
- 左右留出充分氛围延展。

内容上限：

- 主标题：1~2 行
- 副标题：0~1 行
- 品牌标识：1~2 组

---

### 2.2 SectionDivider 章节过渡页

适用：章节切换、议程转场。

结构：

```text
TopBrandBar
SectionTitle
SectionNumber(optional)
BackgroundFlowLight
```

布局规则：

- 极简。
- 只表达章节主题。
- 不承载复杂正文。
- 可以使用金色短线或青绿色小标签强化章节感。

---

### 2.3 CaseResult 案例成果页

适用：品牌案例、投放案例、项目复盘、成果展示。

结构：

```text
TopBrandBar
CenteredTitle
CaseContextCard
MethodCard
ResultMetricGroup
BackgroundFlow
```

推荐布局：

```text
左：案例背景 / 资源问题
中：策略方法 / 组合路径
右：成果数字 / 业务结果
```

设计规则：

- 右侧或中心必须有明显结果数字。
- 三段内容之间用轻箭头、流线或标签建立关系。
- 每个模块内部只保留最关键内容。

内容上限：

- 3 个主模块
- 2~4 个关键数字
- 每个模块 1 个标题 + 2~3 条说明

---

### 2.4 DataInsight 数据结论页

适用：趋势分析、相关性、增长效果、人群价值。

结构：

```text
CenteredTitle
MainChartCard
InsightMetricCard
ConclusionTag
```

推荐布局：

- 中间：主图表
- 左右：关键数字或结论卡
- 顶部：一句结论型标题

图表规则：

- 图表必须极简。
- 主线青绿色，辅助线香槟金。
- 不使用复杂网格。
- 图表标题必须直接表达结论。

---

### 2.5 StrategyMap 策略分析页

适用：投放策略、资源组合、方法论、问题-解法路径。

结构：

```text
CenteredTitle
ProblemNodeGroup
StrategyNodeGroup
ResultNodeGroup
ConnectionLines
```

推荐表达：

```text
问题：钱花不对 / 人找不对 / 资源选不对
解法：智能分钱 / 易感人群 / 创新互动资源
结果：提升效率 / 拉动 GMV / 获取新增量
```

规则：

- 每条路径横向展开。
- 问题、解法、结果之间要有明确连接关系。
- 解法节点可以用青绿色强调。
- 结果节点可以用香槟金强调。

---

### 2.6 MetricShowcase 指标成果页

适用：GMV、ROI、新客占比、增长率等成果发布。

结构：

```text
CenteredTitle
MetricCardGroup
SupportingNote(optional)
BackgroundGlow
```

推荐布局：

- 3 个指标横向排布最稳。
- 4 个指标时降低单卡宽度，但不要压缩数字。
- 每个指标包含：指标名 / 大数字 / 结果标签 / 解释。

---

### 2.7 ThreePartStory 三段式叙事页

适用：背景-动作-结果、问题-策略-增长、洞察-方法-验证。

结构：

```text
CenteredTitle
StoryCardA
StoryCardB
StoryCardC
```

规则：

- 三段标题要同级。
- 每段不要超过 3 条信息。
- 中间段可作为视觉主卡突出。
- 可以用箭头或柔和连接线串联。

---

## 3. 内容级组件

### 3.1 TopBrandBar 顶部品牌区

用途：展示品牌、业务线、会议主题。

规格：

- 高度：70~90 px
- 左右边距：220 px
- 字号：18~24 px
- 颜色：深青黑 / 中性灰

规则：

- 品牌识别默认由 `FixedBrandLogo` 承担，不重复输出品牌文字。
- 业务主题或联合品牌仅在源材料或用户指令明确提供时渲染。
- 不做复杂导航。

---

### 3.2 CenteredTitle 居中标题

用途：页面主结论。

规格：

- 字号：72~88 px → 封面主标题 148px，目录页 82px，常规页 72px
- 字重：600
- 颜色：#0B2D3A
- 行数：不超过 2 行

规则：

- 必须结论化表达。
- 不要写成泛泛标题。
- 标题下方可有 36px 副标题。

---

### 3.3 WhiteContentCard 白色内容卡片

用途：承载结构化内容。

规格：

```css
background: #FFFFFF;
border: 1px solid rgba(213, 174, 121, 0.35);
border-radius: 22px;
box-shadow: 0 10px 28px rgba(11, 45, 58, 0.04);
padding: 28px 32px;
```

规则：

- 卡片内留白充足。
- 不使用厚重阴影。
- 不堆过多文字。
- 默认使用 `height: auto`，禁止因内容少而拉伸到画布底部。
- 禁止默认使用 `height: 100%`、`flex: 1` 或过大的 `min-height`。
- 正文少于 120 字时，卡片高度不得超过画布高度的 55%（554px），且有效内容占卡片高度不得低于 55%。
- 先识别横向、纵向或矩阵语义卡片组，再用共同父容器统一控制位置、尺寸、间距和对齐；禁止逐张定位。
- 横向组必须顶边、底边对齐且外框等高；纵向组必须左、右边缘对齐且外框等宽；矩阵组各行等高、各列等宽，行列间距一致。
- 内容差异只能通过内部弹性空间、固定底部结论区或精简文案处理；外框对齐优先于内部内容对齐，不得移动整张卡片。
- 主次卡、瀑布流、时间轴或刻意非对称构图可例外，但必须在页面计划中说明设计意图。

---

### 3.4 MetricNumber 大数字

用途：突出结果。

规格：

- 数字字号：48px / 64px / 72px / 100px / 200px（按 `--font-number-*` 选用）
- 单位字号：36~48 px
- 颜色：香槟金或深青黑
- 字重：300~400

结构：

```text
指标名
大数字 + 单位
结果标签
解释说明
```

---

### 3.5 PillTag 胶囊标签

用途：资源、策略、人群、路径节点。

规格：

- 高度：34~44 px
- 圆角：999 px
- 横向内边距：16~22 px
- 字号：14~18 px

普通状态：白底 + 浅金边。

选中状态：浅青绿底 + 青绿边 + 深青绿文字。

---

### 3.6 FlowLine 柔和连接线

用途：连接问题、策略、结果。

规则：

- 线条颜色可用青绿色或浅金色。
- 透明度控制在 30%~60%。
- 不使用强箭头。
- 保持轻盈，不抢正文。

---

### 3.7 BackgroundFlow 背景流线

用途：增强大屏氛围。

规则：

- 放置于底部或左右两侧。
- 层级在内容层下方。
- 青绿 + 香槟金组合。
- 低透明、柔焦、横向延展。
- 不遮挡文字和卡片。


### 3.8 MetricGrowthCard 指标增长型数据卡（硬约束）

**用途**：展示经营指标、增长结果、转化效率、用户规模、GMV、ROI、渗透率等核心数据。强调"核心指标 + 趋势证明 + 结论表达"。不得做成普通文字卡或复杂仪表盘。

#### 单卡结构（自上而下）

```text
metric-card
├── metric-tag       顶部状态标签（胶囊，居中，自适应宽度，不得铺满卡片宽度）
├── metric-title     指标名称（1–2 行，深色，简洁）
├── metric-value     核心数字区
│   ├── metric-prefix  统计口径（YoY/MoM/同比，小字号，基线对齐）
│   ├── metric-number  核心数字（第一视觉重点，最大字号）
│   └── metric-unit    单位（次级，基线对齐）
├── metric-chart     趋势图表区（折线/面积/柱状/环形进度）
├── metric-time      时间或维度标识（小字，弱色，左右对齐节点）
└── metric-summary   底部结论（1–2 行，居中或左对齐）
```

**视觉比例（卡片高度）**：

| 区域 | 占比 |
|------|------|
| 顶部标签 + 标题区 | 18%–24% |
| 核心数字区 | 20%–26% |
| 趋势图表区 | 28%–36% |
| 时间标识 + 结论区 | 16%–22% |

视觉层级必须满足：**核心数字 > 指标名称 > 状态标签 > 图表 > 辅助说明**。

#### 单卡外框规则

- 宽高比约 **0.78:1–0.9:1**（竖向圆角矩形）
- 必须设置 `max-width`（建议 560px–760px），**禁止因超宽画布横向空间充足而无限拉宽**
- 圆角：`22px`；边框：`1px solid rgba(213,174,121,.30)`；阴影：`0 10px 28px rgba(11,45,58,.06)`
- 内部 padding：`32px 40px`；布局：纵向 Grid，统一垂直中心轴，上下留白均衡

#### 图表规则

- 仅保留趋势线、关键节点、基线、起止时间、必要面积渐变
- 可使用空心圆点、低透明虚线、终点箭头强化增长过程
- **禁止**：复杂网格线、多条折线、密集刻度、完整图例、无关标注
- 图表高度约占卡片总高度 **28%–36%**，不得抢占核心数字的视觉地位
- 图表完整填充自身绘图区，不得触碰卡片边缘
- 位图/图标使用 `object-fit: cover`，根据主体位置调整 `object-position`；**禁止 `contain` 导致漂浮空白**

#### 内容量控制规则

- 内容较少时：适度放大核心数字和图表，或缩小卡片整体尺寸
- 内容较多时：精简文字，**不得压缩字号或扩大卡片宽度**
- **禁止**通过增加无意义 padding、拉高卡片或放大空白制造高级感

#### 多卡复用规则（硬约束）

同一页面复用多张数据卡时，所有卡片必须共享以下固定属性：

- 相同外框宽度和高度
- 相同圆角、边框、阴影和背景规则
- 相同内部 padding
- 相同纵向结构和区域比例
- 相同标签高度与顶部坐标
- 相同指标名称区域高度
- 相同核心数字区域高度
- 相同图表区域高度
- 相同时间标识基线
- 相同底部结论基线
- 相同卡片间距

**对齐硬约束**：

```
top(card_i)    = top(card_j)
bottom(card_i) = bottom(card_j)
height(card_i) = height(card_j)
```

**不同指标只允许替换**：状态标签文案、指标名称、核心数字与单位、趋势图形、起止时间、底部结论、局部强调色。

不得因为某张卡文字更多、数字更长或图表不同而改变外框尺寸。文字长度差异必须在组件内部消化；必要时对较长文案做提炼，**不得缩小整体字号体系**。

#### 排列规则

- 同一行优先使用 `grid-template-columns: repeat(N, minmax(0, 1fr))`
- 父容器使用 `align-items: stretch`
- 超宽画布中必须设置卡片组 `max-width`，**禁止卡片为了填满整页而无限拉宽**
- 卡片数量较少时：增加组间距或调整整体居中，**不得扩大单卡宽度**
- 卡片数量较多时：增加列数或分组，**不得压缩卡片内部结构**
- 重点卡片可轻微放大核心数字、增强边框或提高背景对比，**不得破坏整组顶部/底部/高度对齐**

#### 推荐 CSS 结构

```css
.metric-card {
  width: 100%;
  max-width: var(--metric-card-max-width, 720px);
  height: 100%;
  box-sizing: border-box;
  display: grid;
  grid-template-rows:
    auto            /* metric-tag     */
    auto            /* metric-title   */
    auto            /* metric-value   */
    minmax(0, 1fr)  /* metric-chart   */
    auto            /* metric-time    */
    auto;           /* metric-summary */
  justify-items: center;
  align-items: start;
  padding: 32px 40px;
  background: var(--white-card);
  border: 1px solid rgba(213, 174, 121, .30);
  border-radius: 22px;
  box-shadow: 0 10px 28px rgba(11, 45, 58, .06);
  overflow: hidden;
}

.metric-tag {
  display: inline-flex;
  align-items: center;
  height: 36px;
  padding: 0 18px;
  border-radius: 999px;
  font-size: 22px;
  font-weight: 500;
  margin-bottom: 16px;
  /* 不得 width: 100% —— 必须自适应内容宽度 */
}

.metric-title {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
  line-height: 1.3;
  max-height: 2.6em;      /* 最多 2 行 */
  overflow: hidden;
  margin-bottom: 12px;
}

.metric-value {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
  margin-bottom: 16px;
}

.metric-prefix {
  font-size: 22px;
  font-weight: 400;
  color: var(--text-muted);
}

.metric-number {
  font-size: 100px;    /* 按需选用 64px / 72px / 100px */
  font-weight: 300;
  line-height: 1;
  letter-spacing: -.04em;
  color: var(--gold-deep);  /* 或 var(--teal-deep)、var(--text-primary) */
}

.metric-unit {
  font-size: 36px;
  font-weight: 400;
  color: var(--text-muted);
  align-self: flex-end;
  margin-bottom: .1em;
}

.metric-chart {
  width: 100%;
  min-height: 0;         /* 允许 grid 1fr 正常收缩 */
  overflow: hidden;
}

.metric-chart svg,
.metric-chart canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.metric-time {
  font-size: 22px;
  color: var(--text-muted);
  text-align: center;
  width: 100%;
  margin-top: 8px;
}

.metric-summary {
  font-size: 24px;
  color: var(--text-body);
  text-align: center;
  line-height: 1.4;
  max-height: 2.8em;
  overflow: hidden;
  margin-top: 12px;
  width: 100%;
}

/* 多卡组容器 */
.metric-card-group {
  display: grid;
  grid-template-columns: repeat(var(--card-count, 3), minmax(0, 1fr));
  align-items: stretch;
  gap: var(--metric-card-gap, 32px);
  width: min(100%, var(--metric-group-max-width, 3200px));
  margin-inline: auto;
}
```

#### HTML 示例（单卡）

```html
<div class="metric-card">
  <span class="metric-tag tag-gold">规模持续增长</span>
  <div class="metric-title">联盟日均消耗</div>
  <div class="metric-value">
    <span class="metric-prefix">YoY</span>
    <span class="metric-number">+20%</span>
    <span class="metric-unit">+</span>
  </div>
  <div class="metric-chart">
    <!-- SVG 折线趋势图，仅保留趋势线 + 关键节点 -->
    <svg viewBox="0 0 400 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- 面积填充 -->
      <path d="M0 100 L80 80 L160 60 L240 40 L320 20 L400 0 L400 120 L0 120Z"
            fill="url(#grad-gold)" opacity=".15"/>
      <!-- 趋势线 -->
      <path d="M0 100 L80 80 L160 60 L240 40 L320 20 L400 0"
            stroke="var(--gold-main)" stroke-width="2.5" stroke-linecap="round"/>
      <!-- 终点节点 -->
      <circle cx="400" cy="0" r="5" fill="var(--gold-deep)"/>
      <defs>
        <linearGradient id="grad-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--gold-main)"/>
          <stop offset="100%" stop-color="transparent"/>
        </linearGradient>
      </defs>
    </svg>
  </div>
  <div class="metric-time">上一年 → 今年</div>
  <div class="metric-summary">规模持续放大，保持强劲增长节奏</div>
</div>
```

#### 生成后必须检查

```text
[ ] 单张卡片是否存在大面积无功能留白
[ ] 核心数字是否为第一视觉重点（最大字号 + 最强颜色）
[ ] 状态标签是否自适应宽度（未铺满卡片）
[ ] 图表是否简洁且能表达趋势（无复杂坐标系、无多条折线）
[ ] 图表和图片是否完整填充容器（无漂浮空白、无拉伸变形）
[ ] 同组卡片是否严格等宽、等高（top/bottom/height 误差 ≤ 2px）
[ ] 标签、标题、数字、图表、时间和结论是否分别位于统一基线
[ ] 是否因超宽画布将卡片拉得过宽（超过 max-width）
[ ] 是否因文字长度差异破坏组件外框尺寸
[ ] 是否存在单张卡片通过 margin/top/translate/独立高度进行补偿
[ ] 卡片间距是否统一
[ ] 多卡重点指标是否在不破坏对齐的前提下进行了轻微强调
```

---


### 3.9 ConnectionHub 连接枢纽组件（硬约束）

**适用场景**：大会演讲、行业峰会、品牌发布、招商推介、年度总结、战略发布、产品介绍、案例分享等，用于表达多个角色、模块、能力、阶段、资源、数据或结论之间的关系。

> **与高级关系库的分工**：`advanced_relation_components.md` 管理数据密度更高的变体（GrowthFlywheelLoop、FunnelConversion 等）。本组件聚焦**通用关系语言**——节点形状、锚点对齐、线条样式、超宽画布约束和多页复用规则。选择顺序见 §7.5。

#### 组件元素（按需组合，非全部必需）

```text
connection-hub              顶层容器（Grid/Flex 轨道，统一坐标）
├── hub-core                核心节点（圆形/环形/圆角徽章）
├── hub-module              外部业务模块（卡片/标签/图标块）
├── hub-connector           连接线（SVG line/path，语义对应线型）
├── hub-anchor              连接锚点（各方向边界中心）
├── hub-rhythm-dot          节奏节点（均匀分布在连接线上）
├── hub-operator            运算符（×、+、=、→）
├── hub-annotation          辅助说明（弱色，小字号）
└── hub-ring                环形/同心圆装饰（可选，仅在语义需要时使用）
```

#### 核心节点规则

- 必须保持**严格正圆**（`aspect-ratio: 1 / 1`），不得因文字长度变为椭圆
- 节点直径设置 `max-width`（建议 200px–360px），禁止超宽画布无限放大
- 文字控制在 2–8 个汉字或简短缩写，仅放核心概念
- 视觉强调来自字号、字重、描边、背景层次或轻微阴影；禁止厚重发光、复杂立体效果

```css
.hub-core {
  aspect-ratio: 1 / 1;
  width: var(--hub-core-size, 240px);
  max-width: var(--hub-core-max, 320px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  flex-shrink: 0;
  /* 强调：border/background，禁止 box-shadow > 0 0 40px 等厚重发光 */
}
```

#### 外部模块规则

同一层级的外部模块必须共享：

- 相同高度或 `aspect-ratio` 规则
- 相同 `border-radius`
- 相同 `border` 规则
- 相同 `padding`
- 相同标题字号层级
- 与核心节点的**统一间距**（`var(--hub-gap)`）

外部模块文字保持精简：每个模块优先表达一个核心概念。

#### 连接线语义与线型

AI 必须根据语义选择线型，**禁止所有关系使用同一种线条**：

| 语义 | 线型 | SVG 属性 |
|------|------|----------|
| 明确、稳定、直接关系 | 实线 | `stroke-dasharray: none` |
| 辅助、潜在、弱关联 | 虚线 | `stroke-dasharray: 8 4` |
| 资源触点、传播路径 | 点线 | `stroke-dasharray: 2 6` |
| 流程、递进、输入输出 | 单向箭头 | `marker-end: url(#arrow)` |
| 互动、反馈、双向协同 | 双向箭头 | 两端 marker |
| 对等、共同组成 | 无箭头实线 | — |
| 循环、闭环 | 环形路径 | `stroke-dasharray: none`，闭合 path |
| 组合关系 | 运算符 | HTML `span.hub-operator` |

同一页面中，**相同语义必须使用相同连接样式**。

#### 连接锚点规则（硬约束）

```
连接线必须从节点/模块的 边界锚点 出发，终止于 目标边界锚点。
禁止从文字区域、圆心或卡片内部随意出发。
禁止悬空（不触碰目标边缘）。
禁止穿入文字区域。
```

标准锚点：左中 · 右中 · 上中 · 下中 · 左上 · 右上 · 左下 · 右下 · 圆周方向点

**水平对齐约束**（中心枢纽型）：
```
centerY(leftModule) = centerY(hubCore) = centerY(rightModule)
```

**垂直对齐约束**（纵向枢纽型）：
```
centerX(topModule) = centerX(hubCore) = centerX(bottomModule)
```

所有对齐必须来自共同父级 Grid/Flex 的 `align-items: center` 或 SVG 坐标系统，**禁止逐条设置 `margin`、`top`、`left`、`translate` 肉眼调整**。

#### 连接线排布规则

- 优先水平线、垂直线和规则折线；仅当版式明确需要时才使用斜线或曲线
- 不穿过主要文字或核心数字
- 不无序交叉，不贴得过近，不因长度过长导致关系松散
- 路径由共同 Grid/Flex 或 SVG 坐标系统控制

#### 节奏节点规则

线上的小圆点/空心点/短线/阶段标记：

- 均匀分布，**弱于**核心节点和业务模块
- 一条普通连接线 0–3 个节奏节点
- 禁止过多节奏节点造成装饰化和视觉噪声

#### 推荐布局 CSS 结构

```css
/* 顶层容器 */
.connection-hub {
  display: grid;               /* 或 flex */
  align-items: center;         /* 保证 centerY 对齐 */
  justify-items: center;
  gap: var(--hub-gap, 64px);
  width: min(100%, var(--hub-max-width, 3000px));
  margin-inline: auto;
  position: relative;          /* SVG 连接线 absolute 定位的基准 */
}

/* SVG 连接层 */
.hub-svg-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
}

/* 外部模块 */
.hub-module {
  min-width: 0;
  box-sizing: border-box;
  /* 高度、圆角、padding 由统一 CSS 变量控制 */
  height: var(--hub-module-height);
  border-radius: var(--hub-module-radius, 18px);
  padding: var(--hub-module-padding, 28px 36px);
}
```

#### 超宽画布约束

- 核心节点不得无限放大（设 `max-width`）
- 外部模块不得被推到画布两端（节点组设 `max-width`）
- 禁止用超长连接线填满画布
- 禁止让关联模块彼此距离过远
- 剩余空间通过：多组并列关系 / 左右分区 / 主关系 + 辅助关系 / 中心枢纽 + 两侧业务带 / 多阶段横向流程 消化

#### 单页容量建议

| 元素 | 建议数量 |
|------|---------|
| 核心节点 | 1–3 个 |
| 普通外部节点 | 2–8 个 |
| 主要连接关系 | 1–6 条 |
| 辅助说明 | 控制在必要范围 |

超过时必须拆页、分组或分阶段呈现，**禁止在单页无限增加节点**。

#### 大会 PPT 可读性要求

- 核心概念可在 3–5 秒内被识别
- 连接线不得过细（建议 `stroke-width ≥ 1.5px`，主关系 `≥ 2px`）
- 辅助说明字号不得低于 22px（字号层级规范最小值）
- 重要路径高对比，次要路径主动弱化
- 页面不得因连接元素过多像复杂架构图

#### 多页复用规则

同一套 PPT 中多次使用连接枢纽时，必须保持统一：核心节点形状 / 节点边框 / 连接线线宽 / 箭头样式 / 节奏节点样式 / 字体层级 / 圆角与阴影 / 连接锚点逻辑 / 主色与辅助色。

**允许**根据语义变化：节点数量 / 连接方向 / 主次大小 / 关系符号 / 局部强调色 / 外部卡片内容 / 横向纵向环形放射布局。

**复用 ≠ 复制完全相同版式**。保持组件语言一致，同时根据内容选择不同关系结构。

#### 禁止事项

```text
[ ✗ ] 圆形拉伸成椭圆（aspect-ratio 必须 1/1）
[ ✗ ] 节点文字过多（超过 8 个汉字或 2 行）
[ ✗ ] 连接线从文字中穿过
[ ✗ ] 连接线悬停在节点外形成断点
[ ✗ ] 多条线无序交叉
[ ✗ ] 所有关系使用同一种线条样式
[ ✗ ] 节点与外部模块没有明确对齐关系
[ ✗ ] 超宽画布中使用超长连接线
[ ✗ ] 通过放大中心节点填满页面
[ ✗ ] 过重阴影、发光、厚描边
[ ✗ ] 每页重复同一种中心圆结构（应根据语义选择变体）
[ ✗ ] 逐个用 top/left/margin/translate 修正位置（必须用共同父级）
[ ✗ ] 为纯装饰增加无语义圆点、线条和圆环
```

#### 生成后专项检查

```text
[ ] 核心关系是否可以快速理解（3–5 秒内）
[ ] 中心节点是否为严格正圆（aspect-ratio: 1/1，无椭圆）
[ ] 同类节点尺寸是否一致
[ ] 连接线是否准确接触节点边界（无悬空、无穿入文字）
[ ] 运算符是否处于相邻节点中心之间（centerY 对齐）
[ ] 主路径是否比辅助路径更清晰（线宽/色彩对比差异）
[ ] 节点组是否设置了 max-width（无过度松散）
[ ] 超宽画布是否出现无意义超长连接
[ ] 同一套 PPT 中组件风格是否统一（节点形状/线宽/圆角）
[ ] 当前结构是否真正适合内容（非机械套用圆形元素）
[ ] 连接线 stroke-width ≥ 1.5px（大屏可读）
[ ] 辅助说明字号 ≥ 22px（字号层级规范最小值）
```

---

## 4. 组合规则

### 4.1 推荐组合 A：案例成果页

```text
TopBrandBar
CenteredTitle
[WhiteContentCard: 背景问题]
[WhiteContentCard: 策略方法]
[MetricCardGroup: 成果数字]
BackgroundFlow
```

适合：品牌案例 / 项目成果 / 客户复盘。

---

### 4.2 推荐组合 B：数据结论页

```text
TopBrandBar
CenteredTitle
MainChartCard
MetricNumberGroup
ConclusionTag
BackgroundFlowLight
```

适合：数据洞察 / 相关性分析 / 趋势证明。

---

### 4.3 推荐组合 C：策略路径页

```text
TopBrandBar
CenteredTitle
ProblemNodeGroup -> StrategyNodeGroup -> ResultNodeGroup
FlowLine
BackgroundFlow
```

适合：方法论 / 解法路径 / 投放策略升级。

---

## 5. 组件生成约束

每次生成页面时必须检查：

```text
[ ] 页面是否只选用了 1 个主页面组件
[ ] 页面是否围绕 1 个核心结论展开
[ ] 是否使用了白色圆角卡片承载主体信息
[ ] 是否避免了小字和密集文本
[ ] 是否保持中心聚焦、左右延展
[ ] 是否使用香槟金突出结果
[ ] 是否使用青绿色表达策略 / 数据 / 智能
[ ] 是否没有出现普通 16:9 拉伸感
[ ] 是否已按高 / 中 / 低内容密度选择组件结构
[ ] 是否未通过拉伸卡片、无意义文案或纯装饰图形填充画布
[ ] 是否用图表、流程、关系、数据对比或主题视觉承接低密度页面
[ ] 是否避免将所有页面都做成三等分卡片
```

## FixedBrandLogo 独立品牌组件

### 组件定位

用于渲染页面左上角品牌 Logo，替代背景图内置 Logo。

### 使用范围

- CoverPage：显示
- 所有内容页：显示
- ClosingPage：显示

### 资产

```json
{
  "sourceUrl": "https://p5-ad.adkwai.com/udata/pkg/ks-ad-fe/md-tools/quick-cut/6689:5117.b90a9c9d53932e9b.svg",
  "localPath": "assets/logo.svg"
}
```

### HTML 示例

```html
<img
  class="fixed-brand-logo"
  src="./assets/logo.svg"
  data-asset-role="fixed-brand-logo"
  alt="快手联盟"
/>
```

### CSS 建议

```css
.fixed-brand-logo {
  position: absolute;
  left: 96px;
  top: 54px;
  width: 170px;
  height: auto;
  z-index: 5;
  pointer-events: none;
}
```

### 禁止事项

- 不得重复输出第二个品牌文字
- 不得把 Logo 做进背景图
- 不得从背景图裁切 Logo
- 不得使用模糊位图 Logo


---

## 6. 卡片防溢出通用约束

本节是组件维度的防溢出规则，与 `layout_overflow_protocol.md §8` 配合使用。所有卡片组件（`WhiteContentCard`、`MetricGrowthCard` 及任何自定义卡片）均必须满足本节约束。

### 6.1 卡片外框不得由内容决定尺寸

所有卡片外框的宽度和高度**必须由父级 Grid/Flex 轨道决定**，不得依赖内容自动撑高。

```css
/* 强制：父级轨道 */
.card-group {
  display: grid;
  grid-template-columns: repeat(var(--card-count), minmax(0, 1fr));
  align-items: stretch;      /* 同组等高 */
}

/* 强制：子卡片 */
.card {
  min-width: 0;
  min-height: 0;
  box-sizing: border-box;
}
```

### 6.2 卡片内部区域高度分配（纵向 Grid）

卡片内部必须使用纵向 Grid 显式分配各区域高度，禁止全部区域都用 `auto` 行高：

```css
.metric-card {
  display: grid;
  grid-template-rows:
    auto             /* 标签区：自适应内容 */
    auto             /* 标题区：自适应内容，但受 line-clamp 约束 */
    auto             /* 数字区：自适应内容，必须完整显示 */
    minmax(0, 1fr)   /* 图表区：占用剩余空间 */
    auto             /* 时间区 */
    auto;            /* 结论区：受 line-clamp 约束 */
  height: 100%;      /* 高度由父级轨道决定，不由内容决定 */
  min-height: 0;
}
```

规则：
- 至少有一个区域使用 `minmax(0, 1fr)` 吸收剩余空间（通常是图表区）；
- 所有文字区域必须声明 `max-height` 或使用 `-webkit-line-clamp`；
- 禁止所有区域都用 `auto` 行高（这会导致卡片随内容无限增高）。

### 6.3 各文字区域的溢出上限

| 区域 | 最大行数 | 溢出处理 |
|------|---------|---------|
| 卡片标题 / `metric-title` | 2 行 | `-webkit-line-clamp: 2` |
| 卡片正文 / `card-body` | 4 行 | `-webkit-line-clamp: 4` |
| 结论 / `metric-summary` | 2 行 | `-webkit-line-clamp: 2` |
| 胶囊标签 / `metric-tag` | 1 行 | `white-space: nowrap` |
| 核心数字 / `metric-number` | 1 行（不得截断）| `white-space: nowrap`，**禁止** `overflow: hidden` |
| 列表每项 / `li` | 2 行 | `-webkit-line-clamp: 2` |

### 6.4 数字区不得截断

`metric-number`、`.number-xl`、`.number-lg` 等数字类**严禁**使用 `overflow: hidden`、`text-overflow: ellipsis` 或 `line-clamp`。

若数字在分配空间内溢出，唯一合法修复步骤：
1. 给数字区分配更大横向空间（收窄相邻区域）；
2. 降一级字阶（如 100px → 72px），但不低于规范最小值；
3. 换更宽布局模板；
4. 拆页。

### 6.5 padding 不得被压缩为零

任何卡片的 `padding` 不得小于以下值：

| 位置 | 最小 padding |
|------|-------------|
| 卡片左右内边距 | 24px |
| 卡片上下内边距 | 24px |
| 列表项行间距 | 8px |
| 数字区上下间距 | 12px |

**禁止**为了塞入更多内容而将 padding 降为 0 或负值。若内容确实装不下，应精简文字或拆页。

### 6.6 标签宽度约束

胶囊标签（`.metric-tag`、`.tag`、`.pill-tag`、`.kicker`）**禁止** `width: 100%`，必须保持自适应宽度：

```css
.metric-tag,
.tag,
.pill-tag {
  display: inline-flex;
  width: fit-content;       /* 禁止 width: 100% */
  max-width: 90%;           /* 不得超过卡片宽度的 90% */
  white-space: nowrap;
}
```

### 6.7 Flex 行中标签与数字不得相互挤压

若标签与数字在同一 Flex 行，需显式设置：

```css
.metric-value {
  display: flex;
  align-items: baseline;
  flex-wrap: nowrap;         /* 数字与单位不换行 */
  gap: 4px;
  overflow: visible;         /* 不裁切数字 */
}

.metric-prefix {
  flex-shrink: 0;            /* 前缀不被压缩 */
}

.metric-number {
  flex-shrink: 1;            /* 在极端情况下数字区收缩，但不截断 */
  min-width: 0;
}

.metric-unit {
  flex-shrink: 0;
}
```

### 6.8 生成后卡片防溢出专项检查

```text
[ ] 每张卡片外框的宽度和高度是否来自父级 Grid/Flex 轨道
[ ] 卡片内部是否至少有一个 minmax(0, 1fr) 区域吸收剩余高度
[ ] 文字区是否都有 max 行数约束（line-clamp 或 max-height）
[ ] 核心数字区是否完整显示（无 overflow:hidden，无 ellipsis）
[ ] 胶囊标签是否 width: fit-content（无 width: 100%）
[ ] 每个 flex/grid 子项是否有 min-width: 0 和 min-height: 0
[ ] card 的 padding 是否不小于上下左右各 24px
[ ] 列表每项是否有行数上限（line-clamp: 2）
[ ] 图表区是否使用 overflow: hidden + min-height: 0
[ ] 未出现通过 overflow:hidden 静默截断正式文字内容
```
