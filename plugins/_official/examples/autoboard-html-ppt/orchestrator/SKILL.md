# PPT Orchestrator Skill V2.7.0
# HTML 型 PPT 内容识别、结构路由与生成总控

> **⚠️ 本文件不是独立入口 Skill。**
> 完整工作流的统一入口是项目根目录的 `SKILL.md`，本文件只负责详细的 11 步编排流水线规则。
> 如果你只是启动 PPT 生成任务，应从根目录 `SKILL.md` 开始。

## 0. Skill 定位

本 Skill 是 HTML 型 PPT 生成链路中的总控与编排器，负责把草稿 PPT、文档、会议材料或结构化内容转成结构正确、内容保真、可编辑、可检查的 HTML 型 PPT。

本 Skill 负责：

1. 接收当前项目或对话中上传的 PPTX，逐页诊断可编辑、图片型、混合和未知页面；
2. 逐页读取正式内容、数字、图片、图表、空间分组和信息关系；
3. 建立不可变内容账本；
4. 区分正式内容、编辑指令、占位符和不确定内容；
5. 先判断页面角色，再判断语义页面类型；
6. 决定是否拆页，并将内容映射到页面区域；
7. 选择布局组件与内容组件能力；
8. 冻结页面结构；
9. 在结构冻结后绑定视觉风格、背景和 Logo 规则；
10. 输出 HTML 型 PPT；
11. 执行内容、路由、版式、风格与可编辑性检查。

本 Skill 不负责发明视觉风格，也不得让视觉参考图决定页面类型。

> 先理解内容，再决定结构；先冻结结构，再套视觉风格。

---

## 1. 信息来源职责

生成时必须区分四类来源：

| 来源 | 决定什么 | 不得决定什么 |
|---|---|---|
| 原始 PPT / 文档 | 正式内容、信息层级、数字、关系、叙事顺序 | 视觉风格的最终实现 |
| 页面路由规则 | 页面角色、页面类型、布局结构 | 改写或删除正式内容 |
| 组件 Skill | 可用布局和内容组件 | 页面业务结论 |
| 视觉风格 Skill / 参考图 | 颜色、字体、Logo、背景、线条、卡片、装饰 | 页面类型、内容数量、信息层级 |

强制规则：

- 参考图是章节页，只代表该类页面的视觉示例，不代表整套 PPT 的默认布局。
- 只有当前内容结构与参考页结构一致时，才允许复用其布局。
- 视觉相似性不得覆盖语义页面路由。

---

## 2. 最高优先级

按以下顺序执行，后项不得牺牲前项：

1. 正式文字与来源图片准确、完整、可追踪（来源图片与文字具有同等正式内容地位）；
2. 数字、单位、趋势和关系保真；
3. 页面角色和页面类型正确；
4. 内容可读、无溢出；
5. 组件语义正确、可编辑；
6. 视觉风格一致；
7. 装饰与氛围。

默认禁止：

- 只读取标题、不读取正文；
- 把内容页改成封面页或章节页；
- 用一句口号替代多组业务信息；
- 删除"次要"正式内容；
- 修改数字、单位、正负方向、同比/环比条件；
- 添加输入中不存在的数据和结论；
- 用整页图片替代可编辑内容；
- 为贴合视觉参考而强行复刻其版式；
- 静默删除来源图片（换模板、统一风格、控制密度或空间不足均不得作为删除理由）；
- 用占位符、通用图标或 AI 生成图替代来源证据图、产品图、人物图或界面截图。

---

## 3. 执行模式

### `plan`

只执行内容抽取、页面角色判断、页面类型路由、拆页和组件规划，不渲染 HTML。用于先验证“识别得对不对”。

### `render`

读取已确认的 `page_plan`，只执行组件映射、风格绑定、HTML 渲染和质量检查。不得重新判断页面类型。

### `full`

完整执行规划、渲染和检查。默认模式。

### `audit`

