# PPT Orchestrator Skill
# HTML 型 PPT 总控生成 Skill

## 1. Skill 定位

本 Skill 是 HTML 型 PPT 生成流程的总控 Skill，用于将草稿 PPT、原始文档、会议材料或结构化内容，稳定转化为 **HTML 型可编辑 PPT**。

本 Skill 负责：

- 理解原始内容
- 建立内容账本
- 区分正式内容与编辑备注 / 占位符
- 判断页面类型
- 判断是否需要拆页
- 选择页面组件与内容组件
- 绑定视觉风格 Skill
- 输出 HTML 型 PPT 页面
- 执行内容完整性与页面质量检查

本 Skill 不替代视觉风格 Skill，也不替代组件 Skill。它的职责是：

> 控制“怎么生成一套 PPT”，而不是只控制“页面长什么样”。

---

## 2. 最高优先级原则

### 2.1 内容保真优先

除非用户明确要求优化、改写、精简或重写文案，否则必须保持原始 PPT 信息不改动、不缺失。

必须保留：

- 原始标题
- 原始正文
- 原始数字
- 原始百分比
- 原始单位
- 原始符号
- 原始标签
- 原始对象关系
- 原始流程顺序
- 原始层级关系
- 原始图表含义
- 原始对比关系
- 原始因果关系

默认禁止：

- 删除正式内容
- 改写正式内容
- 总结替代正式内容
- 修改数字
- 修改单位
- 修改专有名词
- 擅自补充新数据
- 擅自纠正疑似错误
- 合并不同观点
- 改变原始逻辑关系

允许改变：

- 信息位置
- 版式结构
- 页面类型
- 卡片组合方式
- 视觉层级
- 分页方式
- HTML 结构

核心原则：

> 可以重新排版，但不能重新写内容。

---

## 3. 输出格式

### 3.1 输出目标

本 Skill 固定输出为 HTML 型 PPT 页面。

每一页必须是可编辑的 HTML 结构，而不是图片化页面。

输出内容应包含：

- 页面规划说明
- 页面类型判断
- 内容账本摘要
- HTML 页面代码
- CSS 样式引用或页面级样式
- 内容完整性检查结果
- 页面质量检查结果

### 3.1.1 OpenDesign 可预览输出硬性要求

无论用户说“优化 PPT”“生成 HTML PPT”还是“调用总控 Skill”，最终都必须在项目根目录写出 OpenDesign 可直接预览的产物：

1. `index.html`：完整、自包含、可导航的 HTML 型 PPT deck。所有 slide 必须在这一个文件中可见/可翻页，不要只输出 Markdown、JSON、HTML 片段或说明文字。
2. `index.html.artifact.json`：OpenDesign 预览元数据，必须与 `index.html` 同级，内容使用：

```json
{
  "version": 1,
  "kind": "html",
  "title": "HTML 型 PPT",
  "entry": "index.html",
  "renderer": "html",
  "status": "complete",
  "exports": ["html", "pdf", "zip"],
  "metadata": {
    "deck": true,
    "canvas": "3696x1008",
    "source": "ppt-orchestrator-html"
  }
}
```

3. `content_inventory.json`、`edit_instruction_inventory.json`、`page_plan.json`、`intake_result.json`、`quality_report.json` 可以作为辅助文件输出，但不能替代 `index.html`。
4. 如果引用上传 PPT 中抽取的图片或固定背景图，必须把资源复制到项目根目录下的 `assets/`，并在 `index.html` 中使用相对路径引用。
5. 任务完成前必须确认 `index.html` 存在且不是空壳：至少包含一个 `.ppt-slide`，并包含基础导航或全部 slide 可直接滚动查看。

### 3.2 HTML 基础要求

HTML 页面必须满足：

- 页面尺寸明确
- 所有文本为真实文本，不得转成图片
- 每条原始内容应尽量带 `data-source-id`
- 页面结构语义清晰
- 模块可被前端识别和编辑
- 卡片、标题、指标、图表、标签等内容应拆成独立 DOM 结构
- 不输出不可编辑的整页截图

推荐结构：

```html
<section class="ppt-slide" data-page-type="MetricOverviewPage">
  <header class="slide-header">
    <div class="brand-area"></div>
  </header>

  <main class="slide-main">
    <h1 data-source-id="source-001">页面标题</h1>

    <div class="content-area">
      <div class="metric-card" data-source-id="source-002">
        <span class="metric-value">175%</span>
        <span class="metric-label">CTR 年同增长</span>
      </div>
    </div>
  </main>
</section>
```

