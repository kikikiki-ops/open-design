# PPT Orchestrator HTML Skill

这是一个用于 HTML 型可编辑 PPT 的总控 Skill 包。

## 核心能力

- 草稿 PPT 内容理解
- 正式内容不改动、不缺失
- 编辑备注 / 占位符排除最终正文
- 页面类型自动路由
- 内容过多自动拆页
- 抽象组件能力调用
- 视觉风格 Skill 绑定
- HTML 型 PPT 输出契约
- 生成后质量检查

## 默认配置

- 输出：HTML 型 PPT
- 默认画布：3696 × 1008
- 物理尺寸：11m × 3m
- 默认风格：超宽大屏商务增长风格

## 文件结构

```text
ppt_orchestrator_html_skill/
  SKILL.md
  README.md
  metadata.json
  rules/
    content_preservation.md
    placeholder_rules.md
    page_type_router.md
    component_interface.md
    style_binding.md
    html_output_contract.md
    quality_check.md
    test_plan.md
  schemas/
    content_inventory.schema.json
    page_plan.schema.json
  examples/
    example_prompt.md
    page_plan_sample.json
```


## 背景图路由

本总控 Skill 已约定三类背景枚举：`cover`、`content`、`closing`。实际图片资产由视觉风格 Skill 提供。当前默认按用户上传顺序映射：第 1 张封面、第 2 张内容页、第 3 张封尾。

## 当前 Logo 方案

当前版本采用“背景图不带 Logo，Logo 独立组件渲染”。

SVG 源地址：

```text
https://p5-ad.adkwai.com/udata/pkg/ks-ad-fe/md-tools/quick-cut/6689:5117.b90a9c9d53932e9b.svg
```

封面 / 内容 / 封尾都显示 Logo。

## 新增：图片型 PPT 输入解析

本版本补充了 PPT 输入诊断与图片页解析规则。  
如果上传的 PPT 每页都是整页图片 / 截图，总控 Skill 不再直接尝试识别页面类型或生成 HTML，而是先要求建立 `content_inventory`。

新增文件：

```text
rules/ppt_input_intake.md
rules/image_slide_parsing.md
rules/content_inventory_precheck.md
schemas/intake_result.schema.json
examples/image_based_ppt_intake_example.json
```

这可以避免“把截图当背景直接复刻”“内容识别不完整”“页面类型误判为封面”等问题。
