# Content Preservation Rules

## 0. 内容范围声明（P0）

正式文字、数字、单位、关系和**所有具有信息、证据、说明或品牌识别价值的来源图片均属于正式内容**，必须默认保留。

只有经资产扫描明确判定为纯装饰，或用户明确要求删除的图片，才允许省略。无法判断时**默认保留**。

> 详细的来源图片保留协议见 `rules/image_text_composition.md § P0`；
> 图片发现、提取、建账与验收的执行规则见 `rules/source_media_extraction.md`。

---

## 1. 双账本前置要求

生成前必须先完成**文字与视觉资产的双账本**：

1. **文字内容账本**（`content_inventory`）— 文字、数字、关系；
2. **来源图片资产账本**（`source_asset_manifest`）— 来源图片、来源页、保留策略。

两个账本均建立完成后，才能进行页面路由和模板选择。

文字内容账本中，正式内容使用原文，且每一项有唯一 `source-id`。

每项至少记录：

- 源页和阅读顺序；
- 内容类型；
- 原始文本；
- 数值、单位、趋势；
- 父级、分组与关系目标；
- 源页面坐标；
- 渲染策略。

## 2. 渲染策略

- `must-render`：必须在最终页面唯一出现；
- `optional`：装饰性或可替代信息，仍需记录；
- `do-not-render`：编辑备注或纯占位符；
- `pending-confirmation`：暂不进入正式正文，等待确认。

## 3. 数字绑定

以下应作为不可拆散的语义单元：

- 数值 + 单位；
- 数值 + 趋势；
- 指标名称 + 数值 + 时间/条件；
- 公式元素 + 运算符；
- 图表 + 标题 + 图例 + 结论。

例如 `3,580 万/天`、`45%+`、`175% ↑` 不得分别处理后错配。

## 4. 关系保真

必须保留：

- 同级并列；
- 上下级；
- 因果；
- 对比；
- 流程顺序；
- 阶段递进；
- 中心—外围；
- 策略—结果；
- 图片/图表—说明。

HTML 中建议使用 `data-group-id` 和 `data-relation-id` 绑定。

## 5. 改写权限

只有用户明确要求"优化、精简、改写、总结"时才能生成 `displayText`。即使改写，也必须保留 `rawText` 和来源绑定，并在质量报告中列出变化。

## 5.1 三种操作模式（必须在处理前声明）

AI 必须在处理 PPT 之前，根据用户指令确定当前模式，并在 `page_plan` 中声明 `preservationMode`：

### 模式 A：严格保真（`preservationMode: "verbatim"`）

**触发词**：无特殊指令、"保留原文"、"按原文生成"、"不要改"。
**这是默认模式。**

行为规则：
- 正式文字、数字、单位一字不改，使用 `rawText`
- 不得压缩段落、合并条目、替换同义词
- 允许调整排版结构（换行、缩进、分组），但不得更改文字
- 标题只能使用来源文字，不得"优化措辞"

### 模式 B：展示优化（`preservationMode: "display_optimize"`）

**触发词**："美化 PPT"、"让它更好看"、"优化标题"、"提升可读性"、用户未要求保留原文但也未要求精简。

行为规则：
- 允许压缩标题至 ≤ 20 字（原文 > 30 字时），须保留 `rawText`
- 允许将长段落（> 120 字）拆分为要点列表，条目不得增减内容
- 允许替换模糊措辞（"相关工作"→"市场拓展"），须保留 `rawText`
- **不允许**删除正式数字、指标、案例或图表标注
- 质量报告中必须列出所有 `displayText` ≠ `rawText` 的条目

### 模式 C：总结精简（`preservationMode: "summarize"`）

**触发词**："总结"、"精简"、"提炼核心"、"压缩到一页"、"只保留关键信息"。

行为规则：
- 允许删除次要信息，但每个被删除项**必须**在质量报告中记录删除理由
- 核心数字、关键案例、结论性指标**不得删除**
- 删除量 > 30% 的页面须在质量报告中标注
- 必须取得用户明确指令，**不得自行判断哪些是"次要"内容**

### 模式切换限制

