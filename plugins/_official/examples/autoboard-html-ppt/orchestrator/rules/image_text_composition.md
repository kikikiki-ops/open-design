# 图文搭配与来源配图组件规则

本规则从“美妆行业新消费浪潮”市场 PPT 的主要信息版式抽象而来。它定义图像如何与正式文字、指标和关系组件共同构成页面，不允许把图片仅作为背景装饰，也不允许让来源配图在重构时静默消失。

## 1. 来源图片分级与保留

输入 PPTX 的每张图片、截图、产品图、人物图、场景图和信息图都必须进入 `content_inventory`，并标记以下之一：

- `must-render`：产品、人物、场景、研究图、图表截图、界面截图或承载页面论据的图片；最终 HTML 必须以独立 `<img>` / `<picture>` / `MediaFrame` 渲染。
- `optional`：与主题有关但不承载独立正式结论的辅助视觉；可作为 `SourceMediaFrame`、`MediaRail` 或替代性主题视觉使用。
- `do-not-render`：重复的模板背景、角标、品牌装饰、空白占位图或已由统一风格 Skill 负责的背景；仍须记录，不得误判为正文证据。

同一来源图片可以作为共同背景资产复用；承载页面论据的来源图片不得因版式重构而被静默丢弃。图片必须具备 `data-source-id`、来源页和 `data-component-role`。

## 2. 页面路由与可复用图文模式

先依据文字关系选择页面类型和模板，再从下列模式中选择图文变体。不得为了放一张图片把内容页误路由为封面或画廊页。

### 2.1 `MediaTextSplit` 主图 + 证据文本

适用：一张主图说明市场场景、消费者状态、产品对象或案例语境，旁侧有 2～4 个并列洞察。

来源样式：市场 PPT 的“主图配多项市场结论”与“图像配编号说明”页面。

```text
主图 36%～44% | 文本/指标 56%～64%
```

- 主图与文本区共享同一内容带顶部、底部和整体高度 `H`。
- 文本区可使用 2～4 个横向卡片或纵向证据条，但文本卡不得覆盖图片。
- 主图只承担语境或证据；结论、数字和标签必须仍为独立可编辑 DOM。
- 适用于 `CaseStudyPage`、`MetricOverviewPage`、`StructuredContentPage` 的图文变体。

### 2.2 `PairedMediaInsight` 主图 + 右侧双证据卡

适用：一个强语境图片对应两条互补洞察，例如“消费者现象 + 行业影响”或“产品特征 + 商业回报”。

来源样式：市场 PPT 的左侧人物/产品图，右侧上下两张内容卡。

```text
主图 40% | 间距 | 右侧双卡 60%
```

- 右侧双卡使用 `repeat(2, minmax(0, 1fr))` 统一行轨道；两张卡必须等高、等宽。
- 主图、双卡组外框共同受内容带 `H` 控制，顶部和底部误差不得超过 2px。
- 每张证据卡最多 1 个标题、1 个关键数字、1 段正式说明；超限时改用 `MediaTextSplit` 或拆页。
- 适用于 `CaseStudyPage`、`StrategyPanoramaPage`、`TransformationPage`。

### 2.3 `EvidenceMediaRail` 文本主体 + 竖向图片带

适用：主体是 2～4 项分析、策略或数据，右侧需要 1～4 张图片作为对应证据、场景或截图。

来源样式：市场 PPT 的左侧结论正文、右侧纵向图片拼贴带。

```text
文本主体 1fr | 证据图片带 360px～560px
```

- 图片带宽度固定在可读区间，不得因超宽画布而无限拉宽。
- 多图图片带必须用 `repeat(N, minmax(0, 1fr))` 共享行轨道，图片间距统一。
- 每张图可有一行来源内已有的短说明；没有来源说明时不得虚构图注。
- 图片带、文本主体和任何结果模块均必须共享内容带的共同顶部和底部边界。
- 适用于 `StructuredContentPage`、`MetricOverviewPage`、`ShowcaseGalleryPage`。

### 2.4 `DualMediaCompare` 双图对照 + 共同结论

适用：两个来源视觉对象存在明确对比、前后变化、渠道对照或人群差异。

来源样式：市场 PPT 的双图并列和双侧证据面板。

```text
媒体 A | 对比轴 / 结论 | 媒体 B
```

