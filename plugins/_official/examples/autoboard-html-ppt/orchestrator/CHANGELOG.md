# Changelog

## 2.0.0 — 2026-07-15

### 修复

- 修复章节参考页被当成全局默认页面结构的问题。
- 修复页面角色与页面类型混用导致的封面/章节页误路由。
- 修复 `SectionPage`、`ClosingPage` 在背景规则中出现、但未进入统一页面类型 Schema 的不一致。
- 修复旧版 `GeneralStructuredPage` 兜底规则过弱，仍可能被视觉模板覆盖的问题。
- 修复内容账本缺少坐标、分组、关系目标和渲染策略，导致只提取标题、不理解正文结构的问题。

### 新增

- 页面角色硬门槛与负向排除规则。
- 语义特征分析与路由证据。
- `SectionDividerPage`、`ChartAnalysisPage`、`StructuredContentPage`、`ClosingPage`。
- 结构冻结 `structureFrozen`，风格只能在冻结后绑定。
- 页面内容区域映射 `contentMapping`。
- 关系保真与唯一来源绑定检查。
- 整套 PPT 的 Hero/章节页滥用诊断。
- 规划、渲染、审计四种执行模式。
