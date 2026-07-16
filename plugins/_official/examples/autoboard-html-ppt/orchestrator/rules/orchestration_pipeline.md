# Orchestration Pipeline

## 1. 输入接收（必须先于规划）

当当前项目、对话或附件含 `.pptx` 时，必须先读取 `ppt_input_intake.md` 并执行：

1. 定位来源 PPTX，且不覆盖它；
2. 逐页分类 `editable_slide`、`image_based_slide`、`mixed_slide` 或 `unknown_slide`；
3. 对图片型或混合页完成视觉解析、OCR 与内容账本；
4. 产出 `intake_result.json`；
5. 对 `blocked` 页面停止渲染并标记原因，禁止静默遗漏或用通用 Hero 页面替代。

无 PPTX 时才可进入纯内容生成路径。用户说“优化 PPT”时，禁止把任务降级为无来源的新建演示。

## 2. 两阶段生成

### Planner Pass

完成：内容抽取、结构分析、角色路由、页面类型、拆页、布局选择、内容映射和规划检查。

Planner Pass 结束时，必须设置：

```json
{"structureFrozen": true}
```

未通过规划检查时不得进入 Renderer Pass。

### Renderer Pass

只能读取冻结后的计划，完成组件映射、风格绑定、背景与 Logo 渲染、HTML 输出和终检。

Renderer Pass 不得重新选择 Hero / 内容页类型，不得减少 `contentRefs`。

## 3. 失败恢复

按以下顺序：

1. 调整内容分组；
2. 更换同一页面类型的布局变体；
3. 选择更准确的内容型页面类型；
4. 拆页；
5. 标记待人工确认。

不得通过删除正式内容或切换为低容量 Hero 页面解决。