---

## 4. 输入类型

### 4.1 草稿 PPT

用户上传已有 PPT、线稿 PPT、会议汇报稿、内部草稿等材料，要求转为 HTML 型 PPT。

处理方式：

1. 逐页读取内容
2. 提取正式内容
3. 识别编辑备注
4. 建立内容账本
5. 判断页面类型
6. 输出 HTML 型 PPT

### 4.2 文档内容

用户提供一段文字、文档摘要、会议材料或业务说明。

处理方式：

1. 提炼页面主题
2. 保留所有正式信息
3. 判断是否需要拆页
4. 为每页选择页面类型
5. 输出 HTML 型 PPT

### 4.3 单页需求

用户指定“帮我做一页数据页 / 案例页 / 封面页”。

处理方式：

1. 优先遵循用户指定页面类型
2. 如果用户指定与内容不匹配，应提示推荐类型
3. 不得擅自删除信息
4. 输出单页 HTML

---

## 5. 执行流程

每次执行必须按以下顺序：

```text
读取原始 PPT / 文档
↓
提取所有文字、数字、图片、图表和信息关系
↓
建立不可变内容账本 content_inventory
↓
识别编辑备注与待修改占位符 edit_instruction_inventory
↓
识别不确定内容 uncertain_content_inventory
↓
判断内容章节与叙事顺序
↓
识别页面类型
↓
判断是否需要拆页
↓
生成页面结构规划 page_plan
↓
调用对应组件 Skill 或输出抽象组件能力
↓
注入视觉风格 Skill
↓
输出 HTML 型 PPT
↓
执行内容完整性检查
↓
执行溢出与视觉检查
↓
不合格则重排或拆页，禁止删减正式信息
```

---

## 6. 规则文件

本 Skill 的详细规则拆分在 `rules/` 目录：

- `rules/content_preservation.md`：内容保真与内容账本规则
- `rules/placeholder_rules.md`：编辑备注 / 占位符识别规则
- `rules/page_type_router.md`：页面类型路由规则
- `rules/component_interface.md`：组件 Skill 抽象调用接口
- `rules/style_binding.md`：视觉风格 Skill 绑定规则
- `rules/html_output_contract.md`：HTML 型 PPT 输出契约
- `rules/quality_check.md`：生成后质量检查清单
- `rules/test_plan.md`：草稿 PPT 测试流程

Schema 文件位于 `schemas/` 目录：

- `content_inventory.schema.json`
- `page_plan.schema.json`

示例位于 `examples/` 目录。

---

## 7. 默认页面类型池

页面类型来自大会 PPT 线稿抽象，不按每一页硬拆，而是归纳为可复用的结构模式：

1. `CoverPage`：封面页
2. `AgendaPage`：目录 / 议程页
3. `MetricOverviewPage`：核心成果总览页
4. `MultiColumnComparisonPage`：多列指标对比页
5. `EcosystemRelationshipPage`：生态关系 / 双端连接页
6. `StrategyPanoramaPage`：战略全景页
7. `StageEvolutionPage`：阶段演进页
8. `DualCoreArchitecturePage`：双核心能力架构页
9. `FormulaDecompositionPage`：公式驱动 / 因素拆解页
10. `CaseStudyPage`：重点案例分析页
11. `ProcessFlowPage`：流程链路页
12. `CentralModelPage`：中心对象模型页
13. `ShowcaseGalleryPage`：素材画廊页
14. `TransformationPage`：转型跃迁页
15. `CapabilityRoadmapPage`：路线图 / 增长曲线页
16. `CapabilityMatrixPage`：能力矩阵页
17. `GeneralStructuredPage`：无法明确归类时的兜底结构页

---

## 8. 默认风格绑定

默认绑定：

```text
超宽大屏商务增长风格
画布尺寸：3696 × 1008
物理尺寸：11m × 3m
```

如用户指定其他视觉风格，应以用户指定风格为准，但仍必须遵守本 Skill 的内容保真、编辑备注处理、页面路由和 HTML 输出规则。

---

## 9. 内容过多时的处理策略

当内容超过当前页面容量时，必须按以下顺序处理：

```text
保持全部正式信息
↓
优化信息分组和布局
↓
调用更合适的页面组件或页面变体
↓
拆成连续页面
↓
重新执行内容完整性检查
```

禁止：