对已有页面检查内容遗漏、错误改写、页面类型误判、溢出和视觉规则违背。

---

## 4. 强制流水线

每次执行必须按以下顺序，不得跳过或调换：

```text
A. 定位并诊断上传 / 当前项目中的 PPTX；无 PPTX 时读取其他源材料
↓
A1. 【必须执行代码】用 Python 或 unzip 实际解包 PPTX，提取所有嵌入图片到 assets/source-media/
    必须使用 bash/Python 代码真实执行，不得只在规划文档中声明"已保留图片"
    执行命令示例：
      python3 -c "
      from pptx import Presentation; from pathlib import Path; import shutil
      prs = Presentation('source.pptx')
      Path('assets/source-media').mkdir(parents=True, exist_ok=True)
      idx = {}
      for i, slide in enumerate(prs.slides, 1):
          for shape in slide.shapes:
              if shape.shape_type == 13:
                  idx[i] = idx.get(i, 0) + 1
                  fname = f'slide-{i:02d}-asset-{idx[i]:02d}.{shape.image.ext}'
                  Path(f'assets/source-media/{fname}').write_bytes(shape.image.blob)
                  print(f'extracted: slide {i} -> {fname}')
      "
    详细脚本与备选方法见 rules/pptx_image_extraction.md
    扫描与提取必须在建立文字账本之前完成
    来源见：rules/source_media_extraction.md
↓
A2. 验证提取结果：ls assets/source-media/ 确认文件存在且不为空
↓
B. 建立 intake_result，再建立 source_asset_manifest（视觉资产账本）与 content_inventory（文字账本）
   两个账本均完成后，才能进行页面路由
↓
C. 建立 source_page_profile，识别分组、关系、顺序和页面目标
↓
D. 判断 pageRole：cover / section / content / closing
↓
E. 判断 semanticPattern：指标、并列、对比、流程、案例、中心关系、路径、画廊等
↓
F. 路由 pageType，并记录正向证据、负向证据、被拒绝类型和置信度
↓
G. 判断拆页，生成 contentMapping
↓
H. 选择 layoutComponent 与 requiredCapabilities
↓
I. 从模板库选择 templateId、校验 requiredSlots，并选择 wide / ultrawide 变体
↓
J. 执行规划前检查；通过后设置 structureFrozen = true
↓
K-0. 【必须执行代码】复制 Skill 视觉资产到项目 assets/
     背景图和 Logo 是 Skill 的 side-file，不在用户项目目录里，必须通过 bash 代码主动复制。
     Skill staging 目录名格式为 `.od-skills/autoboard-html-ppt-<hash>/`，其中 style 资产位于
     `style/assets/` 子目录下。执行以下脚本（三重 fallback，确保必定成功）：
```bash
#!/usr/bin/env bash
set -e
mkdir -p assets

# ── Fallback 1：staged skill 目录（标准路径）
SKILL_STAGE=$(ls -d .od-skills/autoboard-html-ppt-* 2>/dev/null | head -1)
if [ -n "$SKILL_STAGE" ] && [ -f "$SKILL_STAGE/style/assets/bg-cover.svg" ]; then
  SRC="$SKILL_STAGE/style/assets"
  echo "[K-0] Fallback-1 staged: $SRC"
  cp "$SRC/bg-cover.svg"   assets/bg-cover.svg
  cp "$SRC/bg-content.svg" assets/bg-content.svg
  cp "$SRC/bg-closing.svg" assets/bg-closing.svg
  cp "$SRC/logo.svg"       assets/logo.svg