- 单次生成中只允许使用一种模式，不得混用
- 模式 A → 模式 B/C 需要用户明确指令
- 模式 C 不得作为处理长内容的默认兜底方案

## 6. 拆页

拆页优先于删减。拆页后必须保持：

- 顺序；
- 分组；
- 指标语义单元；
- 源页面引用；
- 内容覆盖率 100%。

---

## 7. OCR 文字处理规范（P0）

### 7.1 文字来源优先级（从高到低）

```
用户明确输入
  > PPT 原生可编辑文字（从 python-pptx text_frame 读取）
  > 图表原始数据 / 嵌入工作簿
  > 高置信度 OCR（confidence ≥ 0.90）
  > 低置信度 OCR（confidence < 0.90）
```

**当同一区域同时存在原生文字和 OCR 文字时：**
- 使用原生文字；
- OCR 只用于核验，不得覆盖原生文字；
- 若两者存在实质差异，标记 `verificationStatus: "conflict"` 并写入质量报告。

### 7.2 OCR 内容必须携带元数据

每条 OCR 内容在 `content_inventory` 中必须使用如下结构，**不得直接写入 `rawText`**：

```json
{
  "id": "source-text-ocr-003",
  "sourceType": "ocr",
  "rawRecognition": "YoY +60%+",
  "confidence": 0.82,
  "sourceBBox": { "x": 0.02, "y": 0.59, "w": 0.31, "h": 0.04 },
  "sourcePage": 3,
  "verificationStatus": "verified | uncertain | conflict",
  "verifiedAgainst": "native_text | manual | cross_check | unverified"
}
```

`verificationStatus` 取值规则：
- `verified`：已与原生文字或其他来源交叉验证一致
- `uncertain`：识别置信度 < 0.90，或区域疑似装饰文字
- `conflict`：OCR 结果与原生文字或相邻 OCR 结果不一致

### 7.3 必须二次核验的内容类型

以下内容类型无论 OCR 置信度多高，**都必须进行二次核验**：

- 数字（`digits`）
- 百分比（`percentage`）
- 金额（`amount`）
- 日期（`date`）
- 单位（`unit`）
- 产品名 / 型号
- 人名 / 公司名
- 图表坐标轴标签
- 公式

二次核验方法（按优先级）：
1. 与同页原生文字对照
2. 与相邻页相同指标对照
3. 与用户输入的文字说明对照
4. 标记 `verificationStatus: "uncertain"` 并提示用户核验

### 7.4 OCR 错误的处理规则

**禁止行为：**
- 把 OCR 数字直接当成确定事实使用（如把 `3` 识别为 `8` 后写入结论）
- 把图表坐标轴数字当成正文数据
- 把装饰文字、页码、水印识别为正文
- 用低置信度 OCR 覆盖高置信度原生文字
- 把 `uncertain` 内容包装成确定结论

**当 OCR 置信度不足或冲突时：**
```
标记字段为 uncertain_source_text
在质量报告中列出，要求用户核验
不得自行猜测或"合理化"识别结果
```

---

## 8. Source Item 与 Render Instance 分离（P0）

### 8.1 概念定义

**Source Item**：来源事实的唯一记录。每条原始内容只建立一条 Source Item，不因渲染需要而复制。

**Render Instance**：某条 Source Item 在某个输出页面中的一次展示实例。同一 Source Item 可以有多个 Render Instance。

### 8.2 数据结构

```json
{
  "sourceId": "source-text-031",
  "rawText": "深度预算占比超过 50%",
  "sourcePage": 2,
  "renderInstances": [
    {
      "instanceId": "render-031-a",
      "outputPage": 2,
      "role": "primary",
      "displayText": "深度预算占比超过 50%"
    },
    {
      "instanceId": "render-031-b",
      "outputPage": 3,
      "role": "continuation_context",
      "displayText": "（承上）深度预算占比 >50%"
    }
  ]
}
```

### 8.3 允许多个 Render Instance 的情形

