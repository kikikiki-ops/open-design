# Developer Conference Template Library

## 1. Purpose and use

This library extends AutoBoard HTML PPT from the structural patterns in
`快手联盟 — 开发者大会PPT 线稿V2-20260714`. It is a reusable planning library,
not a page-by-page tracing guide.

Every selected template is planned through three layers:

```text
Page Layout        -> page regions and shared alignment anchors
Content Pattern    -> the semantic relationship between source content
Reusable Component -> editable modules rendered inside the regions
```

The planner must route `pageType` first, then choose `templateId` only when
the source evidence, content capacity, and required slots match. `fallbackTemplates`
are content layouts, never Hero layouts used to hide a mismatch.

## 2. Common template contract

Each template below defines the following required fields:

- `templateId`: stable machine-readable identifier.
- `family`: layout family, used after semantic page routing.
- `primaryPattern`: first-choice content relationship.
- `secondaryPatterns`: compatible but less-preferred relationships.
- `requiredSlots`: semantic regions that must receive mapped source content.
- `optionalSlots`: regions rendered only with source evidence.
- `allowedComponents`: components permitted for the template.
- `contentCapacity`: maximum meaningful payload before a split is required.
- `wideVariant`: rules for a normal wide composition; this is not the delivery canvas.
- `ultrawideVariant`: the 3696 x 1008 / 11:3 delivery composition.
- `fallbackTemplates`: safe content-oriented alternatives.
- `prohibitedUses`: semantic or visual misuse that must fail planning.

### Shared 11:3 adaptation rules

The delivery canvas is always `3696 x 1008`. A 2.67:1 reference layout must
never be expanded horizontally by scaling its cards, screenshots, charts, or
images. The ultrawide variant must use one or more of the following instead:

1. enlarge the gaps between independent modules;
2. lengthen a process or relationship track with more breathing room;
3. add an evidence, summary, or navigation sidebar when source content exists;
4. allocate more width to charts, media, or relationship diagrams;
5. preserve each card and image aspect ratio and cap its readable line length.

All visual modules remain inside the `220px` horizontal and `90px` vertical
safe areas. The outer ultrawide expansion belongs to tracks, gaps, sidebars,
and chart domains, never image distortion or arbitrary empty space.

## 3. Template catalog

### cover-centered-hero

- `templateId`: `cover-centered-hero`
- `family`: `HeroLayout`
- `primaryPattern`: event theme and one declarative promise.
- `secondaryPatterns`: joint-brand launch; keynote title.
- `requiredSlots`: `brand`, `title`.
- `optionalSlots`: `subtitle`, `eventMeta`, `speaker`, `partnerMarks`.
- `allowedComponents`: `FixedBrandLogo`, `TopBrandBar`, `SectionEyebrow`, `HeroTitle`, `HeroSubtitle`, `BackgroundFlow`.
- `contentCapacity`: one title of at most two lines, one subtitle, and up to two brand marks.
- `wideVariant`: centered title with balanced side atmosphere.
- `ultrawideVariant`: keep title within the central 42% of the canvas; extend only background flow and title-to-edge breathing room.
- `fallbackTemplates`: `agenda-chapter-columns`, `metric-story-triple`.
- `prohibitedUses`: metrics, charts, agenda detail, case evidence, or any content page.

### agenda-chapter-columns

- `templateId`: `agenda-chapter-columns`
- `family`: `AgendaLayout`
- `primaryPattern`: numbered agenda or chapter navigation.
- `secondaryPatterns`: program timeline; chapter overview.
- `requiredSlots`: `title`, `chapters`.
- `optionalSlots`: `eventMeta`, `chapterDescriptions`, `timeRange`.
- `allowedComponents`: `FixedBrandLogo`, `PageTitle`, `AgendaColumn`, `ChapterNumber`, `DividerRail`, `PageFooter`.
- `contentCapacity`: 3 to 5 chapters; each chapter has one title and one short descriptor.
- `wideVariant`: equal chapter columns around a centered title.
- `ultrawideVariant`: add column gaps and a full-height separator rail; do not widen chapter cards beyond readable text width.
- `fallbackTemplates`: `parallel-stage-flow`, `capability-evolution-roadmap`.
- `prohibitedUses`: detailed strategies, KPI-heavy pages, or ungrouped bullet inventories.

