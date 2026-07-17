# AutoBoard HTML PPT Combined Skill V2.6.0

## 1. Skill 定位

本 Skill 是一套完整的 HTML 型 PPT 生成能力，包含：

- `orchestrator/`：总控、内容保真、页面路由、拆页、组件能力选择和质量检查
- `style/`：3696 × 1008 超宽大屏视觉系统、组件规范、字阶、图标、背景和独立 Logo 资产

统一输出目标：

```text
HTML 型可编辑 PPT
画布：3696 × 1008 px
物理尺寸：11m × 3m
比例：11:3
```

此 Skill 面向闭门会、品牌营销大会和业务汇报主屏。它输出的是可翻页、可编辑的 HTML 演示文稿，不是把普通 16:9 页面横向拉伸后的长图。

---

## 2. 最高优先级

执行优先级固定为：

```text
原始内容完整
→ 信息关系正确
→ 页面结构清晰
→ 组件容量合理
→ 视觉风格统一
```

除非用户明确要求改写、精简或优化文案，否则：

- 不得删除正式内容
- 不得改写正式内容
- 不得修改数字、百分比、单位和专有名词
- 不得改变因果、流程、对比、阶段和层级关系
- 内容装不下时必须调整结构或拆页，不得缩字号硬塞

明显编辑指令、修改备注和待替换占位符不进入最终页面正文。

---

## 3. 执行顺序

### Step 1：读取总控规则

先读取：

```text
orchestrator/SKILL.md
orchestrator/rules/orchestration_pipeline.md
orchestrator/rules/ppt_input_intake.md
orchestrator/rules/content_preservation.md
orchestrator/rules/source_structure_analysis.md
orchestrator/rules/page_role_router.md
orchestrator/rules/page_type_router.md
orchestrator/rules/layout_selection.md
orchestrator/rules/component_interface.md
orchestrator/rules/template_library.md
orchestrator/rules/image_text_composition.md
orchestrator/rules/page_composition_library.md
orchestrator/rules/advanced_relation_components.md
orchestrator/rules/card_alignment.md
orchestrator/rules/heterogeneous_alignment.md
orchestrator/rules/layout_overflow_protocol.md
```

当当前项目、对话或用户输入含 `.pptx` 时，先完成 PPTX 输入诊断，再完成：

1. 输入文件定位与逐页 `editable_slide` / `image_based_slide` / `mixed_slide` / `unknown_slide` 分类
2. 原始内容提取
3. 内容账本建立
4. 编辑备注识别
5. 页面角色识别
6. 页面类型判断
7. 内容密度判断
8. 布局与组件能力选择
9. 模板库匹配与超宽变体选择
10. 拆页判断

优化 PPT 时，来源文件是内容和关系的事实依据，不是要被横向拉伸或截图化复用的版式。
必须输出独立可预览的 HTML 成品及 artifact 元数据，不能只输出方案、JSON 或 HTML 片段。

### Step 2：绑定视觉风格

再读取：

```text
style/SKILL.md
style/style.md
style/components.md
style/background_system.md
style/logo_system.md
style/asset_manifest.json
style/checklist.md
```

将页面计划绑定到统一视觉系统。

### Step 3：生成 HTML 型 PPT

输出必须遵守：

```text
orchestrator/rules/html_output_contract.md
```

所有标题、正文、数字和标签必须为真实 HTML 文本或独立可编辑组件，不得将整页内容图片化。

每一页还必须保留来源追踪属性、固定画布和页面序号；输出应以独立 slide 组织，不能用一个可纵向滚动的长页面代替演示文稿。

**生成前必须执行布局多样性检查（来自 `layout_selection.md §6`）：**

1. 列出所有内容页（`data-page-role="content"`）的预计 `layoutComponent` 序列
2. 检查是否有连续 3 个内容页属于同一布局家族（§6.2）→ 触发时换家族
3. 检查是否有连续 2 页使用相同 `data-page-variant` → 触发时换变体
4. 确认卡片样式分布（`cardStyleDistribution`），主样式 S1（`.card`）在连续 3 页中出现次数 ≤ 2（§6.3）
5. 确认同一布局家族的相邻两页不使用相同结构形态（§6.4）

只有通过以上 5 项检查，才允许进入 HTML 代码生成阶段。

### Step 4：执行双重检查

先执行：

```text
orchestrator/rules/quality_check.md
```

再执行：

```text
style/checklist.md
```

再执行：

```text
orchestrator/rules/layout_overflow_protocol.md
```

必须对每一张 slide 执行 `window.__odLayoutAudit()`，在 100% 画布与缩放预览下验证画布边界、安全区、文本节点与卡片内容。任一检查失败或无法运行审计时，不得直接交付；应重新布局、更换页面变体或拆页。

交付前必须在 100% 画布尺寸和缩放预览下各检查一次。只要出现正文溢出、重要信息越过安全区、Logo 重复、文本不可编辑或内容账本未覆盖，就必须回到布局阶段修复。

