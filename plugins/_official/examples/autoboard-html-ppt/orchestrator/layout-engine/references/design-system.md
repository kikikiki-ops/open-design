# PPT 设计系统 Design MD

> 版本：v0.4  
> 状态：比例规范版  
> 画布比例：3.67 : 1（约 3696 × 1008 px，本系统不绑定具体像素）  
> 适用类型：商务汇报、战略发布、增长成果、算法能力、案例展示、数据分析、业务规划  
> 图标来源：统一使用 [Lucide Icons](https://lucide.dev/)  
> 当前版本暂不定义：字体、字号、颜色、圆角、阴影等视觉样式  
> 当前版本主要定义：页面结构、布局比例、内容层级、组件关系、图标调用规则和自适应规则

---

# 1. 设计系统目标

本设计系统用于指导 AI 根据输入内容，自动组合适配于 **3.67 : 1 超宽画布**的 PPT 页面。

所有定位和尺寸均使用**百分比**，不绑定具体像素值。渲染时根据实际画布尺寸换算即可。

核心原则：

```text
内容关系决定页面结构
信息层级决定视觉优先级
模块数量决定布局方式
所有尺寸用百分比表达，渲染时再换算像素
图标统一从 Lucide Icons 匹配
品牌风格通过独立视觉 Token 注入
```

---

# 2. 画布基础规范

## 2.1 画布比例

```yaml
canvas:
  ratio: 3.67   # width : height
  orientation: landscape
  coordinate_origin: top_left
  unit: percent  # 所有数值均为画布百分比
```

- 比例固定 3.67 : 1，实际像素由渲染环境决定
- 所有模块使用百分比定位（x%, y%, width%, height%）
- 百分比基准：画布总宽度 = 100%，画布总高度 = 100%

## 2.2 页面安全区域

```yaml
safe_area:
  left: 3.25%    # 左边距
  right: 3.25%   # 右边距
  top: 4.76%     # 上边距
  bottom: 4.76%  # 下边距
```

安全内容区域：

```yaml
content_area:
  x: 3.25%
  y: 4.76%
  width: 93.5%
  height: 90.48%
```

说明：

- 左右边距用于保留品牌区域、视觉留白和投影安全区
- 顶部区域用于品牌占位、页面标题和辅助口号
- 底部区域用于结论、来源、时间、地点或行动方向
- Logo 只作为固定占位元素处理，不参与主要内容排版
- Logo 的具体内容和品牌名称不纳入页面信息层级分析

---

# 3. 页面区域划分

页面在安全区域内划分为三层：header / main / footer。

所有数值为**安全内容区域的百分比**（基准 = content_area）。

```yaml
page_zones:
  header:
    width: 100%
    height: 15%    # 占内容区高度

  main:
    width: 100%
    height: 73%    # 占内容区高度

  footer:
    width: 100%
    height: 12%    # 占内容区高度
```

不同页面类型可调整 header / main / footer 的高度比例：

| 页面类型 | header | main | footer |
|---|---|---|---|
| 标题型 | 25% | 60% | 15% |
| 数据型 | 10% | 80% | 10% |
| 案例型 | 10% | 80% | 10% |
| 总结型 | 10% | 65% | 25% |
| 流程型 | 10% | 85% | 5% |

### 3.1 标题对齐原则

默认情况下，**页面主标题应位于 header 中央并居中对齐**，而不是固定贴左。

只有以下场景允许左对齐：
- 页面明确采用“左结论 + 右内容”的结构，且左侧结论本身就是主视觉
- 页面是时间轴/流程起点页，标题需与路径起点绑定
- 用户明确要求左对齐版式

其余情况统一遵循：

```text
L0 标题：header 区域水平居中
L1 结论：与 L0 同中轴或位于标题下方居中
```

### 3.2 页面重心原则

超宽画布禁止出现“标题和主体都挤在一侧，另一侧大面积空白”的失衡布局。

页面重心检查规则：
- 主体内容区（main）横向占用不足 55% 时，视为利用率过低
- 如果主模块只集中在左 30% 或右 30%，必须重新分配结构
- 标题居中时，主体区也应尽量围绕中轴展开，而不是偏向单侧
- 除非是刻意的左主题 + 右内容结构，否则主体内容应覆盖中部 60%–80% 的横向空间

### 3.3 常见纠偏方式

当页面出现“内容都缩在左侧”的情况时，优先按以下方式修正：

1. 将 L0 标题改为 header 居中
2. 将 main 从单侧窄列改为 2–4 列横向展开
3. 把辅助说明从侧边移到底部 footer
4. 增大图片/卡片/数据区的横向占比，让主体覆盖中部区域
5. 若内容量本身很少，不是缩在左边，而是改为“中心构图”

---

# 4. 统一网格系统

## 4.1 十二列网格

网格基于**内容区域宽度**的百分比：

```yaml
grid:
  columns: 12
  left_margin: 0%
  right_margin: 0%
  gutter: 0.7%        # 列间距，占内容区宽度
  column_width: 7.7%  # 单列宽度 = (100% - 11 × 0.7%) ÷ 12
```

## 4.2 网格使用原则

- 页面主结构优先对齐网格
- 模块宽度用列数表达（1–12 列），渲染时换算百分比
- 同一页面同级模块尽量使用相同列宽
- 卡片之间优先使用统一间距
- 复杂关系图可突破网格，但整体边界必须稳定

## 4.3 常用列宽比例

| 页面结构 | 列分配 | 宽度比例 |
|---|---|---|
| 双栏对比 | 6 + 6 | 50% : 50% |
| 左侧说明 + 右侧内容 | 3 + 9 | 25% : 75% |
| 左输入 + 中央核心 + 右输出 | 3 + 6 + 3 | 25% : 50% : 25% |
| 三栏数据卡 | 4 + 4 + 4 | 33% : 33% : 33% |
| 四列能力矩阵 | 3 + 3 + 3 + 3 | 25% : 25% : 25% : 25% |
| 场景 + 模型 + 结果 | 2 + 6 + 4 | 17% : 50% : 33% |
| 左侧主题 + 四个业务卡片 | 2 + 2.5 + 2.5 + 2.5 + 2.5 | 17% : 83%（内部四等分） |
| 中央核心 + 四周模块 | 3 + 6 + 3 | 25% : 50% : 25% |

---

# 5. 页面信息层级

每页最多使用以下六级信息：

```text
L0：页面主标题
L1：页面核心结论
L2：一级模块标题
L3：核心数据 / 核心概念
L4：正文说明 / 图表说明
L5：注释 / 来源 / 辅助标签
```

## 5.1 层级规则

- 每页只能有一个 L0 页面主标题
- L1 核心结论建议不超过两个
- 同一层级模块应保持相同结构
- 核心数据不能埋在长段落中
- 图表必须配合标题或结论
- 辅助信息不能与核心数据使用相同视觉权重
- 不建议在同一页面中出现超过 5 个实际视觉层级

**层级直接驱动空间分配**：

| 层级 | 空间行为 |
|------|----------|
| L0 | 占 header 全部，最大视觉权重 |
| L1 | header 内主标题旁，仅次于 L0 |
| L2 | 各模块顶部，区分功能区域 |
| L3 | 模块内视觉焦点，数字比说明大 3–5 倍 |
| L4 | 常规文字，辅助理解 |
| L5 | 最小最淡，角落或底部 |

含 L3 核心数据的模块 → 宽度倾向更大
含 L4 长说明的模块 → 高度倾向更大
纯 L5 辅助的模块 → 宽度可压缩

## 5.2 推荐内容顺序

```text
页面标题
↓
业务场景 / 主题
↓
核心概念或核心数据
↓
模型、图表、案例或流程
↓
页面结论
↓
下一步 / 时间 / 来源
```

---

# 6. 内容关系判断

## 6.1 并列关系

- 多个模块重要程度接近
- 模块之间没有明显先后
- 内容属于同一层级

→ 三栏卡片 / 四列能力矩阵 / 多业务方向卡片 / 多指标总览

## 6.2 对比关系

- 过去与现在 / 旧策略与新策略 / 方案 A 与方案 B

→ 左右双栏 / 双数据卡 / 前后图表 / 上下对比

## 6.3 递进关系

- 存在时间顺序 / 能力逐步升级 / 从浅到深

→ 横向流程 / 阶段演进 / 曲线路径 / 阶梯结构

## 6.4 因果关系

- 某种能力导致某种结果 / 输入经过模型产生输出

→ 场景 → 模型 → 机制 → 结果

## 6.5 聚合关系

- 多个模块共同指向一个核心

→ 中心圆 / 辐射关系图 / 中心概念 + 左右输入输出

## 6.6 分层关系

- 从基础到高级 / 从外围到核心

→ 同心圆 / 分层卡片 / 金字塔 / 多级流程

---

# 7. 页面模板系统

## T01：目录 / 章节导航页

**适用场景**：报告目录 / 会议议程 / 战略章节 / 阶段结构

**页面结构**

```text
header：页面类型标签 + 页面主标题
main：横向章节模块（2–4 个，等分宽度）
footer：时间 / 地点 / 辅助信息
```

**自适应规则**
- 2 章：50% + 50%
- 3 章：33% + 33% + 33%
- 4 章：25% + 25% + 25% + 25%
- 5+ 章：两行布局或分组

## T02：核心数据展示页

**适用场景**：多项业绩 / 增长指标 / 业务成果 / 核心方向

**页面结构**

```text
header：页面标题
main：横向数据卡片
footer：统一结论
```

**单卡片结构**

```text
分类标签 → 指标名称 → 核心数据 → 图表 → 结论说明
```

**列宽自适应**

| 指标数量 | 列分配 | 宽度比例 |
|---|---|---|
| 2 | 6 + 6 | 50% + 50% |
| 3 | 4 + 4 + 4 | 33% + 33% + 33% |
| 4 | 3 + 3 + 3 + 3 | 25% × 4 |
| 5–6 | 2×3 网格 | 两行三列 |
| 7+ | 拆页 | 只保留核心指标 |

**图表匹配**

| 数据关系 | 推荐图表 |
|---|---|
| 增长趋势 | 折线图 |
| 前后比较 | 柱状图 |
| 占比 | 环形图 |
| 资源分配 | 饼图 |
| 阶段变化 | 阶梯图 |
| 多指标变化 | 组合图 |

## T03：中心概念 / 双边连接页

**适用场景**：平台连接供需 / 广告主与媒体 / 输入与输出 / 生态协同

**页面结构**

```text
header：页面标题
main：
  左侧角色区 (25%)  ←  中央核心 (50%)  →  右侧角色区 (25%)
footer：共同能力或总结
```

**角色模块**

```text
角色标题 → Lucide 图标 → 当前状态 → 未来变化 → 说明卡片
```

**自适应规则**
- 中央概念是页面唯一视觉核心
- 左右视觉重量尽量接近
- 关系线超过 5 条时改为矩阵或流程图
- 关系线不能穿过核心文字

## T04：左右策略对比页

**适用场景**：过去与现在 / 旧方案与新方案 / 优化前后

**页面结构**

```text
header：页面标题
main：
  左侧方案 (50%)  |  右侧方案 (50%)
footer：统一结果
```

**单侧模块**

```text
策略名称 → 策略说明 → 关键机制 → 图示 / 图表 → 最终结果
```

**对比规则**
- 左右标题使用相同句式
- 对比维度必须一致
- 对比结果位于相同水平位置
- 对比项超过 4 个时改为对比表或矩阵

## T05：场景 → 模型 → 调整 → 结果页

**适用场景**：业务机制 / 算法模型 / 定价策略 / 投放优化

**页面结构**

```text
header：页面标题
main：
  场景 (17%) → 模型 (42%) → 调节 (25%) → 结果 (17%)
footer：结论
```

**各模块内部结构**

```text
模型：名称 → 输入 → 机制 → 输出 → 证据图
调节：目标 → 方法 → 调节前 → 调节后 → 趋势
结果：核心数字 → 趋势方向 → 指标名称 → 解释
```

## T06：阶段演进页

**适用场景**：冷启动到成熟 / 能力升级 / 过去现在未来

**页面结构**

```text
header：页面标题
main：横向阶段模块（等分或按内容权重分配）
footer：结论
```

**单阶段模块**

```text
阶段名称 → 阶段目标 → 核心动作 → 阶段指标 → 阶段产出
```

**自适应规则**
- 3 阶段：33% + 33% + 33%
- 4 阶段：25% + 25% + 25% + 25%
- 5 阶段：20% × 5 或中心路径 + 两侧
- 6+ 阶段：拆页

## T07：曲线路径 / 战略路线图

**适用场景**：长期战略 / 技术演进 / 增长曲线

**页面结构**

```text
header：页面标题
main：路径区域（占 main 100%），内含 3–6 个节点
footer：辅助标签
```

**节点结构**

```text
Lucide 图标（可选） → 节点名称 → 节点说明 → 节点价值 → 关联能力
```

**路径规则**
- 路径线必须有方向，默认从左向右
- 节点不互相遮挡
- 路径线不穿过核心文字

## T08：能力矩阵页

**适用场景**：AI 能力总览 / 产品能力地图 / 业务能力分类

**页面结构**

```text
header：页面标题
main：等宽纵向栏目
footer：（可选）
```

**列宽自适应**

| 列数 | 宽度比例 |
|---|---|
| 3 列 | 33% + 33% + 33% |
| 4 列 | 25% + 25% + 25% + 25% |
| 5 列 | 20% × 5（紧凑卡片或两行） |

**单列结构**

```text
能力大类 → 能力副标题 → 能力条目（最多 4 个） → 底部价值总结
```

**条目结构**

```text
Lucide 图标 → 能力名称 → 简短说明
```

## T09：案例展示页

**适用场景**：产品界面 / AIGC 素材 / 广告样式 / 用户路径

**页面结构**

```text
header：页面标题
main：
  左侧数据（可选）|  中央图片组（55%–75%） |  右侧数据（可选）
footer：案例结论
```

**图片布局**

| 图片数量 | 推荐布局 |
|---|---|
| 1 | 大图 + 说明 |
| 2 | 左右对比 |
| 3 | 三栏案例 |
| 4–6 | 横向序列 |
| 7+ | 分组或拆页 |

**单案例模块**

```text
案例编号 → 案例图片 → 案例类型 → 案例说明 → 业务结果
```

## T10：未来展望 / 业务拓展页

**适用场景**：下一阶段规划 / 新业务场景 / 行业拓展

**页面结构**

```text
header：页面标题
main：
  左侧主题结论 (17%–25%)  →  右侧业务卡片 (75%–83%)
footer：（可选）
```

**单业务卡片**

```text
Lucide 图标 → 业务名称 → 业务价值 → 应用方式 → 预期结果
```

**自适应规则**
- 3 卡片：内部 33% + 33% + 33%
- 4 卡片：内部 25% × 4
- 5+ 卡片：分组或两行

---

# 8. 通用组件系统

## C01：页面标题组件

```text
品牌占位 → 主标题 → 副标题 / 辅助口号 → 标题分隔线
```

- 每页一个主标题
- 标题过长时改写，不无限缩小
- 品牌占位不参与主标题竞争

## C02：核心数据组件

```text
核心数值 → 趋势符号 → 指标名称 → 时间范围 → 解释说明
```

- 一个组件只突出一个核心指标
- 数据与单位不可分离
- 趋势方向必须明确
- 多个数据组件应统一结构

## C03：标签组件

```text
标签名称 → 标签状态 → 标签分类
```

类型：章节标签 / 业务标签 / 时间标签 / 阶段标签 / 策略标签 / 编号标签 / 状态标签

标签不应替代标题，也不应承载长段落。

## C04：内容卡片组件

```text
卡片标题 → 卡片副标题 → 主体说明 → 图片 / 图表 / 图形 → 卡片结论
```

- 一个卡片只表达一个主要主题
- 同一组卡片使用统一结构
- 内容过长时优先减少文字

## C05：图表组件

**图表选择**

```text
趋势 → 折线图
前后差异 → 柱状图
比例 → 环形图 / 饼图
阶段 → 阶梯图 / 路径图
层级 → 同心圆 / 金字塔
关系 → 辐射图 / 网络图
规模 → 面积图 / 柱状图
```

- 图表必须服务于结论
- 只保留必要坐标轴、标签和图例
- 图表旁边应有业务解释

## C06：图片 / 案例组件

```text
图片 → 图片编号 → 图片分类 → 图片说明 → 案例结果
```

- 统一图片比例和间距
- 图片按时间、类型或流程排序
- 图片不应替代页面标题和结论

## C07：流程节点组件

```text
节点编号 → Lucide 图标（可选） → 节点名称 → 节点动作 → 节点说明 → 节点结果
```

状态：起点 / 进行中 / 当前 / 已完成 / 下一阶段 / 目标状态

## C08：路径线组件

用途：表达顺序 / 因果 / 阶段演进 / 增长曲线 / 多节点关系

- 路径线必须有方向
- 路径线不能穿过核心文字
- 复杂关系改用矩阵或流程图

## C09：底部结论条

```text
Lucide 图标或箭头 → 一句话结论 → 关键数据 → 下一步方向
```

- 每页最多一个主要结论条
- 结论条表达完整判断
- 高度根据文本长度自适应

## C10：分隔组件

类型：水平分隔线 / 垂直分隔线 / 虚线 / 点线 / 模块留白 / 色块边界 / 中心轴线

- 分隔线用于表达结构
- 有方向关系时使用箭头
- 分隔线不能切断主要阅读路径

---

# 9. Lucide 图标系统

## 9.1 图标来源

统一从 https://lucide.dev/ 匹配。

禁止：自行绘制复杂图标 / 混用第三方图标库 / 用 Emoji 代替 / 用 Logo 作业务图标

## 9.2 图标选择原则

优先级：语义准确 → 图形简洁 → 与模块匹配 → 风格一致 → 尺寸适合

无完全匹配时：选语义最接近的 Lucide 图标，不自行创造。

## 9.3 推荐图标映射

| 使用场景 | 推荐 Lucide 图标 |
|---|---|
| 用户 / 人群 | Users、UserRound、UserSearch |
| 人群理解 | UsersRound、ScanFace |
| AI / 智能 | Brain、Sparkles、Bot |
| 数据分析 | ChartNoAxesCombined、ChartColumn、ChartLine |
| 增长 | TrendingUp、ArrowUpRight |
| 下降 | TrendingDown、ArrowDownRight |
| 预算 | Wallet、Coins、BadgeDollarSign |
| 支付 / 付费 | CreditCard、CircleDollarSign |
| 广告 | Megaphone、BadgePercent |
| 媒体 / 视频 | MonitorPlay、Video、PlaySquare |
| 流量 | Waypoints、GitBranch、RadioTower |
| 连接 / 生态 | Network、Workflow、Cable |
| 设置 / 调整 | Settings2、SlidersHorizontal、SlidersVertical |
| 模型 | BrainCircuit、Network、Box |
| 算法 | Binary、FunctionSquare、BrainCircuit |
| 搜索 / 检索 | Search、FileSearch |
| 素材 | Images、Image、Layers |
| AIGC 生图 | ImagePlus、WandSparkles |
| 内容生产 | PenLine、FilePenLine |
| 内容消费 | Play、Clapperboard、BookOpen |
| 商品 / 电商 | ShoppingCart、Package、Store |
| 私信 / 对话 | MessageCircle、MessagesSquare、Send |
| 游戏 | Gamepad2 |
| 服务 / 客服 | Headphones、MessageSquareMore |
| 结果 / 完成 | CircleCheck、BadgeCheck |
| 下一步 | ArrowRight、MoveRight |
| 阶段 | Milestone、Flag |
| 时间 | Clock3、CalendarDays |
| 路径 | Route、GitBranch |
| 目标 | Target、Crosshair |
| 速度 / 效率 | Gauge、Zap |
| 自动化 | Workflow、Bot |
| 服务闭环 | RefreshCw、Repeat2 |
| 风险 / 提醒 | TriangleAlert、CircleAlert |

## 9.4 图标命名格式

```yaml
icon:
  library: lucide
  name: BrainCircuit
  source: https://lucide.dev/icons/brain-circuit
  semantic_role: 模型能力
```

## 9.5 图标尺寸等级

当前不指定像素，只定义逻辑等级：

```yaml
icon_size:
  small: 辅助标签、注释、状态
  medium: 卡片标题、能力条目、业务模块
  large: 中心概念、重要节点、场景识别
```

## 9.6 图标使用规则

- 同层级图标保持同一尺寸和风格
- 图标不能代替核心数据
- 一个小模块最多一个主要图标
- 一页不建议超过 12 个主要图标
- 图标过多时通过模块分组降低复杂度

---

# 10. 布局比例系统

所有数值为**内容区域的百分比**。渲染时：`实际像素 = 百分比 × 内容区域像素`。

## 10.1 三栏数据页

```yaml
layout:
  columns: 3
  column_ratio: "1:1:1"       # 33% : 33% : 33%
  column_gap: 1.5%             # 占内容区宽度
  vertical_alignment: center
```

## 10.2 左中右关系页

```yaml
layout:
  columns: 3
  column_ratio: "1:2:1"       # 25% : 50% : 25%
  column_gap: 1.5%
  vertical_alignment: center
```

## 10.3 双栏对比页

```yaml
layout:
  columns: 2
  column_ratio: "1:1"         # 50% : 50%
  column_gap: 1%
  divider: true
```

## 10.4 四列能力矩阵

```yaml
layout:
  columns: 4
  column_ratio: "1:1:1:1"     # 25% × 4
  column_gap: 1.5%
```

## 10.5 场景 → 模型 → 调节 → 结果

```yaml
layout:
  columns: 4
  column_ratio: "1:2.5:1.5:1"  # 17% : 42% : 25% : 17%
  column_gap: 1%
  flow: left_to_right
```

## 10.6 左侧主题 + 右侧业务卡片

```yaml
layout:
  columns: 2
  column_ratio: "1:5"         # 17% : 83%
  inner_cards: 4              # 右侧内部四等分
  inner_card_ratio: "1:1:1:1"
  inner_card_gap: 1%
```

---

# 11. 内容自适应规则

## 11.1 内容较少

- 放大核心概念占比
- 增加模块间留白
- 使用中心模型或大图
- 不添加无意义正文或装饰图标

## 11.2 内容适中

- 使用标准模板
- 保持模块数量平衡
- 图文比例稳定

## 11.3 内容过多

处理顺序：

```text
1. 删除重复信息
2. 合并相似模块
3. 缩短标题
4. 长段落改短句
5. 文字转图表或流程
6. 辅助内容降级
7. 拆分为多个页面
8. 最后才调整模块比例
```

禁止：

- 无限缩小核心数字
- 大量正文塞进卡片
- 图表和文字互相遮挡
- 用装饰图标掩盖结构混乱

## 11.4 模块数量适配

| 模块数量 | 推荐布局 |
|---|---|
| 1 | 单主体大模块 |
| 2 | 左右双栏 1:1 |
| 3 | 三栏 1:1:1 或中心关系 1:2:1 |
| 4 | 四栏 1:1:1:1 或 2×2 |
| 5 | 中心 + 四周 或 20%×5 |
| 6 | 三行两列 或 六段流程 |
| 7–8 | 分组或两行布局 |
| 9+ | 拆页、分页或矩阵化 |

---

# 12. 视觉 Token 占位

> ⚠️ **本 layout-engine 作为 `autoboard-html-ppt` skill 的子级布局引擎使用。**  
> 视觉 Token 由父级 `style/style.md` 和 `style/SKILL.md` 统一提供，**本节不得覆盖或重定义父级风格**。  
> 布局引擎只负责结构决策（列数、模块位置、层级比例），不负责视觉样式输出。

父级视觉 Token 摘要（来自 `autoboard-html-ppt/style/style.md`）：

```yaml
visual_tokens:
  color:
    background: "linear-gradient(135deg,#FDFCF7 0%,#F5EDD8 100%)"   # 暖白奶油渐变
    primary_text: "#0B2D3A"                                           # 深青黑（主标题/正文）
    secondary_text: "#3A5462"                                         # 次级文字
    accent: "#D5AE79"                                                 # 香槟金（主品牌色）
    accent_teal: "#14C9C9"                                            # 青绿（辅助强调色）
    accent_light: "rgba(213,174,121,.15)"                             # 金色淡底
    border: "rgba(213,174,121,.28)"                                   # 卡片描边
    divider: "rgba(11,45,58,.06)"                                     # 分隔线

  typography:
    # 字体规则唯一来源：style/examples/example_prompt.md §3.1–§3.4
    # 子级禁止在此处覆盖，渲染时由父级注入 Token
    font_family_primary: "→ 见 example_prompt.md §3.1"
    size_scale:         "→ 见 example_prompt.md §3.2（L0 148px … L5 22px）"
    weight_scale:       "→ 见 example_prompt.md §3.3"

  line_height:
    # 行高规则唯一来源：style/examples/example_prompt.md §3.4 及 design-system §12 注释
    L0_heading:    "→ 见 example_prompt.md §3.4（line-height:1）"
    L4_body:       "→ 见 example_prompt.md §3.4（line-height:1.6）"

  paragraph_spacing:
    # 段落间距唯一来源：style/examples/example_prompt.md §3.4
    reference: "→ 见 example_prompt.md §3.4"

  shape:
    card_radius: TBD              # 用 % 表达
    tag_radius: TBD
    button_radius: TBD
    circle_shape: TBD

  spacing:
    # px 台阶值唯一来源：style/style.md §5.5（CSS Token）及 example_prompt.md §5.7（台阶约束）
    page_margin_pct: 3.25%        # 左右边距占画布宽度
    header_gap: TBD
    section_gap: TBD
    module_gap: TBD
    card_padding: TBD
    text_gap: TBD
    icon_text_gap: TBD
    chart_text_gap: TBD
    paragraph_spacing: TBD        # 行高 + 段距由 line_height 体系定义

  border:
    default_width: TBD
    emphasis_width: TBD
    style: TBD

  shadow:
    enabled: TBD
    level_1: TBD
    level_2: TBD

  icon:
    library: lucide
    source: https://lucide.dev/
    style: TBD
    stroke_width: TBD
    size_small_pct: TBD           # 图标宽度占模块宽度 %
    size_medium_pct: TBD
    size_large_pct: TBD

  decoration:
    particle_enabled: TBD
    wave_enabled: TBD
    gradient_enabled: TBD
    texture_enabled: TBD
```

---

# 13. AI 自动排版决策流程

```text
Step 1：逐条拆解内容（type / weight / format / relation）
↓
Step 2：分配信息层级（L0–L5），层级直接驱动空间
↓
Step 3：识别主关系和次关系
↓
Step 4：识别页面目的（导航 / 数据 / 案例 / 机制 / 演进 / 能力 / 展望）
↓
Step 5：主关系选择模板，次关系局部调整
↓
Step 6：根据模块数量 + 内容权重确定列数和比例（不等分）
↓
Step 7：需要时在列内嵌套子布局
↓
Step 8：将内容映射到通用组件
↓
Step 9：判断图表、图片、Lucide 图标或路径线
↓
Step 10：为图标模块匹配 Lucide 图标
↓
Step 11：检查内容密度、阅读顺序和层级一致性
↓
Step 12：应用视觉 Token
↓
Step 13：输出页面结构（全部百分比，hierarchy 标注到每个字段）
```

---

# 14. AI 输出页面结构格式

所有 position 和 size 均为百分比，渲染时按 `实际像素 = 百分比 × 内容区域像素` 换算。

```yaml
page:
  id: page_01
  canvas_ratio: 3.67

  type: data_overview
  purpose: 展示三项核心增长结果

  title:
    text: ""
    level: L0
    zone: header

  subtitle:
    text: ""
    level: L1
    zone: header

  layout:
    direction: horizontal
    columns: 3
    column_ratio: "1:1:1"
    column_gap: 1.5%
    vertical_alignment: center

  modules:
    - id: metric_01
      type: metric_card
      position:
        x: 0%
        y: 0%
        width: 32%
        height: 100%

      hierarchy:
        tag: L2
        metric_name: L3
        value: L3
        chart: L4
        conclusion: L5

      content:
        tag: ""
        metric_name: ""
        value: ""
        unit: ""
        trend: ""
        chart_type: line
        conclusion: ""

      icon:
        library: lucide
        name: ChartLine
        source: https://lucide.dev/icons/chart-line
        semantic_role: 增长趋势

    - id: metric_02
      type: metric_card
      position:
        x: 34%
        y: 0%
        width: 32%
        height: 100%

      content:
        tag: ""
        metric_name: ""
        value: ""
        unit: ""
        trend: ""
        chart_type: bar
        conclusion: ""

      icon:
        library: lucide
        name: ChartColumn
        source: https://lucide.dev/icons/chart-column
        semantic_role: 数据对比

    - id: metric_03
      type: metric_card
      position:
        x: 68%
        y: 0%
        width: 32%
        height: 100%

      content:
        tag: ""
        metric_name: ""
        value: ""
        unit: ""
        trend: ""
        chart_type: donut
        conclusion: ""

      icon:
        library: lucide
        name: ChartPie
        source: https://lucide.dev/icons/chart-pie
        semantic_role: 数据占比

  footer:
    type: conclusion_bar
    position:
      x: 0%
      y: 0%
      width: 100%
      height: 100%
    text: ""

  style_tokens:
    inherit_from: global_style
```

---

# 15. 页面质量检查

## 15.1 结构检查

- 是否只有一个页面主标题
- 是否存在明确阅读顺序
- 模块比例是否符合选定的 column_ratio
- 模块数量是否适合当前页面
- 页面是否存在明确主次关系

## 15.2 内容检查

- 核心结论是否突出
- 核心数据是否独立
- 图表是否支持页面结论
- 是否存在重复或过长段落
- 是否有未解释的图标、图片或线条

## 15.3 图标检查

- 是否全部使用 Lucide Icons
- 图标语义是否与业务匹配
- 同页图标风格是否一致
- 图标是否替代了本应用文字或数据的位置

## 15.4 空间检查

- 页面左右是否平衡
- 主要内容是否集中在主体区
- 卡片之间间距是否统一
- 是否出现内容贴边或过度拥挤

## 15.5 扩展性检查

- 模块增减时 column_ratio 是否可自动调整
- 图片数量变化时是否可重新排列
- 替换视觉 Token 后结构是否仍然成立
- 替换画布尺寸后百分比是否仍然有效（答案：是）

---

# 16. 后续品牌风格融合接口

```yaml
brand_style:
  overall_style: TBD
  font_system: TBD
  color_system: TBD
  typography_scale: TBD
  corner_radius_system: TBD
  spacing_system: TBD
  icon_system:
    library: lucide
    source: https://lucide.dev/
    stroke_style: TBD
    default_size: TBD
    default_weight: TBD
  shadow_system: TBD
  divider_system: TBD
  chart_system: TBD
  illustration_system: TBD
  background_system: TBD
  decoration_system: TBD
```

视觉风格注入以下组件：

```text
页面标题组件 / 核心数据组件 / 内容卡片组件
流程节点组件 / 案例图片组件 / 图表组件
路径线组件 / 能力矩阵组件 / 底部结论条
标签组件 / 分隔线组件 / Lucide 图标组件
```

最终系统结构：

```text
内容分析层
↓
页面目的判断层
↓
页面模板层（比例体系）
↓
组件组合层
↓
信息层级层
↓
Lucide 图标匹配层
↓
视觉 Token 层
↓
渲染换算层（百分比 → 像素）
↓
最终 PPT 页面
```

---

# 17. 核心原则总结

```text
1.  画布比例固定 3.67 : 1，不绑定具体像素。
2.  所有定位和尺寸使用百分比，渲染时换算。
3.  页面采用超宽横向结构，不按 16:9 压缩。
4.  默认 12 列网格，边距和间距均为百分比。
5.  内容关系决定页面模板。
6.  信息层级决定组件优先级。
7.  一个页面只突出一个核心结论。
8.  一个模块只表达一个主要主题。
9.  左右结构用于对比。
10. 中心结构用于聚合。
11. 横向结构用于流程和阶段演进。
12. 卡片用于并列信息。
13. 节点用于阶段信息。
14. 路径用于表达关系和增长方向。
15. 图表必须服务于结论。
16. 图片用于案例或证据，不替代页面结构。
17. 所有图标优先从 https://lucide.dev/ 匹配。
18. 禁止自行设计复杂图标、混用图标库或使用 Emoji。
19. 图标是辅助识别元素，不应抢占核心数据和标题的视觉权重。
20. 内容过多时优先删减、归类或拆页。
21. 模块数量、文字长度、图片数量都必须支持自适应。
22. column_ratio 随内容自动调整，不硬编码。
23. 结构规范与视觉风格分离。
24. 字体、颜色、圆角、阴影、图标尺寸等由视觉 Token 统一注入。
25. 所有页面必须适配 3.67 : 1 的超宽展示环境。
```