- 两张图片使用相同媒体框高度与共同顶部、底部基线；若原图宽高比不同，使用 contain 留白，不得拉伸成相同画面比例。
- 对比轴只表达来源中已有的对比维度；不能因图片视觉差异虚构结论。
- 共同结论区最多放 1 条结论或 1～3 个来源指标。
- 适用于 `MultiColumnComparisonPage`、`TransformationPage`、`CaseStudyPage`。

### 2.5 `MediaFlowTrack` 截图 / 图片序列 + 流程说明

适用：2～5 张截图或场景图对应一个明确顺序、旅程、渠道路径或操作流程。

来源样式：市场 PPT 的横向图片序列、节点式内容链路。

- 每张图片与其说明属于同一节点，节点按共同父级 Grid 水平排布。
- 连接线只连接相邻节点的内容中心，不连接整页中心。
- 每张媒体框保持原比例；节点说明超限时拆为两页，不得把截图缩成不可辨认的缩略图。
- 适用于 `ProcessFlowPage`、`CaseJourneyPage`、`screenshot-flow-kpi`。

## 3. 组件接口

规划器在 `requiredCapabilities` 与 `allowedComponents` 中按需使用下列组件：

| 组件 | 作用 | 必填内容 |
|---|---|---|
| `SourceMediaFrame` | 单张来源图片/截图框 | `mediaSource`、来源页、可选来源图注 |
| `SourceMediaRail` | 1～4 张纵向证据图片带 | `mediaItems`、统一轨道数 |
| `MediaTextSplit` | 主图与文本模块的共同内容带 | `media`、`textModules`、`alignmentContract` |
| `PairedEvidenceStack` | 上下两张等高证据卡 | `evidenceCards`、`rowTracks` |
| `MediaCaption` | 来源已有的短说明 | `sourceText`，不得生成虚构图注 |
| `DualMediaCompare` | 两张对照媒体与共同结论 | `leftMedia`、`rightMedia`、`comparisonAxis` |
| `MediaFlowTrack` | 图片/截图序列与连接关系 | `stages`、`connectors` |

没有来源图片时不得为了填充空间生成 `SourceMediaFrame`；存在来源图片时不得仅把文件复制到 assets 而不映射到页面计划。

## 4. 几何、比例与安全区

- 所有正式图文模块位于 `X: 220~3476px`、`Y: 90~918px` 安全区内。
- 主图、图片带、文本主体、指标栏等同一内容带一级模块必须共享共同内容带高度 `H`，通常为 440px～560px。
- 图片默认使用 `object-fit: contain`；只有不承载文字、UI、图表、人物关键部位或产品主体的场景图可使用 `cover`，并必须声明 `object-position`。
- 禁止 `object-fit: fill`、CSS `scaleX/scaleY`、非等比 `width/height` 或把普通图片横向拉伸填满 11:3 画布。
- 媒体框可以有轻边框、浅底色和圆角，但不得把图片裁切到无法辨认；图片框不承载正文文字。
- 文字可覆盖图片的唯一例外是来源图片明确留有无信息空白区，且覆盖文字为独立 DOM、通过对比度检查并未遮挡来源证据。

## 5. 容量与失败恢复

- 1 张主图 + 2 张证据卡：优先 `PairedMediaInsight`。
- 1 张主图 + 3～4 个同级结论：优先 `MediaTextSplit`。
- 2～4 张竖向图片 + 分析内容：优先 `EvidenceMediaRail`。
- 3～8 张媒体且媒体本身是核心证据：优先 `media-gallery-edge-metrics`。
- 2～5 张有顺序的截图：优先 `screenshot-flow-kpi` 或 `MediaFlowTrack`。
- 超出以上容量时，先拆页；不得压缩图片、缩小安全区或把图片塞入文字卡背景。

## 6. 交付审计

`window.__odLayoutAudit()` 除现有文字、画布和安全区检查外，还必须确认：

- 每个 `must-render` 来源图片均存在对应的 `SourceMediaFrame` / `SourceMediaRail` 节点；
- 媒体节点位于安全区内，且未被 sibling、遮罩或 `overflow:hidden` 裁切；
- 媒体框的渲染宽高比未被拉伸；
- 同一图片带内所有帧共享统一行轨道、间距、顶部与底部基线；
- 图片与关联文字建立明确 `data-relation-id` 或共同 `data-group-id`；
- 100% 画布和缩放预览下图片主体、图中文字及其关联结论仍清晰可辨。