# ── Fallback 2：从 SKILL.md preamble 获取绝对路径（daemon 会注入）
elif [ -f ".od-skills/autoboard-html-ppt-*/SKILL.md" ]; then
  SKILL_ABS=$(head -5 .od-skills/autoboard-html-ppt-*/SKILL.md 2>/dev/null \
    | grep "Skill root" | sed 's/.*: //')
  if [ -n "$SKILL_ABS" ] && [ -f "$SKILL_ABS/style/assets/bg-cover.svg" ]; then
    SRC="$SKILL_ABS/style/assets"
    echo "[K-0] Fallback-2 abs: $SRC"
    cp "$SRC/bg-cover.svg"   assets/bg-cover.svg
    cp "$SRC/bg-content.svg" assets/bg-content.svg
    cp "$SRC/bg-closing.svg" assets/bg-closing.svg
    cp "$SRC/logo.svg"       assets/logo.svg
  fi

# ── Fallback 3：从任意 .od-skills 子目录搜索（兜底）
else
  SRC=$(find .od-skills -name "bg-cover.svg" 2>/dev/null | head -1 | xargs dirname 2>/dev/null)
  if [ -n "$SRC" ] && [ -f "$SRC/bg-cover.svg" ]; then
    echo "[K-0] Fallback-3 search: $SRC"
    cp "$SRC/bg-cover.svg"   assets/bg-cover.svg
    cp "$SRC/bg-content.svg" assets/bg-content.svg
    cp "$SRC/bg-closing.svg" assets/bg-closing.svg
    cp "$SRC/logo.svg"       assets/logo.svg
  else
    echo "[K-0 ERROR] 所有 fallback 均失败，无法找到 bg-cover.svg"
    echo "  已扫描: $(ls .od-skills/ 2>/dev/null)"
    echo "  请确认 skill staging 成功，或手动将 style/assets/*.svg 复制到 assets/"
    exit 1
  fi
fi

# ── 验证 4 个文件均存在且非空
for f in assets/bg-cover.svg assets/bg-content.svg assets/bg-closing.svg assets/logo.svg; do
  if [ ! -s "$f" ]; then
    echo "[K-0 ERROR] $f 不存在或为空"
    exit 1
  fi
done
echo "[K-0 OK] 4 资产文件已就绪："
ls -lh assets/bg-cover.svg assets/bg-content.svg assets/bg-closing.svg assets/logo.svg
```
     必须确保以下 4 个文件在项目 assets/ 中真实存在，否则 HTML 里的背景图和 Logo 将显示为空白：
     - assets/bg-cover.svg
     - assets/bg-content.svg
     - assets/bg-closing.svg
     - assets/logo.svg
     K-0 失败时**禁止**继续输出 HTML；必须报告错误并停止。
↓
K. 绑定视觉风格、背景、Logo 和设计 Token
↓
L. 输出 HTML
↓
M. 执行文字覆盖率、来源图片覆盖率、页面路由、溢出、风格与可编辑性检查
   must_preserve 图片覆盖率必须达到 100%；任意来源图片未进入最终 HTML，均不得通过验收
↓
N. 失败时重组布局 / 更换变体 / 拆页；禁止删除正式内容
```

结构一旦冻结，风格 Skill 不得修改：

- `pageRole`
- `pageType`
- `layoutComponent`
- `contentRefs`
- `contentMapping`
- `splitDecision`
- `templateId`
- `templateSelection`

---

## 5. 页面角色硬门槛

页面角色与页面类型是两层概念。先判断角色，再判断类型。

### 5.1 `cover`

只有同时满足以下条件才允许：

- 页面是整份演示的首屏，或用户明确指定为封面；
- 内容主要是主题、演讲人、日期、单位；
- `metricCount = 0`；
- `chartCount = 0`；
- `processNodeCount = 0`；
- 独立正文模块不超过 1 个；
- `mustRenderItemCount <= 4`。

首屏只是必要条件，不是充分条件。单页数据稿即使是输入的第一页，也不能判为封面。

### 5.2 `section`

只有同时满足以下条件才允许：

- 页面用于章节切换或过渡；
- 存在明确章节编号、章节名或章节导语；
- 无指标、图表、流程、案例、对比、多个并列模块；
- 正文最多 1 条简短导语；
- 正文建议不超过 80 个汉字；
- `mustRenderItemCount <= 4`。

`SectionDividerPage` 是选择性类型，永远不能作为兜底。

