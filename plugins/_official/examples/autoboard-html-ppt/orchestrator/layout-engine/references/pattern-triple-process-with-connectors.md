# 三段流程模块 + 连接节点模式

## 模式名称

```text
triple_process_with_connector_nodes
```

## 适用场景

- 三阶段流程
- 三段机制
- 左 → 中 → 右的能力推进
- 每段都是独立模块，之间需要明确方向连接

## 主体结构

主体不是简单三等分，而是：

```text
模块 A + 连接节点 + 模块 B + 连接节点 + 模块 C
```

推荐比例：

```yaml
layout:
  type: triple_process_with_connector_nodes
  columns: 5
  column_ratio: "1:0.18:1.2:0.18:1"
  column_gap: 1.5%
```

如果三块权重接近，可改为：

```yaml
column_ratio: "1:0.18:1:0.18:1"
```

## 主模块组件

```yaml
component: process_module_card
role: stage_module
children:
  - title
  - content_area
  - description
  - tag_or_result
```

### 结构

```text
模块容器
├── 模块标题
├── 主体内容区
├── 说明文字
└── 标签 / 结果
```

### 规则
- 主体内容区占卡片高度 45%–65%
- 说明 1–3 行
- 标签 / 结果放底部
- 中间模块如果更重要，宽度略大于两侧

## 连接节点组件

```yaml
component: connector_node
children:
  - circular_base
  - directional_arrow
```

### 结构

```text
圆形底
└── 大箭头
```

### 规则
- 箭头不能只是小 icon，必须是独立组件
- 箭头尺寸应为普通 icon 的 1.5–2 倍
- 圆底完整托住箭头
- 层级：主模块 > 连接节点 > 辅助说明
- 两个连接节点样式和尺寸应统一

### 位置
- 位于两个主模块之间的中点
- 默认沿主模块视觉中心线对齐
- 如果主体内容明显偏移，以内容中心线对齐

## 间距等级

| 关系 | 间距等级 |
|------|----------|
| 标题 → 主体内容 | G1 |
| 主体内容 → 说明 | G1/G2 |
| 说明 → 标签 | G1 |
| 模块 → 连接节点 | G2 |
| 主模块之间流程节距 | G3 |
| 页面外边距 | G4 |
