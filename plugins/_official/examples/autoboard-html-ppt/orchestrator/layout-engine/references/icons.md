# Lucide 图标映射表

图标来源：https://lucide.dev/

禁止：自行绘制复杂图标 / 混用第三方图标库 / 用 Emoji 代替 / 用 Logo 作业务图标

## 完整映射

| 使用场景 | 推荐 Lucide 图标 |
|----------|------------------|
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
| 搜索优化 | SearchCheck、ScanSearch |
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

## 选择原则

优先级：语义准确 → 图形简洁 → 与模块匹配 → 风格一致 → 尺寸适合

无完全匹配时：选语义最接近的 Lucide 图标，不自行创造。

## 命名格式

```yaml
icon:
  library: lucide
  name: BrainCircuit
  source: https://lucide.dev/icons/brain-circuit
  semantic_role: 模型能力
```

## 尺寸等级

不指定像素，只定义逻辑等级：

| 等级 | 用途 |
|------|------|
| small | 辅助标签、注释、状态 |
| medium | 卡片标题、能力条目、业务模块 |
| large | 中心概念、重要节点、场景识别 |

## 使用规则

- 同层级图标保持同一尺寸和风格
- 图标不能代替核心数据
- 一个小模块最多一个主要图标
- 一页不建议超过 12 个主要图标
- 图标过多时通过模块分组降低复杂度