### metric-story-triple

- `templateId`: `metric-story-triple`
- `family`: `MetricLayout`
- `primaryPattern`: three outcome metrics tell one conclusion.
- `secondaryPatterns`: goal-progress-result; three proof points.
- `requiredSlots`: `title`, `metrics`.
- `optionalSlots`: `insight`, `sourceNote`, `metricLabels`.
- `allowedComponents`: `PageTitle`, `MetricHero`, `MetricBlock`, `MetricRail`, `DeltaBadge`, `ConclusionTag`.
- `contentCapacity`: exactly 3 metrics, each with value, unit, and one label; one conclusion.
- `wideVariant`: three equal metric blocks on a common baseline.
- `ultrawideVariant`: preserve metric block width, add generous outer gutters and a dedicated conclusion rail instead of stretching blocks.
- `fallbackTemplates`: `dual-track-evidence-kpi`, `screenshot-flow-kpi`.
- `prohibitedUses`: metrics belonging to unrelated categories, dense tabular data, or metric cards with long narratives.

### metrics-taxonomy-matrix

- `templateId`: `metrics-taxonomy-matrix`
- `family`: `TaxonomyMatrixLayout`
- `primaryPattern`: metrics grouped by taxonomy or business dimension.
- `secondaryPatterns`: category comparison; multi-axis KPI overview.
- `requiredSlots`: `title`, `taxonomy`, `metrics`.
- `optionalSlots`: `legend`, `summary`, `sourceNote`.
- `allowedComponents`: `PageTitle`, `TaxonomyHeader`, `MatrixCell`, `MetricBlock`, `Legend`, `SummaryBar`.
- `contentCapacity`: 3 to 5 categories and 2 to 4 metrics per category; split beyond 16 metric cells.
- `wideVariant`: compact matrix with common row and column tracks.
- `ultrawideVariant`: widen label columns and metric domains, retain shared grid tracks, and use a summary sidebar only when evidence exists.
- `fallbackTemplates`: `capability-pillar-matrix`, `metric-story-triple`.
- `prohibitedUses`: arbitrary card grids, unaligned lists, or prose-heavy category explanations.

### ecosystem-bridge

- `templateId`: `ecosystem-bridge`
- `family`: `HubBridgeLayout`
- `primaryPattern`: two ecosystems connected by a platform, mechanism, or value exchange.
- `secondaryPatterns`: stakeholder bridge; supply-demand collaboration.
- `requiredSlots`: `title`, `leftSystem`, `bridge`, `rightSystem`.
- `optionalSlots`: `exchangeLabels`, `proofMetrics`, `legend`.
- `allowedComponents`: `PageTitle`, `SystemCluster`, `BridgeCore`, `Connector`, `ConnectorLabel`, `MetricRail`.
- `contentCapacity`: 2 systems, 1 bridge, and up to 4 entities per system.
- `wideVariant`: left cluster, central bridge, right cluster.
- `ultrawideVariant`: extend horizontal connector tracks and cluster spacing; never scale entity cards to fill the extra width.
- `fallbackTemplates`: `strategy-before-after`, `dual-wing-comparison`.
- `prohibitedUses`: chronological flows, more than two independent ecosystems, or a simple three-card comparison.

### strategy-before-after

- `templateId`: `strategy-before-after`
- `family`: `TransformationLayout`
- `primaryPattern`: current state to target state through an explicit strategic action.
- `secondaryPatterns`: pain point to solution; legacy to upgraded capability.
- `requiredSlots`: `title`, `before`, `action`, `after`.
- `optionalSlots`: `proofMetrics`, `riskNote`, `transitionLabel`.
- `allowedComponents`: `PageTitle`, `StatePanel`, `TransformationArrow`, `MechanismCard`, `MetricBlock`.
- `contentCapacity`: one before state, one action cluster of up to 3 moves, one after state, and up to 3 proof metrics.
- `wideVariant`: before/action/after in three anchored regions.
- `ultrawideVariant`: lengthen the transition corridor and add a proof-metric rail; state panels retain equal visual weight.
- `fallbackTemplates`: `dual-wing-comparison`, `case-problem-solution-impact`.
- `prohibitedUses`: multi-stage roadmaps, unrelated feature lists, or a result-only KPI page.

