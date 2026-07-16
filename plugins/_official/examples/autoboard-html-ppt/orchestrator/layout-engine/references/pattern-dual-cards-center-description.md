# 双主卡 + 中轴说明模式

## 模式名称

```text
dual_cards_with_center_description
```

## 适用场景

- 广告主 / 媒体
- 用户侧 / 平台侧
- 输入侧 / 输出侧
- 甲方 / 乙方
- 两个角色对称存在，中间有桥梁概念

## 主体结构

忽略 logo 和页面总标题后，仅看主体：

```text
左主卡 + 中轴说明 + 右主卡
```

更准确是：

```text
左卡片（42%）
+ 中间说明（16%）
+ 右卡片（42%）
```

推荐比例：

```yaml
layout:
  type: dual_cards_with_center_description
  columns: 3
  column_ratio: "1:0.35:1"
  column_gap: 2%
```

## 左右主卡组件

```yaml
component: primary_module_card
children:
  - tag
  - title
  - description
  - content_slot
```

### 卡片内结构

```text
卡片容器
├── 标签（文字 + 胶囊底框）
├── 标题
├── 说明文字
└── 主内容插槽
```

### 规则
- 左右两卡为镜像结构
- 标签短文本单行优先
- 标题是模块一级识别
- 说明文字 1–3 行
- 主内容插槽占卡片高度 65%–80%

## 中轴说明组件

```yaml
component: center_axis_description
children:
  - main_text
  - sub_text
  - description
  - connector_mark
```

### 结构

```text
主概念
次概念
多行说明
连接符（短竖线 + 小点）
```

### 规则
- 不加大底框
- 居中对齐
- 宽度明显小于左右卡
- 是桥梁，不是主模块容器

## 间距等级

| 关系 | 间距等级 |
|------|----------|
| 标签 → 标题 | G1 |
| 标题 → 说明 | G1 |
| 说明 → 主内容插槽 | G2 |
| 左卡 → 中轴说明 | G3 |
| 中轴说明 → 右卡 | G3 |
| 页面外边距 | G4 |
