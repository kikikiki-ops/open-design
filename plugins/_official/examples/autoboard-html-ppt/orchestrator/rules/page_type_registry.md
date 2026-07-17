# 页面类型注册表（单一权威来源）

> **V2.7.0 — 本文件是 pageType / templateId / layoutComponent 的唯一权威来源。**
> 禁止在 `SKILL.md`、`orchestrator/SKILL.md`、`page_type_router.md`、`layout_selection.md`
> 和 `page_plan.schema.json` 中各自维护分散的类型列表。当以上文件中的列表与本文件冲突时，
> 以本文件为准。

---

## 1. 完整页面类型注册表

| pageType | pageRole | 推荐 templateId | 推荐 layoutComponent | 说明 |
|---------|----------|----------------|---------------------|------|
| `CoverPage` | cover | `cover-centered-hero` | `CoverLayout` | 封面，含主标题/副标题/日期/Logo |
| `AgendaPage` | section | `agenda-chapter-columns` | `ThreeColumnContentsLayout` | 目录/议程，1–5 章节横向导航 |
| `SectionDividerPage` | section | — | `SectionLayout` | 章节分隔，大序号 + 章节名 |
| `ClosingPage` | closing | `closing-call-to-action` | `ClosingLayout` | 封底，二维码/感谢语/CTA |
| `MetricOverviewPage` | content | `metric-story-triple` | `ThreeMetricCardLayout` | 2–4 核心指标，大数字/趋势/说明 |
| `MultiColumnComparisonPage` | content | `dual-wing-comparison` | `DualWingLayout` | 2–5 并列对象，每组标题+说明/指标 |
| `EcosystemRelationshipPage` | content | `ecosystem-bridge` | `HubBridgeLayout` | 左角色—中心—右角色，流转关系 |
| `StrategyPanoramaPage` | content | `strategy-before-after` | `ThreeZoneColumnLayout` | 多策略模块全景，强调整体布局 |
| `StageEvolutionPage` | content | `maturity-stage-triple` | `StageFlowLayout` | 递进阶段（过去/现在/未来等） |
| `DualCoreArchitecturePage` | content | `capability-engine-architecture` | `DualChainLayout` | 两核心居中+两侧支撑 |
| `FormulaDecompositionPage` | content | `funnel-conversion-story` | `ColumnGridLayout` | 公式/运算因素分解 |
| `CaseStudyPage` | content | `case-problem-solution-impact` | `CaseStudyLayout` | 背景—动作—结果 |
| `ProcessFlowPage` | content | `parallel-stage-flow` | `ProcessLayout` | 有序流程节点，3+ 步骤 |
| `CentralModelPage` | content | `radial-capability-map` | `HubBridgeLayout` | 单中心对象+外围因素/输入/结果 |
| `ShowcaseGalleryPage` | content | `media-gallery-edge-metrics` | `ShowcaseGalleryLayout` | 图片/截图画廊，含指标注释 |
| `TransformationPage` | content | `before-after-effect-compare` | `DualWingLayout` | 改造前后对比，含效果数据 |
| `CapabilityRoadmapPage` | content | `capability-evolution-roadmap` | `RoadmapLayout` | 能力路线图，含时间轴/里程碑 |
| `CapabilityMatrixPage` | content | `capability-pillar-matrix` | `FourColumnMatrixLayout` | 能力矩阵，行×列二维结构 |
| `ChartAnalysisPage` | content | `dual-track-evidence-kpi` | `ChartAnalysisLayout` | 图表主导，含解读/结论侧栏 |
| `StructuredContentPage` | content | — | `ColumnGridLayout` | 通用兜底，置信度 < 0.65 时默认 |

---

## 2. 扩展 templateId 目录

以下 templateId 可与上表中的 layoutComponent 搭配使用，适用于同一 pageType 的不同内容变体：

| templateId | 适用 pageType | 说明 |
|------------|--------------|------|
| `growth-flywheel-loop` | `EcosystemRelationshipPage` | 飞轮/循环关系图 |
| `metrics-taxonomy-matrix` | `CapabilityMatrixPage` | 指标分类矩阵 |
| `opportunity-portfolio` | `MultiColumnComparisonPage` | 机会组合矩阵 |
| `decision-priority-map` | `StrategyPanoramaPage` | 优先级决策矩阵 |
| `screenshot-flow-kpi` | `ShowcaseGalleryPage` | 产品截图+流程+指标 |
| `case-journey-growth` | `CaseStudyPage` | 案例成长旅程 |
| `capability-upgrade-ladder` | `StageEvolutionPage` | 能力升级阶梯 |

---

## 3. 路由优先级（与 page_type_router.md §2 保持同步）

路由顺序（优先级从高到低）：

1. **角色硬门槛**：`CoverPage` / `SectionDividerPage` / `ClosingPage`
2. `AgendaPage`（章节列表/议程结构）
3. `ProcessFlowPage` / `CapabilityRoadmapPage`（有序流程/时间轴）
4. `CaseStudyPage`（问题—动作—结果三段结构）
5. `CentralModelPage` / `FormulaDecompositionPage` / `DualCoreArchitecturePage`
6. `ShowcaseGalleryPage` / `ChartAnalysisPage`
7. `MultiColumnComparisonPage` / `StageEvolutionPage` / `CapabilityMatrixPage`
8. `EcosystemRelationshipPage` / `StrategyPanoramaPage`
9. `TransformationPage`
10. `MetricOverviewPage`
11. `StructuredContentPage`（兜底，置信度 < 0.65 时强制使用）

---

## 4. 变更记录

| 版本 | 变更内容 |
|------|---------|
| V2.7.0 | 创建本文件，统一原散落在 SKILL.md §8、page_type_router.md、page_plan.schema.json 中的类型列表 |