### capability-engine-architecture

- `templateId`: `capability-engine-architecture`
- `family`: `ArchitectureLayout`
- `primaryPattern`: layered engine, inputs, capabilities, and outcomes.
- `secondaryPatterns`: operating system architecture; capability stack.
- `requiredSlots`: `title`, `engineCore`, `capabilityLayers`, `outputs`.
- `optionalSlots`: `inputs`, `governance`, `metrics`, `legend`.
- `allowedComponents`: `PageTitle`, `EngineCore`, `CapabilityLayer`, `InputNode`, `OutputNode`, `Connector`, `Legend`.
- `contentCapacity`: 1 core, 2 to 4 layers, and up to 5 outputs; split if layers exceed 4.
- `wideVariant`: central core with symmetric layers and output rail.
- `ultrawideVariant`: expand horizontal system tracks and output domain; layer height and node proportions stay fixed.
- `fallbackTemplates`: `radial-capability-map`, `capability-pillar-matrix`.
- `prohibitedUses`: a strict chronological journey, screenshot evidence, or prose-only strategic narrative.

### case-problem-solution-impact

- `templateId`: `case-problem-solution-impact`
- `family`: `CaseStudyLayout`
- `primaryPattern`: a single case moves from problem through solution to measurable impact.
- `secondaryPatterns`: challenge-action-result; background-method-outcome.
- `requiredSlots`: `title`, `problem`, `solution`, `impact`.
- `optionalSlots`: `brand`, `evidence`, `quotes`, `metrics`.
- `allowedComponents`: `PageTitle`, `CaseContextPanel`, `ProblemCard`, `SolutionMechanism`, `ImpactMetricRail`, `Connector`, `EvidenceNote`.
- `contentCapacity`: one case, 1 to 3 problem facts, 1 to 3 solution actions, 2 to 4 impact metrics.
- `wideVariant`: three connected regions with impact emphasized.
- `ultrawideVariant`: allocate the additional width to a case-evidence side rail and connector distance, not taller text cards.
- `fallbackTemplates`: `case-journey-growth`, `screenshot-flow-kpi`.
- `prohibitedUses`: multiple unrelated cases, a generic strategy panorama, or a metric-only overview.

### case-journey-growth

- `templateId`: `case-journey-growth`
- `family`: `CaseJourneyLayout`
- `primaryPattern`: a case grows through sequential operational or user journey stages.
- `secondaryPatterns`: campaign lifecycle; adoption journey.
- `requiredSlots`: `title`, `stages`, `growthOutcome`.
- `optionalSlots`: `stageEvidence`, `metrics`, `caseContext`.
- `allowedComponents`: `PageTitle`, `JourneyStage`, `StageRail`, `JourneyConnector`, `CaseContextPanel`, `OutcomeMetric`.
- `contentCapacity`: 3 to 5 stages, one outcome cluster, and one concise evidence note per stage.
- `wideVariant`: sequential stage rail and terminal growth outcome.
- `ultrawideVariant`: extend stage spacing and connector length; use evidence under each stage rather than enlarging stage cards.
- `fallbackTemplates`: `parallel-stage-flow`, `capability-evolution-roadmap`.
- `prohibitedUses`: non-sequential category lists, side-by-side state comparison, or many unrelated proof images.

### screenshot-flow-kpi