### 5.3 `closing`

只有同时满足以下条件才允许：

- 位于演示结尾，或用户明确指定为封尾；
- 主要内容是感谢、Q&A、合作邀请、联系方式或品牌收束；
- 不承担复杂业务论证。

### 5.4 `content`

不满足以上硬门槛时，默认角色必须为 `content`。

只要出现任意一项，强制排除 `cover` 和 `section`：

- 1 个及以上正式指标；
- 2 个及以上同级业务对象；
- 问题—方法—结果关系；
- 流程、阶段、因果、公式或连接关系；
- 图表、产品截图或多张案例图；
- 需要解释、论证或证明的正文；
- `mustRenderItemCount > 4`。

详细规则见 `rules/page_role_router.md`。

---

## 6. 页面类型池

### Hero 类，仅在角色硬门槛通过后使用

- `CoverPage`
- `SectionDividerPage`
- `ClosingPage`

### 内容类

- `AgendaPage`
- `MetricOverviewPage`
- `MultiColumnComparisonPage`
- `EcosystemRelationshipPage`
- `StrategyPanoramaPage`
- `StageEvolutionPage`
- `DualCoreArchitecturePage`
- `FormulaDecompositionPage`
- `CaseStudyPage`
- `ProcessFlowPage`
- `CentralModelPage`
- `ShowcaseGalleryPage`
- `TransformationPage`
- `CapabilityRoadmapPage`
- `CapabilityMatrixPage`
- `ChartAnalysisPage`
- `StructuredContentPage`

`StructuredContentPage` 是唯一语义兜底。它必须使用内容型布局，不得使用大编号居中的 Hero 结构。

---

## 7. 内容保真与拆页

除非用户明确要求改写，否则正式文本按原文渲染。允许换行和拆分 DOM，但不得改变字面含义。

内容过多时按以下顺序处理：

```text
重新分组
→ 更换适配度更高的布局变体
→ 拆成连续页面
→ 重新核对全部 source-id
```

禁止缩小字号、压缩安全区、隐藏信息、使用省略号或只保留 AI 判断的“重点”。

同一源页面拆页时：

- 保持原始叙事顺序；
- 同一指标的数值、单位、趋势和说明不得拆散；
- 在标题中使用“（1/2）”等连续标识时，只能作为导航辅助，不得改写原始标题；
- 所有拆分页的 `sourcePageRefs` 必须保留。

---

## 8. 布局与组件

页面路由结果必须进一步映射到布局组件，而不是直接套视觉模板。

选择完布局组件后，必须读取 `rules/template_library.md`，再从匹配的
`Page Layout -> Content Pattern -> Reusable Component` 链路选择 `templateId`。
若内容账本包含来源图片、截图、产品图、人物图或场景图，还必须读取
`rules/image_text_composition.md`，选择图文搭配变体并保留媒体来源绑定。
所有内容页还必须读取 `rules/page_composition_library.md`，声明一个
`compositionVariant`、组件计划、信息链路与容量检查；不得默认套用卡片。
涉及闭环、能力升级、前后效果、漏斗、决策树、双轴优先级、KPI 塔或瀑布关系时，
还必须读取 `rules/advanced_relation_components.md`，并声明可审计的
`advancedRelationSpec`；关系证据不完整时必须回退到普通关系布局。
模板选择必须验证所有 `requiredSlots`、`contentCapacity`、`allowedComponents`
和 `prohibitedUses`；不匹配时应使用所列 `fallbackTemplates` 或拆页。

所有交付页面使用 `ultrawideVariant`。禁止把 2.67:1 参考结构横向缩放到
11:3；只能扩展间距、轨道、侧栏或图表域，并保持卡片、图片、截图和圆形组件
的比例不变。

首选布局：

