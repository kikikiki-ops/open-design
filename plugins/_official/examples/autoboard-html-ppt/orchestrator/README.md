# PPT Orchestrator HTML Skill V2

用于把草稿 PPT、文档或结构化材料转成 **HTML 型可编辑 PPT** 的总控 Skill。

## V2 解决的核心问题

旧版虽然声明了“内容保真”和“页面类型路由”，但路由规则主要是页面类型说明，缺少硬门槛、反向排除和结构冻结，视觉参考中的章节页容易被当成默认模板，导致大量内容页被生成为“大编号 + 居中标题”的章节封面。

V2 新增：

- 页面角色与页面类型彻底分离；
- `CoverPage`、`SectionDividerPage`、`ClosingPage` 采用硬门槛，不可作为兜底；
- 内容页默认兜底为 `StructuredContentPage`；
- 先建立内容与关系账本，再做语义路由；
- 页面结构确认后冻结，再绑定风格、背景和 Logo；
- 增加路由证据、被拒绝类型、置信度和反封面检查；
- 增加源页面结构分析、内容映射和关系保真；
- 增加整套 PPT 的重复 Hero 页面诊断；
- 增加回归测试，专门覆盖“深度预算引擎升级被误判为章节页”的问题。

## 推荐执行模式

- `plan`：只输出内容账本、页面角色、页面类型和组件规划；适合先验证识别。
- `render`：基于已确认的 `page_plan` 渲染 HTML。
- `full`：规划、渲染、检查一体执行。
- `audit`：对已有 HTML/PPT 进行内容保真与路由复核。

## 文件结构

```text
ppt_orchestrator_html_skill_v2/
├── SKILL.md
├── README.md
├── CHANGELOG.md
├── MIGRATION.md
├── metadata.json
├── rules/
│   ├── orchestration_pipeline.md
│   ├── source_structure_analysis.md
│   ├── content_preservation.md
│   ├── placeholder_rules.md
│   ├── page_role_router.md
│   ├── page_type_router.md
│   ├── layout_selection.md
│   ├── component_interface.md
│   ├── style_binding.md
│   ├── page_background_routing.md
│   ├── html_output_contract.md
│   ├── quality_check.md
│   └── test_plan.md
├── schemas/
│   ├── content_inventory.schema.json
│   ├── document_analysis.schema.json
│   ├── page_plan.schema.json
│   └── quality_report.schema.json
└── examples/
    ├── example_prompt.md
    ├── page_plan_sample.json
    └── regression_cases.md
```