- `templateId`: `screenshot-flow-kpi`
- `family`: `EvidenceFlowLayout`
- `primaryPattern`: product or campaign screenshots prove a flow and its KPI result.
- `secondaryPatterns`: UI walkthrough; product mechanism to business proof.
- `requiredSlots`: `title`, `screenshots`, `flow`, `kpis`.
- `optionalSlots`: `annotations`, `caseContext`, `sourceNote`.
- `allowedComponents`: `PageTitle`, `ScreenshotFrame`, `ScreenshotAnnotation`, `FlowNode`, `Connector`, `MetricRail`.
- `contentCapacity`: 2 to 4 screenshots, 2 to 5 flow steps, and 2 to 4 KPIs.
- `wideVariant`: media flow on one axis and KPI rail on the other.
- `ultrawideVariant`: reserve extra width for screenshots and connective tracks while preserving each screenshot aspect ratio; KPI rail remains a separate aligned region.
- `fallbackTemplates`: `media-gallery-edge-metrics`, `case-problem-solution-impact`.
- `prohibitedUses`: invented screenshots, decorative media without evidence, or a text-only process.

### maturity-stage-triple

- `templateId`: `maturity-stage-triple`
- `family`: `StageEvolutionLayout`
- `primaryPattern`: exactly three maturity stages with increasing capability or value.
- `secondaryPatterns`: past-present-future; basic-advanced-leading.
- `requiredSlots`: `title`, `stages`.
- `optionalSlots`: `stageMetrics`, `transitionLabels`, `summary`.
- `allowedComponents`: `PageTitle`, `StageCard`, `StageNumber`, `StageConnector`, `MetricBlock`, `SummaryBar`.
- `contentCapacity`: exactly 3 stages; up to 3 attributes per stage.
- `wideVariant`: three equal stage tracks with directional progression.
- `ultrawideVariant`: distribute additional width between stages and transitions, keep cards on one shared top and bottom baseline.
- `fallbackTemplates`: `parallel-stage-flow`, `capability-evolution-roadmap`.
- `prohibitedUses`: more than 3 stages, unsequenced pillars, or a before-after transformation with only 2 states.

### radial-capability-map

- `templateId`: `radial-capability-map`
- `family`: `CentralModelLayout`
- `primaryPattern`: a central capability or platform connects to several coordinated capabilities.
- `secondaryPatterns`: operating model; hub-and-spoke system.
- `requiredSlots`: `title`, `core`, `capabilities`.
- `optionalSlots`: `outerEvidence`, `legend`, `metrics`.
- `allowedComponents`: `PageTitle`, `CapabilityRing`, `CoreNode`, `OrbitNode`, `RadialConnector`, `Legend`.
- `contentCapacity`: one core and 4 to 8 capability nodes; split beyond 8.
- `wideVariant`: center hub with balanced radial perimeter.
- `ultrawideVariant`: use an oval spatial field and place evidence rails on the outer left/right; do not horizontally scale the circular core or orbit nodes.
- `fallbackTemplates`: `capability-engine-architecture`, `capability-pillar-matrix`.
- `prohibitedUses`: linear chronology, a category matrix, or a two-sided comparison.

### media-gallery-edge-metrics

- `templateId`: `media-gallery-edge-metrics`
- `family`: `ShowcaseGalleryLayout`
- `primaryPattern`: media gallery is primary evidence, while metrics sit on a stable edge rail.
- `secondaryPatterns`: campaign creative showcase; content proof wall.
- `requiredSlots`: `title`, `media`, `metrics`.
- `optionalSlots`: `captions`, `caseContext`, `insight`.
- `allowedComponents`: `PageTitle`, `MediaFrame`, `MediaStrip`, `MediaCaption`, `MetricRail`, `ConclusionTag`.
- `contentCapacity`: 3 to 8 media items, 2 to 4 metrics, and one short conclusion.
- `wideVariant`: gallery-first composition with metric edge rail.
- `ultrawideVariant`: add gallery columns or media breathing room and keep the metric rail fixed-width; never stretch media frames.
- `fallbackTemplates`: `screenshot-flow-kpi`, `case-problem-solution-impact`.
- `prohibitedUses`: charts as the primary proof, media without captions/evidence, or more than 8 primary images.

### dual-wing-comparison