出现溢出时必须先区分“安全区越界”与“内容容量超限”。前者只能将核心内容重新约束在左右 220px、上下 90px 的安全区；后者必须按“重新分组 → 更换布局 → 必要时拆页”处理。禁止缩小安全边距、压缩安全区、缩小字号或删改正式内容硬塞页面。详见 `orchestrator/rules/layout_overflow_protocol.md` 的“先诊断溢出原因（强制）”。

---

## 4. 页面背景路由

本版本使用三张独立 SVG 背景：

```text
cover   → style/assets/bg-cover.svg
content → style/assets/bg-content.svg
closing → style/assets/bg-closing.svg
```

页面映射：

```text
CoverPage   → cover
普通内容页  → content
ClosingPage → closing
```

背景图只负责视觉氛围，不承载可编辑正文信息。

---

## 5. 独立 Logo

Logo 使用：

```text
style/assets/logo.svg
```

默认在封面、内容页、封尾页独立渲染。

禁止：

- 把 Logo 烘焙进背景图
- 从背景图裁切 Logo
- 重复生成第二个品牌文字
- 在 Logo 下方自动补充“快手联盟”等常驻副标题

Logo 规则详见：

```text
style/logo_system.md
```

---

## 6. 卡片高度控制（硬约束）

所有页面和组件生成必须遵守以下规则：

- 内容较少时，禁止将卡片强制拉伸到画布底部。
- 禁止默认对卡片使用 `height: 100%`、`flex: 1` 或过大的 `min-height`。
- 卡片优先使用 `height: auto`，由真实内容和必要内边距决定高度。
- 单张卡片正文少于 120 字时，卡片高度不得超过画布高度的 55%（554px）。
- 卡片有效内容占卡片高度的比例不得低于 55%。
- 页面剩余留白必须分布在模块外部，不得集中堆积在卡片内部。
- 同组卡片必须先识别为横向、纵向或矩阵组，再由共同父容器统一控制位置、尺寸、间距和对齐；不得逐张定位。
- 横向语义卡片组必须顶边、底边对齐且外框等高；纵向语义卡片组必须左、右边缘对齐且外框等宽；矩阵组同时满足各行等高、各列等宽与统一间距。
- 同组外框对齐优先于内部内容对齐。内容差异通过卡片内部弹性空间、固定底部结论区或精简冗余文案处理，不得移动整张卡片。
- 只有明确主次、大卡带小卡、瀑布流、时间轴错落或刻意非对称构图可例外；必须说明设计意图，不能因文案长短自然失控。

规则详见：

```text
style/style.md
style/components.md
style/checklist.md
orchestrator/rules/card_alignment.md
orchestrator/rules/heterogeneous_alignment.md
```

### 异构模块对齐（硬约束）

- 页面同时包含列表、卡片、箭头、指标、图表或总结模块时，不得将所有元素错误地强制等宽、等高；必须先建立外边界、行轨道和中心线锚点。
- 有逐项对应关系的列表必须共享行数、行高、行间距以及对应项的顶部、底部和中心线；箭头、连接线和转折符必须对准连接对象中心，而不是页面中心。
- 不同类型模块允许不同宽高，但必须至少共享一个外边界锚点和一个内容锚点；总结模块至少与主体模块共享一个外边界。
- 禁止用单独的 `margin`、`top`、`left` 或 `translate` 补偿对齐，应回到共同父级 Grid、Flex、行轨道或对齐变量修正。

### 同一内容带异构模块（硬约束）

- 当多个一级模块位于同一横向内容带时，必须由共同父级定义内容带高度 `H`，通常为画布高度的 35%～55%；所有一级模块必须顶边、底边对齐且整体等高。
- 列表型一级模块使用“统一标题条 + 等分卡片区”的内部 Grid；单体成果/图表模块外框同样等于 `H`，仅在内部放大数字、图表或居中内容，禁止抬高空容器。
- 同行中有逐项对应关系的两组卡片必须共享行轨道。箭头、连接线和过渡文字不参与模块高度计算，只对准关联对象中心。
- 允许使用 `height: 100%` 的前提是由共同内容带 `H` 控制一级模块或内部等分轨道；禁止用它、`100vh`、独立 `min-height`、`flex: 1` 或局部位移吞噬页面剩余高度。
- 交付前必须使用 `getBoundingClientRect()` 检查一级模块与对应卡片；top、bottom、height 及对应行边界误差均不得超过 2px。

### 页面填充与留白控制（硬约束）

