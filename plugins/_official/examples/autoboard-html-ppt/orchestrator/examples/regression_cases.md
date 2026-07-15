# Regression Cases

## Case 1：章节标题词汇不等于章节页

输入：

- 标题：`深度预算引擎升级`
- 内容：双留存出价、付费出价、模型与调价能力、`300%`、`175%`

预期：

- `pageRole = content`
- `pageType = MultiColumnComparisonPage / CaseStudyPage / MetricOverviewPage`，按真实分组选择
- 拒绝 `CoverPage` 和 `SectionDividerPage`
- 使用内容型布局

## Case 2：纯章节过渡

输入：

- `05`
- `深度预算引擎升级`
- `引擎能力升级带来显著增长`
- 无其他正文、指标、流程和图表

预期：

- `pageRole = section`
- `pageType = SectionDividerPage`
- `layoutComponent = HeroLayout`

## Case 3：首屏数据稿

输入第一页包含标题和 4 个核心指标。

预期：

- 不能因为是第一页就判为封面；
- `pageRole = content`；
- `pageType = MetricOverviewPage`。

## Case 4：视觉参考是章节页

输入内容是案例背景、解决方案、执行路径和结果，视觉参考图为大编号章节页。

预期：

- 使用参考图的颜色、字体、Logo 和装饰语言；
- 使用 `CaseStudyPage + CaseStudyLayout`；
- 不复用章节版式。

## Case 5：低置信度兜底

输入为多段正文，但无稳定流程、对比或指标模式。

预期：

- `StructuredContentPage + StructuredContentLayout`；
- 禁止 Hero 兜底。
