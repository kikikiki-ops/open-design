# PPT Input Intake Rules
# PPT 输入诊断与解析前置规则

## 1. 目的

本规则用于解决草稿 PPT / 原版 PPT 中“每页都是图片、截图、不可编辑对象”导致总控 Skill 无法识别内容的问题。

总控 Skill 在进行页面类型判断、组件选择、HTML 生成之前，必须先判断输入页面的源类型：

- `editable_slide`：可编辑型页面
- `image_based_slide`：图片型页面 / 整页截图
- `mixed_slide`：混合型页面
- `unknown_slide`：无法判断

核心原则：

> 如果没有可靠的内容账本 `content_inventory`，不得直接进入 HTML 页面生成。

---

## 2. 输入源类型判断

### 2.1 可编辑型页面 `editable_slide`

满足以下特征之一：

- 页面中存在可编辑文本框
- 页面中存在可编辑形状 / 图表 / 表格
- 可以从 PPT XML 或页面结构中直接提取文字、数字、单位、层级与位置

处理方式：

1. 直接提取可编辑文本与对象结构
2. 建立 `content_inventory`
3. 建立 `layout_inventory`
4. 进入总控页面路由

---

### 2.2 图片型页面 `image_based_slide`

满足以下特征之一：

- 页面中可编辑文本数量为 0 或极少
- 页面中存在覆盖画布 80% 以上的大图
- 页面内容主要来自一张整页截图
- PPT 内部无法直接读取标题、正文、数字、图表标签

处理方式：

1. 不得直接判断页面类型
2. 不得直接生成 HTML 型 PPT
3. 必须先进入图片页解析流程
4. 通过高清截图 / OCR / 视觉分区生成内容账本
5. 低置信内容必须标记为需人工确认

---

### 2.3 混合型页面 `mixed_slide`

满足以下特征之一：

- 页面中部分文字可编辑，但主要图表或关键区域是图片
- 背景是图片，但正文是可编辑文本
- 标题可编辑，但数据图表是截图
- 页面存在多个局部截图

处理方式：

1. 优先提取可编辑对象
2. 对图片区域做 OCR / 视觉识别
3. 合并两类来源
4. 对来源进行标记：`editable_object` / `image_ocr`
5. 建立合并后的 `content_inventory`

---

## 3. 图片页解析流程

图片型页面必须执行以下流程：

```text
渲染页面为高清图
↓
识别页面区域
↓
OCR 提取文字、数字、单位、符号
↓
识别标题、正文、指标、标签、注释
↓
识别图表、箭头、连接线、层级关系
↓
生成 content_inventory
↓
生成 layout_inventory
↓
标记置信度
↓
进入人工确认或总控路由
```

---

## 4. OCR 置信度规则

所有来自图片识别的内容必须带 `confidence` 字段。

推荐阈值：

```text
confidence >= 0.95：高置信，可直接进入正式内容账本
0.85 <= confidence < 0.95：中置信，进入正式内容账本，但标记 reviewRequired
confidence < 0.85：低置信，进入 uncertain_content_inventory，不直接作为最终正文
```

特别敏感内容即使置信度较高，也建议标记复核：

- 百分比
- 金额
- 单位
- 英文缩写
- 专有名词
- 图表坐标
- 箭头方向
- 正负变化
- `↑` / `↓` / `+` / `-`
- 小字号注释

---

## 5. 图片页禁止直接生成规则

当页面被判定为 `image_based_slide` 且尚未生成可核对的 `content_inventory` 时，禁止：

- 直接进入页面类型判断
- 直接生成 HTML 页面
- 直接根据截图“猜”内容
- 只生成视觉相似页面
- 把整页截图作为 HTML 背景交付
- 用 OCR 结果无校验地替代正式内容
- 忽略小字、单位、标签和图表标注

必须先输出：

```json
{
  "sourceType": "image_based_slide",
  "contentInventoryStatus": "required_before_generation",
  "nextAction": "run_image_slide_parsing"
}
```

---

## 6. 内容账本前置校验

总控 Skill 进入页面路由前必须检查：

```text
[ ] 每页是否有 sourceType
[ ] 每页是否有 content_inventory
[ ] 图片型页面是否完成 OCR / 视觉解析
[ ] OCR 内容是否带 confidence
[ ] 低置信内容是否进入 uncertain_content_inventory
[ ] 编辑备注是否进入 edit_instruction_inventory
[ ] 页面是否允许进入 HTML 生成
```

如果未通过，必须先停止生成，并提示需要内容解析 / 人工确认。

---

## 7. 最终原则

图片型 PPT 可以作为视觉参考，但不能直接作为内容可信来源。  
总控 Skill 只能基于经过提取、标记、校验的 `content_inventory` 进行后续页面路由和 HTML 生成。