- 页面不得仅依赖卡片高度填充画布。
- 文字内容较少时，禁止通过增大卡片 `height`、`min-height` 或 `padding` 强行撑满页面。
- 禁止添加无意义长文、重复信息或纯装饰图形填充空间。
- 必须优先重构信息层级，增加图表、流程、关系、数据对比或主题视觉。
- 标题区约占画布高度的 10%～18%，主体内容区约占 45%～65%，辅助视觉区约占 15%～30%。
- 连续无功能留白不得超过画布高度的 25%；有效信息与有效视觉元素覆盖面积应达到画布的 55%～75%。
- 卡片自适应后内容不足时，依次采取：放大核心信息 → 将关键数据升级为主视觉 → 改为流程、路径或关系结构 → 增加主题相关信息图形 → 调整垂直重心 → 最后才调整模块尺寸。
- 同一页面的留白必须分散在标题、模块和视觉元素之间，不得集中形成大面积空洞区域。
- 低密度页面不得只保留顶部一排自适应卡片；当卡片下方连续留白接近画布高度的 25% 时，必须将已有内容重组为流程、路径、关系结构、主视觉数据或主题信息图形之一。

### 内容密度判断（生成前必做）

- 高密度内容：使用紧凑卡片、分栏和表格。
- 中密度内容：使用卡片与数据图形组合。
- 低密度内容：使用少量大模块、主视觉数据、流程图或主题图形。
- 禁止所有内容密度都套用三等分卡片布局。
- 案例页优先用“挑战 → 策略 → 结果”的关系叙事；只有当三段内容均足以独立承载时，才使用单纯并列卡片。

---

## 7.1 开发者大会模板库与 11:3 适配（硬约束）

基于“快手联盟 — 开发者大会PPT 线稿V2-20260714”扩展页面时，必须读取：

```text
orchestrator/rules/template_library.md
```

参考稿只能抽象为 `Page Layout`、`Content Pattern` 和 `Reusable Component`，不得为每张参考页制造一次性模板。页面规划必须在 `pageType` 之后输出 `templateId`、必需槽位覆盖证据和 `ultrawideVariant` 的适配动作。

目标画布固定为 `3696 × 1008`。禁止将 2.67:1 的参考稿横向拉伸至 3.67:1；超宽空间只能用于模块间距、流程长度、证据/总结侧栏或图表区域扩展，图片、截图、卡片和圆形关系图不得变形。

---

## 8. 页面类型与组件（统一入口）

页面类型注册表（`pageType`、`templateId`、`layoutComponent` 完整映射）的**唯一权威来源**是：

```
orchestrator/rules/page_type_registry.md
```

禁止在本文件或其他文件中维护各自的 pageType 列表——如需新增页面类型，只在注册表中添加，并同步更新 `page_plan.schema.json` 的 `pageType.enum`。

当真实 PPT 组件 Skill 尚未接入时，使用总控中的抽象组件能力输出语义化 HTML。

当真实组件 Skill 接入后：

```text
总控页面类型（注册表）
→ 布局能力
→ 页面组件
→ 内容组件
→ 基础视觉组件
```

组件容量不足时必须拆页，不允许删除原始内容。

---

## 9. 会场交付约束

闭门会与大会主屏的默认交付规则如下：

- 固定使用 3696 × 1008 画布，每页一个独立 slide；
- 只在源材料或用户明确要求时加入会议名称、日期、演讲人、联合品牌和二维码；
- 标题、指标、图表、Logo、二维码和备注中的正式文字保持独立 DOM，可单独替换；
- 叙事节奏由源材料决定。封面、目录、章节、案例、策略、数据、总结与封尾均应按内容证据路由，不能为了视觉统一而强制套固定页序；
- 用户未要求"精简文案"时，所谓"美化"只允许重组、拆页、分层和视觉强化，不允许删减、概括或改写正式信息。
  > 对应 `preservationMode: "verbatim"`（默认）。触发词为"美化"、"让它好看"时，使用 `display_optimize` 模式，允许压缩过长标题，但禁止删除数字和指标。
  > 触发词含"精简"、"总结"时，使用 `summarize` 模式，必须在质量报告中记录每条删除项。
  > 详细规则见 `orchestrator/rules/content_preservation.md §5.1`。

---

## 10. 输出建议

每次生成建议输出：

1. 文档结构分析
2. 内容账本摘要
3. 编辑备注识别结果
4. 页面规划 JSON
5. HTML 页面
6. 内容保真报告
7. 页面结构检查
8. 视觉风格检查

---

## 11. 文件入口

```text
SKILL.md                                         # 当前统一入口（本文件）
orchestrator/SKILL.md                            # 总控详细规则（11 步流水线）
style/SKILL.md                                   # 风格详细规则
orchestrator/rules/page_type_registry.md         # 页面类型注册表（唯一权威来源）
orchestrator/rules/html_output_contract.md       # HTML 输出规范
orchestrator/rules/layout_selection.md           # 布局选择与多样性建议
orchestrator/rules/content_preservation.md      # 内容保真规则
orchestrator/schemas/page_plan.schema.json       # 页面计划 JSON Schema
style/asset_manifest.json                        # 背景与 Logo 资产映射
style/example.html                               # 风格预览示例
```