- `templateId`: `dual-wing-comparison`
- `family`: `DualWingLayout`
- `primaryPattern`: two peer systems, audiences, or approaches compare around a shared criterion.
- `secondaryPatterns`: supply-demand comparison; old-new capability comparison.
- `requiredSlots`: `title`, `leftWing`, `rightWing`.
- `optionalSlots`: `sharedAxis`, `bridge`, `metrics`, `conclusion`.
- `allowedComponents`: `PageTitle`, `WingPanel`, `ComparisonAxis`, `Connector`, `MetricBlock`, `ConclusionTag`.
- `contentCapacity`: two wings with 2 to 4 aligned rows each; one shared conclusion.
- `wideVariant`: symmetric left and right panels with one central axis.
- `ultrawideVariant`: expand the central comparison corridor and common axis; wing cards keep shared row tracks and equal inner width.
- `fallbackTemplates`: `strategy-before-after`, `dual-track-evidence-kpi`.
- `prohibitedUses`: more than two peer entities, sequential processes, or a taxonomy matrix.

### dual-track-evidence-kpi

- `templateId`: `dual-track-evidence-kpi`
- `family`: `DualTrackLayout`
- `primaryPattern`: two corresponding evidence tracks lead to shared KPI proof.
- `secondaryPatterns`: channel comparison; two-path validation.
- `requiredSlots`: `title`, `leftTrack`, `rightTrack`, `kpis`.
- `optionalSlots`: `trackLabels`, `connectorLabels`, `conclusion`.
- `allowedComponents`: `PageTitle`, `EvidenceTrack`, `EvidenceNode`, `RowConnector`, `MetricRail`, `ConclusionTag`.
- `contentCapacity`: 2 tracks, 2 to 4 aligned evidence rows each, and 2 to 4 KPIs.
- `wideVariant`: parallel tracks with an aligned KPI end region.
- `ultrawideVariant`: allocate width to row tracks and the KPI domain; corresponding rows share exact vertical anchors.
- `fallbackTemplates`: `dual-wing-comparison`, `metric-story-triple`.
- `prohibitedUses`: unmatched evidence lists, a single-track process, or cards whose only difference is content length.

### parallel-stage-flow

- `templateId`: `parallel-stage-flow`
- `family`: `ProcessLayout`
- `primaryPattern`: several workstreams move through the same stages in parallel.
- `secondaryPatterns`: operating flow; phased execution plan.
- `requiredSlots`: `title`, `stages`, `tracks`.
- `optionalSlots`: `stageMetrics`, `handoffs`, `legend`.
- `allowedComponents`: `PageTitle`, `StageHeader`, `FlowTrack`, `FlowNode`, `RowConnector`, `Legend`.
- `contentCapacity`: 3 to 5 stages and 2 to 4 parallel tracks; split beyond 20 nodes.
- `wideVariant`: column stage headers and row workstream tracks.
- `ultrawideVariant`: use the added width to lengthen stage columns and handoff tracks while preserving shared rows and columns.
- `fallbackTemplates`: `case-journey-growth`, `capability-evolution-roadmap`.
- `prohibitedUses`: unmatched stages between tracks, a radial relationship map, or a simple three-card story.

### capability-evolution-roadmap

- `templateId`: `capability-evolution-roadmap`
- `family`: `RoadmapLayout`
- `primaryPattern`: capability milestones accumulate toward a future state.
- `secondaryPatterns`: product evolution; strategic construction path.
- `requiredSlots`: `title`, `milestones`.
- `optionalSlots`: `timeRange`, `proofMetrics`, `futureState`, `dependencies`.
- `allowedComponents`: `PageTitle`, `RoadmapStage`, `MilestoneNode`, `RoadmapConnector`, `FutureStateCard`, `MetricBlock`.
- `contentCapacity`: 3 to 7 milestones, each with one title and two short proof points.
- `wideVariant`: left-to-right chronological milestone path.
- `ultrawideVariant`: extend the roadmap path and milestone intervals; reserve a terminal future-state panel rather than widening nodes.
- `fallbackTemplates`: `parallel-stage-flow`, `maturity-stage-triple`.
- `prohibitedUses`: a non-chronological capability taxonomy, a two-state comparison, or unsequenced feature inventory.

