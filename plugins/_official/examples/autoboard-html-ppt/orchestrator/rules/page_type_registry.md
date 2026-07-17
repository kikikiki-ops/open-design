# Page Type Registry — 统一页面类型注册表

> **单一权威来源（V2.7.0）**
>
> 本文件是 `pageType` ↔ `templateId` ↔ `layoutComponent` ↔ `layoutFamily` 的唯一跨文件权威对照表。
> 其他文件（`page_type_router.md`、`template_library.md`、`page_plan.schema.json`）若与本表冲突，以本表为准并需同步修正。

---

## 1. 完整映射表

| # | pageType | 主要 templateId（可多选） | layoutComponent | layoutFamily | pageRole |
|---|---------|-------------------------|----------------|-------------|---------|
| 1 | `CoverPage` | `cover-centered-hero` | `HeroLayout` | `HeroLayout` | `cover` |
| 2 | `AgendaPage` | `agenda-chapter-columns` | `ThreeColumnContentsLayout` | `A-Column` | `section` |
| 3 | `SectionDividerPage` | *(无固定 templateId，用背景+大字)* | `SectionDividerLayout` | `HeroLayout` | `section` |
| 4 | `MetricOverviewPage` | `metric-story-triple`、`metrics-taxonomy-matrix`、`dual-track-evidence-kpi` | `ThreeMetricCardLayout`、`FourColumnMatrixLayout` | `F-Data` | `content` |
| 5 | `MultiColumnComparisonPage` | `dual-wing-comparison`、`capability-pillar-matrix`、`metrics-taxonomy-matrix` | `DualWingLayout`、`ThreeColumnLayout`、`FourColumnMatrixLayout` | `B-DualWing`、`A-Column` | `content` |
| 6 | `EcosystemRelationshipPage` | `ecosystem-bridge`、`radial-capability-map` | `HubBridgeLayout` | `C-Hub` | `content` |
| 7 | `StrategyPanoramaPage` | `strategy-before-after`、`capability-pillar-matrix`、`opportunity-portfolio` | `DualWingLayout`、`ThreeZoneColumnLayout` | `B-DualWing`、`A-Column` | `content` |
| 8 | `StageEvolutionPage` | `maturity-stage-triple`、`parallel-stage-flow`、`capability-upgrade-ladder` | `StageFlowLayout`、`ProcessLayout` | `E-Process` | `content` |
| 9 | `DualCoreArchitecturePage` | `capability-engine-architecture`、`dual-track-evidence-kpi` | `DualChainLayout`、`ArchitectureLayout` | `B-DualWing` | `content` |
| 10 | `FormulaDecompositionPage` | `growth-flywheel-loop`、`funnel-conversion-story` | `RelationshipLayout`、`ProcessLayout` | `C-Hub`、`E-Process` | `content` |
| 11 | `CaseStudyPage` | `case-problem-solution-impact`、`case-journey-growth`、`screenshot-flow-kpi` | `CaseStudyLayout`、`CaseJourneyLayout` | `D-Case` | `content` |
| 12 | `ProcessFlowPage` | `parallel-stage-flow`、`funnel-conversion-story`、`case-journey-growth` | `ProcessLayout`、`StageFlowLayout` | `E-Process` | `content` |
| 13 | `CentralModelPage` | `radial-capability-map`、`capability-engine-architecture`、`growth-flywheel-loop` | `HubBridgeLayout` | `C-Hub` | `content` |
| 14 | `ShowcaseGalleryPage` | `media-gallery-edge-metrics`、`screenshot-flow-kpi` | `ShowcaseGalleryLayout` | `F-Data` | `content` |
| 15 | `TransformationPage` | `before-after-effect-compare`、`strategy-before-after` | `DualWingLayout` | `B-DualWing` | `content` |
| 16 | `CapabilityRoadmapPage` | `capability-evolution-roadmap`、`capability-upgrade-ladder`、`parallel-stage-flow` | `RoadmapLayout` | `E-Process` | `content` |
| 17 | `CapabilityMatrixPage` | `capability-pillar-matrix`、`metrics-taxonomy-matrix`、`radial-capability-map` | `FourColumnMatrixLayout`、`TaxonomyMatrixLayout` | `A-Column`、`C-Hub` | `content` |
| 18 | `ChartAnalysisPage` | `metric-story-triple`、`dual-track-evidence-kpi`、`decision-priority-map` | `ChartAnalysisLayout` | `F-Data` | `content` |
| 19 | `StructuredContentPage` | *(兜底，任何证据不足的内容页)* | `ColumnGridLayout`、`ThreeColumnLayout` | `A-Column` | `content` |
| 20 | `ClosingPage` | `closing-call-to-action` | `HeroLayout` | `HeroLayout` | `closing` |

---

## 2. 布局家族汇总

| 家族代号 | 包含的 layoutComponent |
|---------|----------------------|
| `HeroLayout` | `HeroLayout`（封面/封底专用）|
| `A-Column` | `ColumnGridLayout`、`ThreeColumnLayout`、`FourColumnMatrixLayout`、`ThreeZoneColumnLayout`、`ThreeColumnContentsLayout` |
| `B-DualWing` | `DualWingLayout`、`DualChainLayout`、`ArchitectureLayout` |
| `C-Hub` | `HubBridgeLayout`、`RelationshipLayout` |
| `D-Case` | `CaseStudyLayout`、`CaseJourneyLayout`、`EvidenceFlowLayout` |
| `E-Process` | `ProcessLayout`、`RoadmapLayout`、`StageFlowLayout` |
| `F-Data` | `ChartAnalysisLayout`、`ShowcaseGalleryLayout`、`TaxonomyMatrixLayout`、`MetricLayout` |

---

## 3. 跨文件一致性要求

本表维护规则：
1. 新增 `pageType` 必须同时更新：本表、`page_plan.schema.json #properties.pageType.enum`、`page_type_router.md`
2. 新增 `templateId` 必须同时更新：本表、`page_plan.schema.json #properties.templateId.enum`、`template_library.md §3`
3. 新增 `layoutComponent` 名称必须同时更新：本表第3列、`layout_selection.md §6.2 布局家族分组`
4. 当本表与其他文件冲突时，修改其他文件，本表保持稳定
5. 每次修改本表须更新版本号（文件顶部 V2.x.x）

---

## 4. 兜底路由规则

| 情景 | 路由结果 |
|-----|---------|
| 置信度 < 0.65 | → `StructuredContentPage` |
| 无法匹配任何 pageType | → `StructuredContentPage` |
| 模板容量不足触发拆页 | 拆页后每页独立重新路由 |
| 来源不确定（`provenanceType: user_prompt`） | → 可使用任意 pageType，但 `sourcePageRefs` 允许为空 |

---

## 5. 被废弃的 pageType（不得再使用）

| 废弃的 pageType | 替代 |
|--------------|-----|
| `HeroPage` | `CoverPage` 或 `SectionDividerPage` |
| `KpiPage` | `MetricOverviewPage` |
| `TimelinePage` | `CapabilityRoadmapPage` 或 `ProcessFlowPage` |