- `HeroLayout`
- `AgendaLayout`
- `ColumnGridLayout`
- `HubBridgeLayout`
- `CaseStudyLayout`
- `ShowcaseGalleryLayout`
- `DualWingLayout`
- `RoadmapLayout`
- `ProcessLayout`
- `ChartAnalysisLayout`
- `StructuredContentLayout`

组件库未完成时，输出抽象能力并使用语义化 HTML 兜底；组件库完成后，由组件 Skill 映射真实 React 组件。

---

## 9. 风格、背景与 Logo

总控只在 `structureFrozen = true` 后绑定视觉风格。

风格 Skill 可以决定：

- 颜色、字体、字号、间距；
- Logo 资产、位置、大小和明暗版本；
- 背景图、卡片、线条、图标、图表视觉；
- 页面氛围和装饰。

风格 Skill 不得决定：

- 页面角色和页面类型；
- 正式内容数量；
- 内容删减或重写；
- 信息层级和内容区域映射。

背景图不得包含需要清晰渲染的 Logo。Logo 应由独立组件渲染，防止背景图片压缩后模糊。

---

## 10. 输出顺序

在 `debug = true` 或 `mode = plan/full` 时，按以下顺序输出或内部产生：

1. `content_inventory`
2. `intake_result`（优化 PPT 时必需）
3. `document_analysis`
4. `page_plan`
5. `component_plan`
6. `html_slides`
7. `quality_report`

页面规划至少包含：

```json
{
  "outputSlideIndex": 6,
  "sourcePageRefs": [6],
  "pageRole": "content",
  "pageType": "MultiColumnComparisonPage",
  "layoutComponent": "ColumnGridLayout",
  "templateId": "capability-pillar-matrix",
  "variant": "ThreeColumnsWithMetrics",
  "routingEvidence": {
    "positive": ["3 个同级预算类型", "存在多组指标"],
    "negative": ["不满足章节页硬门槛"],
    "rejectedTypes": ["SectionDividerPage", "CoverPage"],
    "confidence": 0.94
  },
  "contentRefs": ["source-031", "source-032"],
  "contentMapping": [],
  "templateSelection": {
    "canvasVariant": "ultrawideVariant",
    "adaptationActions": ["expanded inter-pillar gaps"]
  },
  "structureFrozen": true
}
```

---

## 11. 质量门禁

最终输出必须同时通过：

- 所有 `must-render` 内容均被唯一渲染；
- 数字、单位、百分比、趋势符号完全一致；
- 正式关系未被改变；
- 编辑备注未误渲染；
- 页面角色硬门槛通过；
- 内容页未误用 Hero 布局；
- 页面结构与语义模式一致；
- 无溢出、遮挡和低于最小字号；
- HTML 文本可编辑；
- 风格绑定未改变冻结结构。
- 模板 `requiredSlots` 已覆盖，`contentCapacity` 未超限，且未使用任何 `prohibitedUses`。
- 高级关系图已通过来源、算术和几何审计；不存在虚构闭环、比例、坐标、分支或增量。
- 所有交付页采用 3696 × 1008 `ultrawideVariant`；不存在 2.67:1 布局、截图、图片或卡片的横向拉伸。
- **【图片路径硬检查】** 所有 `<img>` 的 `src` 必须是有效的相对路径，且对应文件在 `assets/source-media/` 中真实存在；不得出现绝对路径（`/Users/`、`C:\`）或临时上传 URL；必须用 `ls assets/source-media/` 和路径验证脚本（见 `rules/pptx_image_extraction.md §8`）确认后才算通过。

整套 PPT 额外检查：

- 非首屏出现 `CoverPage` 时必须有用户明确指令；
- 连续两个及以上 Hero 页面默认判为异常；
- `SectionDividerPage` 占比异常高时，必须逐页提供章节证据；
- 如果大量不同内容页被路由为同一 Hero 结构，整套生成失败并重新路由。

---

## 12. 一句话原则

> 视觉参考只提供视觉语言，页面结构必须由真实内容决定；任何内容页都不能因为参考图像像章节页，就被压缩成“大编号 + 居中标题”。