### opportunity-portfolio

- `templateId`: `opportunity-portfolio`
- `family`: `PortfolioLayout`
- `primaryPattern`: opportunities positioned by two business dimensions and prioritized by action.
- `secondaryPatterns`: initiative prioritization; market opportunity map.
- `requiredSlots`: `title`, `axes`, `opportunities`.
- `optionalSlots`: `priorityLegend`, `recommendedActions`, `metrics`.
- `allowedComponents`: `PageTitle`, `PortfolioGrid`, `AxisLabel`, `OpportunityBubble`, `PriorityLegend`, `ActionCallout`.
- `contentCapacity`: 4 to 12 opportunities across a two-axis grid; one priority action per quadrant.
- `wideVariant`: central two-axis portfolio with side recommendation panel.
- `ultrawideVariant`: expand plot width and keep a dedicated action sidebar; bubbles keep semantic size, not horizontal scale.
- `fallbackTemplates`: `metrics-taxonomy-matrix`, `capability-pillar-matrix`.
- `prohibitedUses`: unmeasured lists, a detailed chronological plan, or a categorical matrix without meaningful axes.

### capability-pillar-matrix

- `templateId`: `capability-pillar-matrix`
- `family`: `TaxonomyMatrixLayout`
- `primaryPattern`: capability pillars each contain aligned sub-capabilities and evidence.
- `secondaryPatterns`: product capability overview; operating pillar map.
- `requiredSlots`: `title`, `pillars`.
- `optionalSlots`: `pillarMetrics`, `sharedFoundation`, `legend`, `summary`.
- `allowedComponents`: `PageTitle`, `PillarHeader`, `CapabilityCell`, `FoundationBar`, `MetricBlock`, `SummaryBar`.
- `contentCapacity`: 3 to 5 pillars with up to 4 sub-capabilities each.
- `wideVariant`: equal pillar columns over a shared foundation.
- `ultrawideVariant`: increase inter-pillar gaps and foundation span; preserve equal column tracks and readable cell width.
- `fallbackTemplates`: `capability-engine-architecture`, `metrics-taxonomy-matrix`.
- `prohibitedUses`: chronology, an unstructured icon wall, or unrelated cards without a pillar taxonomy.

### closing-call-to-action

- `templateId`: `closing-call-to-action`
- `family`: `HeroLayout`
- `primaryPattern`: a closing invitation, next action, or thank-you statement.
- `secondaryPatterns`: Q&A; collaboration invitation.
- `requiredSlots`: `brand`, `closingMessage`.
- `optionalSlots`: `callToAction`, `contact`, `qrCode`, `eventMeta`.
- `allowedComponents`: `FixedBrandLogo`, `ClosingTitle`, `CallToAction`, `ContactBlock`, `QrCodeFrame`, `BackgroundFlow`.
- `contentCapacity`: one closing message, one CTA, and one contact or QR code.
- `wideVariant`: centered closing message with one supporting action.
- `ultrawideVariant`: keep the message in the center and place optional contact/QR in a narrow right-side action bay; only the atmosphere extends outward.
- `fallbackTemplates`: `cover-centered-hero`, `agenda-chapter-columns`.
- `prohibitedUses`: formal business proof, multiple metrics, detailed agenda, or complex case content.

### growth-flywheel-loop

- `templateId`: `growth-flywheel-loop`
- `family`: `RelationshipLayout`
- `primaryPattern`: documented actions form a closed feedback loop around one outcome.
- `secondaryPatterns`: operating flywheel; repeatable growth mechanism.
- `requiredSlots`: `title`, `loopNodes`, `feedbackEvidence`.
- `optionalSlots`: `coreOutcome`, `nodeMetrics`, `loopNote`.
- `allowedComponents`: `PageTitle`, `LoopCore`, `LoopNode`, `ArcConnector`, `LoopOutcome`, `Legend`.
- `contentCapacity`: 3 to 6 loop nodes, one short fact per node, and one evidenced feedback relation.
- `wideVariant`: a readable central loop with short external evidence labels.
- `ultrawideVariant`: preserve loop proportions; use side evidence rails and wider connector corridors instead of enlarging the ring.
- `fallbackTemplates`: `parallel-stage-flow`, `capability-evolution-roadmap`.
- `prohibitedUses`: linear processes, feature lists, or a loop whose final node has no evidenced return relation.

