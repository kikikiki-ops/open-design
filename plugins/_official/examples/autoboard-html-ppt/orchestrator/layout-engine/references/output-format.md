# 输出格式规范

所有 position 和 size 均为百分比。渲染时按 `实际像素 = 百分比 × 内容区域像素` 换算。

## 完整页面结构

```yaml
page:
  id: page_01
  canvas_ratio: 3.67

  type: <模板类型>
  purpose: <一句话页面目的>

  # ── 信息层级 ──
  title:
    text: "<L0 主标题>"
    level: L0
    zone: header

  subtitle:
    text: "<L1 核心结论>"
    level: L1
    zone: header

  # ── 页面区域比例 ──
  zones:
    header_height: 15%    # 根据内容量调整
    main_height: 73%
    footer_height: 12%

  # ── 布局 ──
  layout:
    direction: horizontal
    columns: <列数>
    column_ratio: "<比例字符串>"
    column_gap: 1.5%

    # 可选：列内嵌套子布局
    sub_layouts:
      - column: 1          # 第几列
        direction: vertical
        rows: 2
        row_ratio: "2:3"   # 上下子区域比例
        row_gap: 2%

  # ── 模块 ──
  modules:
    - id: <module_id>
      type: <组件类型>
      column: <所在列序号>        # 1-based
      row: <所在行序号>           # 仅嵌套布局时
      position:
        x: <起始 x 百分比>
        y: <起始 y 百分比>
        width: <宽度百分比>
        height: <高度百分比>
      hierarchy:                   # 每个字段必须标注层级
        <字段名>: <L0-L5>
      content:
        <字段名>: "<值>"
      icon:
        library: lucide
        name: <图标名>
        source: https://lucide.dev/icons/<slug>
        semantic_role: <语义角色>

  # ── 底部 ──
  footer:
    type: conclusion_bar
    position:
      x: 0%
      y: 0%
      width: 100%
      height: 100%
    text: "<L1 或 L2 结论>"

  style_tokens:
    inherit_from: global_style
```

## 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| id | 是 | 页面唯一标识 |
| canvas_ratio | 是 | 固定 3.67 |
| type | 是 | 模板类型 |
| purpose | 是 | 一句话页面目的 |
| title | 是 | L0 主标题 |
| subtitle | 否 | L1 核心结论 |
| zones | 是 | header/main/footer 高度比例 |
| layout.columns | 是 | 列数 |
| layout.column_ratio | 是 | 列宽比例字符串 |
| layout.column_gap | 是 | 列间距百分比 |
| layout.sub_layouts | 否 | 列内嵌套子布局 |
| modules | 是 | 模块数组 |
| modules[].type | 是 | 组件类型 |
| modules[].column | 是 | 所在列序号 |
| modules[].hierarchy | 是 | 各内容字段的层级标注 |
| modules[].content | 是 | 实际内容文本 |
| modules[].icon | 否 | Lucide 图标 |
| footer | 否 | 底部结论条 |
| style_tokens | 是 | 继承全局风格 |

## position 计算规则

### 简单等分

```text
x = 前一模块 x + 前一模块 width + column_gap
y = 0%
width = (column_ratio 中该列占比) × 100% - column_gap
height = 100%
```

示例：3 列等分，gap = 1.5%
```text
module_01: x=0%,    width=32%
module_02: x=33.5%, width=32%
module_03: x=67%,   width=32%
```

### 不等分（按内容权重分配）

```text
# 场景:中心概念页，左右数据轻，中间重
column_ratio: "1:2:1"  →  25:50:25

module_01: x=0%,    width=24.25%   (25% - 1.5%/2)
module_02: x=25.75%, width=48.5%  (50% - 1.5%)
module_03: x=75.75%, width=24.25% (25% - 1.5%/2)
```

### 嵌套子布局

当某一列需要上下分区时：

```yaml
sub_layouts:
  - column: 1
    direction: vertical
    rows: 2
    row_ratio: "2:3"   # 上40% 下60%
    row_gap: 2%
```

该列内的模块使用 row 字段标识所在行：

```yaml
modules:
  - id: left_title
    column: 1
    row: 1
    position:
      x: 0%
      y: 0%
      width: 100%
      height: 40%

  - id: left_data
    column: 1
    row: 2
    position:
      x: 0%
      y: 42%         # 40% + 2% gap
      width: 100%
      height: 58%
```

## hierarchy 字段标注规范

hierarchy 不是可选的装饰，它决定渲染时的视觉权重。每个 content 字段都必须标注。

```yaml
hierarchy:
  tag: L5            # 辅助标签
  module_title: L2   # 模块标题
  value: L3          # 核心数据，视觉焦点
  chart: L4          # 图表辅助说明
  description: L4    # 正文说明
  conclusion: L5     # 结论注释
```

层级到视觉权重映射（由 visual_tokens 最终定义）：

| 层级 | 相对视觉权重 |
|------|-------------|
| L0 | 5x（最大，header 主标题） |
| L1 | 4x |
| L2 | 3x |
| L3 | 3x–4x（核心数据可以和 L2 同等甚至更大） |
| L4 | 1x（基准） |
| L5 | 0.6x |
