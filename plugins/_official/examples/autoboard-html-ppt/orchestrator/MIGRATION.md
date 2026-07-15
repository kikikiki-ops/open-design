# 从 V1 升级到 V2

## 需要替换

建议完整替换旧包，不要只覆盖 `SKILL.md`，因为 V2 同时修改了页面路由、Schema、质量检查和组件接口。

## 主要字段变化

- `pageRole`：从 `cover | content | closing` 扩展为 `cover | section | content | closing`。
- `pageType`：新增 `SectionDividerPage`、`ChartAnalysisPage`、`StructuredContentPage`、`ClosingPage`。
- `GeneralStructuredPage`：替换为 `StructuredContentPage`，且明确为内容型兜底。
- `pagePlan`：新增 `routingEvidence`、`rejectedTypes`、`layoutComponent`、`contentMapping`、`structureFrozen`。
- `content_inventory`：新增 `sourceOrder`、`sourceBox`、`groupId`、`renderPolicy`、`relationTargets`。

## 组件接入注意

组件 Skill 暂未完成时，可继续使用语义化 HTML 兜底；完成后按 `layoutComponent + requiredCapabilities` 映射真实 React 组件。
