---
name: ppt-layout-engine
description: 根据输入内容自动为 3.67:1 超宽画布 PPT 选择模板、确定比例、排布组件并输出页面结构。当用户需要为超宽画布 PPT 进行页面排版、版式组合、布局规划时触发。用户说「PPT 排版」「帮我排这页 PPT」「这个内容怎么放到超宽 PPT 里」「PPT 布局设计」「根据内容组合 PPT 页面」「用设计系统排 PPT」时唤醒。不负责：生成 PPT 图片文件（用 designai-ppt-image）、生成信息图（用 designai-infographic-image）、纯视觉风格设定（无排版结构需求时）。
---

# PPT Layout Engine — 超宽画布排版引擎

本 Skill 指导 AI 从原始需求内容出发，经过内容拆解、层级建立、灵活布局，输出可渲染的页面结构。

## 完整工作流

```text
1. 内容拆解 → 2. 层级建立 → 3. 关系判断 → 4. 灵活布局 → 5. 组件排布 → 6. 输出结构
```

---

## Step 1：内容拆解

拿到需求内容后，逐条拆解为结构化元素。详细拆解维度和流程见 `references/content-parsing.md`。

核心要点：
- 每条内容标注 type / weight / format / relation
- weight 分 core / normal / aux，core 项不超过 3 个
- 数字和百分比默认 weight=core

## Step 2：层级建立

将拆解后的内容分配到 L0–L5。层级不只标注，直接驱动模块的视觉权重和空间分配。

详细规则见 `references/design-system.md` 第 5 节。

**核心逻辑**：core → L0/L1/L3，normal → L2/L4，aux → L5

层级影响空间：
- 含 L3 核心数据的模块 → 宽度倾向更大
- 含 L4 长说明的模块 → 高度倾向更大
- 纯 L5 辅助的模块 → 宽度可压缩

## Step 3：关系判断

读取 `references/design-system.md` 第 6 节，判断主关系和次关系。

**内容可有混合关系**：
- 主关系占比最大 → 决定模板
- 次要关系 → 在模板内局部调整布局
- 零散内容 → 降级为辅助信息或 footer

混合处理示例见 `references/content-parsing.md`。

## Step 4：灵活布局

布局不是"选一个模板就完事"，根据内容量动态组装。读取 `references/templates.md` 了解 T01–T10。

**三要素**：模块数量 → 列数；内容权重 → 列宽比例；内容类型 → 区域内组件组合

**标题默认规则**：L0 主标题默认放在 header 中央并居中对齐。除非页面明确采用左结论 + 右内容结构，否则不要把标题和主体都压到同一侧。

**不等分是常态**：
- 含 L3 数据的模块 → 宽度更大
- 图片/案例区域 → 占 55%–75%
- 对比页 → 等分
- 结论精炼 + 多卡片 → 1:4

**列内嵌套**：main 区域列内可嵌套子布局（上下分区），见 `references/output-format.md`。

## Step 5：组件排布

读取 `references/components.md`（C01–C10）和 `references/icons.md`。

### 组件选择逻辑

先读取 `references/container-system.md` 判断每类信息该落在哪种容器里，再读取 `references/component-combinations.md` 选择整页组合模式。若页面属于“双主卡 + 中轴说明”或“三段流程 + 连接节点”，进一步读取对应模式文件：`references/pattern-dual-cards-center-description.md`、`references/pattern-triple-process-with-connectors.md`。

不是"一个模块一个组件"，而是根据内容组合组件：

| 内容特征 | 组件组合 |
|----------|----------|
| 纯数字 + 趋势 | C02 核心数据 |
| 数字 + 图表 | C02 + C05 图表 |
| 模块标题 + 说明 + 结论 | C04 内容卡片 |
| 阶段名 + 动作 + 指标 | C07 流程节点 |
| 案例 + 图片 | C04 + C06 |
| 标签 | C03 |
| 底部总结 | C09 结论条 |

### 有图片时

读取 `references/image-layout.md`，先判定图片角色（证据/主体/说明/氛围），再选组合布局：

- 图片是证据 → 图旁放数据，比例 40:60 或 55:45
- 图片是主体 → 图片占中 55%–75%，两侧或下方放数据/文字
- 图片是说明 → 嵌入模块内部（卡片内、节点内）
- 图片是氛围 → 不参与布局计算，降级

图片组合方式本身也属于整页组合模式，和 `references/component-combinations.md` 联动判断。

### 图表选择

参照 C05 逻辑，由数据关系决定：

```text
趋势 → 折线图 | 差异 → 柱状图 | 占比 → 环形图
阶段 → 阶梯图 | 层级 → 同心圆/金字塔 | 关系 → 辐射图
```

---

## Step 6：输出页面结构

读取 `references/output-format.md`，输出全百分比的 YAML。

**必须包含**：
- title（L0）
- layout（column_ratio + 嵌套子布局）
- modules（每个含 type + position + hierarchy + content）
- footer
- 信息层级标注必须落实到每个 content 字段

---

## 画布规范速查

读取 `references/design-system.md` 了解完整规范。核心要点：

- 比例 3.67 : 1，全部百分比
- 安全边距：左右 3.25%，上下 4.76%
- 页面三层：header / main / footer，比例可调
- 网格：12 列，间距 0.7%

## 自适应规则

| 情况 | 处理 |
|------|------|
| 内容少 | 放大核心，增加留白，不添加装饰 |
| 内容多 | 删重复 → 合并 → 缩短 → 转图表 → 拆页 |
| 混合关系 | 主关系定模板，次关系局部调整 |

## 视觉风格

当前不含具体风格，全部 TBD。后续提供后填入 `references/design-system.md` 第 12 节 visual_tokens。