- 缩小字号硬塞
- 压缩行距硬塞
- 压缩卡片内边距硬塞
- 隐藏次要信息
- 使用省略号替代正式内容
- 删除辅助说明
- 把文字转成图片规避溢出

---

## 10. 推荐输出结构

每次生成时，建议按以下结构输出：

1. 页面识别结果
2. 内容账本摘要
3. 编辑备注识别结果
4. 页面规划 JSON
5. HTML 型 PPT 代码
6. 内容完整性检查
7. 视觉与结构检查

---

## 11. 最终合格标准

最终生成必须同时满足：

```text
内容完整
结构清晰
页面可编辑
组件可复用
风格可绑定
大屏可阅读
编辑备注不进入正文
```

---

## 固定背景图路由规则

当视觉风格 Skill 提供固定封面、内容页、封尾背景图时，本总控 Skill 必须为每页输出页面角色与背景类型。

页面角色：

```text
cover：封面页
content：正文内容页
closing：封尾页
```

背景类型：

```text
backgroundVariant: cover | content | closing
```

分工：

```text
视觉风格 Skill：管理背景图资产和视觉使用规则
总控 Skill：判断 pageRole，并输出 backgroundVariant
组件 Skill：根据 backgroundVariant 渲染 SlideBackground
```

映射规则：

```text
CoverPage -> pageRole: cover -> backgroundVariant: cover
ClosingPage -> pageRole: closing -> backgroundVariant: closing
其他内容页 -> pageRole: content -> backgroundVariant: content
```

背景图不得承载正式正文信息。所有标题、正文、数字、单位、图表标签、Logo、二维码等应保持为 HTML 文本或独立可编辑组件。

详见 `rules/page_background_routing.md`。

## 常驻品牌信息禁用规则

当绑定当前超宽大屏商务增长风格时，背景图已经包含左上角品牌标识。总控 Skill 不得因为页面类型包含 `BrandLogo` / `brand-area` 就自动输出固定品牌文本。

默认禁止自动补充：

- 第二个“快手联盟”
- 重复 Logo
- 顶部固定业务线文字
- 未来自原稿的会议名 / 年份 / 角标

只有当这些内容来自原始 PPT 正式内容，或用户明确要求加入时，才允许进入 `content_inventory` 并输出为可编辑 HTML。

## 独立 Logo 组件调度规则

当前绑定的视觉风格采用“背景图不带 Logo，Logo 独立组件渲染”。

总控 Skill 必须在页面规划中输出：

```json
{
  "fixedBrandLogo": {
    "enabled": true,
    "assetRole": "fixed-brand-logo",
    "showOn": ["cover", "content", "closing"],
    "sourceUrl": "https://p5-ad.adkwai.com/udata/pkg/ks-ad-fe/md-tools/quick-cut/6689:5117.b90a9c9d53932e9b.svg",
    "localPath": null
  }
}
```

调度原则：

- 封面 / 内容 / 封尾都显示 Logo
- 背景图不得承担 Logo 展示
- Logo 不进入 `content_inventory`，除非用户明确要求它作为可编辑内容管理
- Logo 不得与原始 PPT 正文混淆
- 不得额外生成第二个“快手联盟”文字

## PPT 输入诊断与图片页解析前置规则

在进行页面类型判断、组件选择、HTML 生成之前，本 Skill 必须先执行输入诊断。

### 输入源类型

每页必须先被判定为以下类型之一：

```text
editable_slide：可编辑型页面
image_based_slide：图片型页面 / 整页截图
mixed_slide：混合型页面
unknown_slide：无法判断
```

### 关键规则

如果页面是 `image_based_slide`，且尚未生成可靠的 `content_inventory`，不得直接进入 HTML 生成。

必须先执行：

```text
高清页面截图
↓
OCR / 视觉识别
↓
视觉分区
↓
内容账本生成
↓
置信度标记
↓
人工确认或进入总控路由
```

### 状态门槛

```text
contentInventoryStatus = ready
允许生成最终 HTML

contentInventoryStatus = review_required
允许生成校对版 HTML，但必须输出复核清单

contentInventoryStatus = blocked
禁止生成 HTML，必须先补充原始可编辑文件、高清图或人工校对内容
```

### 规则文件

本前置流程由以下规则控制：

- `rules/ppt_input_intake.md`
- `rules/image_slide_parsing.md`
- `rules/content_inventory_precheck.md`
- `schemas/intake_result.schema.json`

核心原则：

> 总控 Skill 只基于结构化内容账本工作；图片型 PPT 必须先解析，再生成。