| `role` 值 | 含义 | 说明 |
|-----------|------|------|
| `primary` | 主要展示 | 每个 Source Item 只能有一个 primary |
| `continuation_context` | 跨页续接 | 拆页时延续上下文 |
| `legend` | 图例 | 与图表并列展示 |
| `annotation` | 标注 | 附属于图片或图表的说明 |
| `navigation_context` | 导航提示 | 章节过渡页重复标题 |
| `comparison_reference` | 对比参照 | 在对比页中用于参照的前项数据 |

### 8.4 禁止的重复情形

- 为填充空白页面复制正文
- 同一页面内无意义重复
- 重复展示同一 KPI 而不说明不同用途
- 拆页后同一内容在两页均标记为 `primary`

### 8.5 质量检查规则

质量检查**不得仅比较 DOM 节点数量**，必须检查：
- 来源覆盖率（每条 Source Item 是否有至少一个 primary render instance）
- 合理重复次数（非 primary 的 Render Instance 数量是否在合理范围）
- 重复用途（每个非 primary 的 role 是否有明确业务理由）
- 事实一致性（同一 Source Item 的所有 Render Instance 数字是否一致）

---

## 9. Source ID 命名规范（P0）

### 9.1 允许的 ID 格式

```
source-text-001              原生文字内容
source-text-001-fragment-01  段落拆分片段
source-media-001             来源图片或视觉资产
source-chart-001             来源图表（原生或截图）
source-table-001             来源表格
source-ocr-001               OCR 识别的文字内容
derived-display-001          AI 生成的展示文案（有来源引用）
generated-visual-001         AI 生成的纯装饰视觉
```

### 9.2 派生展示内容必须记录来源

任何通过 AI 生成或提炼的展示内容，必须使用以下结构：

```json
{
  "id": "derived-display-001",
  "sourceRefs": [
    "source-text-011",
    "source-text-012"
  ],
  "derivationType": "condense | split | merge | rephrase | translate",
  "derivationNote": "将两段增长数据合并为一句结论",
  "displayText": "提炼后的展示文案",
  "rawText": null
}
```

**禁止出现没有 `sourceRefs` 的业务结论。**

纯装饰视觉可以没有业务来源，但必须标记：
```json
{ "id": "generated-visual-001", "type": "non_semantic_visual" }
```

---

## 10. 来源类型（provenanceType）

### 10.1 支持的两类来源

**来源文件优化任务（改写已有 PPT）：**
```json
{
  "provenanceType": "source_document",
  "sourcePageRefs": [1, 2, 3],
  "promptContentRefs": []
}
```

**新建任务（只有用户输入，无来源页码）：**
```json
{
  "provenanceType": "user_prompt",
  "sourcePageRefs": [],
  "promptContentRefs": ["prompt-001", "prompt-002"]
}
```

### 10.2 规则

- 来源文件优化任务：`sourcePageRefs` 必须 ≥ 1 项，不得为空
- 新建任务：`sourcePageRefs` 允许为空，但 `promptContentRefs` 必须非空
- **不得伪造来源页码**（如对纯用户输入任务填写随机页码）
- 所有页面仍必须保留可追踪的内容来源（`sourcePageRefs` 或 `promptContentRefs` 二选一）
- `page_plan.schema.json` 中的 `sourcePageRefs` 的 `minItems` 约束**仅对 `provenanceType: "source_document"` 生效**

### 10.3 占位符识别规则（Problem 14）

占位符需同时满足**占位符词形 + 上下文表现为未完成内容**，缺一不可。

**可判定为占位符的上下文：**
```
负责人：XX
数据待补充
日期：TBD
金额：xxx 万
```

**以下内容禁止自动删除：**
- `同比提升 +3pp`（指标变化量）
- `Project XX`（项目名含占位符风格字符）
- `型号 XX-200`（产品型号）
- `第 XX 届`（届次数字待补充，但结构合法）

每个疑似占位符必须记录：
```json
{
  "text": "XX",
  "classification": "placeholder | valid_content | uncertain",
  "context": "负责人：XX",
  "confidence": 0.91,
  "action": "skip_render | render_with_warning | render_as_is"
}
```

只有 `confidence ≥ 0.85` 且 `classification: "placeholder"` 的内容才允许不渲染。
其余一律标记 `render_with_warning`，不得静默删除。
