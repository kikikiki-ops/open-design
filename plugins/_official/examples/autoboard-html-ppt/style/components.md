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