### capability-upgrade-ladder

- `templateId`: `capability-upgrade-ladder`
- `family`: `RoadmapLayout`
- `primaryPattern`: capabilities progress through ordered maturity or upgrade stages.
- `secondaryPatterns`: current-to-target capability path; operating-model evolution.
- `requiredSlots`: `title`, `stages`, `stageOrder`.
- `optionalSlots`: `readinessMetrics`, `foundation`, `upgradeDependencies`, `futureState`.
- `allowedComponents`: `PageTitle`, `CapabilityLevel`, `UpgradeVector`, `ReadinessMetric`, `FoundationBar`, `FutureStateCard`.
- `contentCapacity`: 3 to 5 stages, each with at most three proof points.
- `wideVariant`: equal ordered stage columns with a common upgrade vector.
- `ultrawideVariant`: lengthen the vector and stage gaps; retain equal stage tracks and reserve a narrow dependency rail when source evidence exists.
- `fallbackTemplates`: `capability-evolution-roadmap`, `maturity-stage-triple`.
- `prohibitedUses`: unordered capability taxonomies, made-up scoring, or two unrelated state descriptions.

### before-after-effect-compare

- `templateId`: `before-after-effect-compare`
- `family`: `DualWingLayout`
- `primaryPattern`: same-object baseline and target state with documented effects.
- `secondaryPatterns`: optimization result; intervention comparison.
- `requiredSlots`: `title`, `baseline`, `target`.
- `optionalSlots`: `intervention`, `deltaMetrics`, `methodNote`, `evidenceMedia`.
- `allowedComponents`: `PageTitle`, `BaselinePanel`, `DeltaBridge`, `TargetPanel`, `EffectMetric`, `ComparisonAxis`, `MediaFrame`.
- `contentCapacity`: one comparison and up to four aligned metrics or evidence rows.
- `wideVariant`: balanced before/after panels with an explicit central delta bridge.
- `ultrawideVariant`: extend outer evidence rails and the central connector corridor; panels stay matched in height and row tracks.
- `fallbackTemplates`: `strategy-before-after`, `dual-wing-comparison`.
- `prohibitedUses`: mismatched entities, time periods, units, or a comparison without a known baseline.

### funnel-conversion-story

- `templateId`: `funnel-conversion-story`
- `family`: `ProcessLayout`
- `primaryPattern`: ordered stages have documented quantities, conversion, or drop-off relations.
- `secondaryPatterns`: acquisition journey; adoption path.
- `requiredSlots`: `title`, `stages`.
- `optionalSlots`: `stageValues`, `conversionRates`, `dropoffReasons`, `outcome`.
- `allowedComponents`: `PageTitle`, `FunnelStage`, `ConversionLabel`, `DropoffCallout`, `FunnelOutcome`, `MetricRail`.
- `contentCapacity`: 3 to 6 stages with one value or factual relationship per stage.
- `wideVariant`: horizontal stage funnel with values directly attached to each stage.
- `ultrawideVariant`: widen stage intervals and attach evidence above or below; widths remain semantic and cannot be stretched to imitate value.
- `fallbackTemplates`: `parallel-stage-flow`, `case-journey-growth`.
- `prohibitedUses`: unordered lists, unknown conversion facts, or decorative unequal-width shapes.

### decision-priority-map

- `templateId`: `decision-priority-map`
- `family`: `StructuredContentLayout`
- `primaryPattern`: explicit conditions route to outcomes, or two sourced dimensions prioritize objects.
- `secondaryPatterns`: decision policy; risk response; initiative prioritization.
- `requiredSlots`: `title`, `decisionFacts`.
- `optionalSlots`: `axes`, `branchRules`, `outcomes`, `priorityLegend`, `actions`.
- `allowedComponents`: `PageTitle`, `DecisionNode`, `DecisionBranch`, `OutcomeLeaf`, `HeatmapGrid`, `RiskCell`, `AxisLabel`, `PriorityLegend`, `RuleNote`.
- `contentCapacity`: decision tree of 2 to 3 levels and up to 8 leaves, or a 2 x 2 to 5 x 5 priority grid with up to 12 markers.
- `wideVariant`: central decision or grid region with a compact rule/action side rail.
- `ultrawideVariant`: expand the decision corridor or plot domain while preserving branch angles, grid cells, and a dedicated legend/action sidebar.
- `fallbackTemplates`: `decision-table`, `opportunity-portfolio`.
- `prohibitedUses`: inferred conditions, invented risk coordinates, or using both a tree and heatmap without source evidence for both structures.

## 4. Component categories

### Metrics

`MetricHero`, `MetricBlock`, `MetricRail`, `DeltaBadge`, `OutcomeMetric`, `KpiStrip`, `SummaryBar`.

Use for values, units, deltas, targets, and concise result claims. Metric components must preserve the original number, unit, condition, and source note.

### Charts

`TrendChart`, `BarChart`, `PortfolioGrid`, `RadialChart`, `Legend`, `AxisLabel`, `ChartAnnotation`.

Use only when source data establishes a quantitative relationship. Never fabricate data points, axes, or comparative conclusions.

### FlowAndRelationship

`FlowNode`, `FlowTrack`, `JourneyStage`, `StageRail`, `Connector`, `RowConnector`, `RadialConnector`, `ComparisonAxis`, `BridgeCore`.

Use for chronology, dependency, handoff, cause-effect, and ecosystem relationships. Connectors must join the centers of their actual source and target modules.

### AdvancedRelation

`LoopCore`, `LoopNode`, `ArcConnector`, `LoopOutcome`, `CapabilityLevel`, `UpgradeVector`,
`ReadinessMetric`, `BaselinePanel`, `DeltaBridge`, `TargetPanel`, `EffectMetric`,
`FunnelStage`, `ConversionLabel`, `DropoffCallout`, `DecisionNode`, `DecisionBranch`,
`OutcomeLeaf`, `HeatmapGrid`, `RiskCell`, `KpiTowerHero`, `WaterfallStep`.

Use only when `advancedRelationSpec` proves the semantic relation, source facts and required
geometry. See `advanced_relation_components.md`; missing facts require a fallback template.

### CaseAndEvidence

`CaseContextPanel`, `ProblemCard`, `SolutionMechanism`, `ScreenshotFrame`, `MediaFrame`, `EvidenceTrack`, `EvidenceNote`, `ImpactMetricRail`.

Use only for a documented case or supplied visual evidence. Screenshots and media keep their native aspect ratio and need a mapped evidence caption.

### TaxonomyAndMatrix

`TaxonomyHeader`, `MatrixCell`, `PillarHeader`, `CapabilityCell`, `CapabilityLayer`, `FoundationBar`, `PortfolioGrid`, `PriorityLegend`.

Use for categorical, pillar, matrix, or two-axis portfolio structures. A matrix must use shared parent-controlled row and column tracks.

### PageChrome

`SlideBackground`, `FixedBrandLogo`, `TopBrandBar`, `SectionEyebrow`, `PageTitle`, `PageFooter`, `BackgroundFlow`, `DividerRail`.

Use for repeated page framing only. Page chrome cannot carry formal content that should be mapped to a required content slot.

## 5. Planner output

Every content page must include the selected template and adaptation evidence:

```json
{
  "templateId": "case-problem-solution-impact",
  "templateSelection": {
    "primaryPatternMatch": ["same case contains a problem, action, and result"],
    "slotCoverage": ["problem", "solution", "impact"],
    "canvasVariant": "ultrawideVariant",
    "adaptationActions": ["expanded connector corridor", "reserved evidence side rail"],
    "rejectedTemplates": ["metric-story-triple"]
  }
}
```

If no catalog template has full required-slot coverage, use `StructuredContentPage` with a semantic layout and record the missing component requirement. Do not force the nearest visual template.
