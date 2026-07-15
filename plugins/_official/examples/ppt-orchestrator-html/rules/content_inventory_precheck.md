# Content Inventory Precheck
# 内容账本前置检查规则

## 1. 目的

在总控 Skill 进行页面类型判断、拆页、组件调度和 HTML 生成前，必须先确认输入页面已经具备足够可靠的内容账本。

---

## 2. 每页必须具备的字段

```json
{
  "pageIndex": 1,
  "sourceType": "editable_slide | image_based_slide | mixed_slide | unknown_slide",
  "contentInventoryStatus": "ready | review_required | blocked",
  "contentInventory": [],
  "editInstructionInventory": [],
  "uncertainContentInventory": [],
  "layoutInventory": []
}
```

---

## 3. 状态定义

### 3.1 `ready`

满足：

- 正式内容已完整提取
- 无低置信关键内容
- 编辑备注已排除
- 页面可进入总控路由

### 3.2 `review_required`

满足：

- 大部分内容已提取
- 存在中置信 OCR 内容
- 存在需要人工确认的小字 / 单位 / 图表关系
- 可以生成草稿 HTML，但必须标记“不建议直接最终交付”

### 3.3 `blocked`

满足任一情况：

- 图片型页面未完成 OCR
- 未建立 content_inventory
- 关键标题缺失
- 大量数字 / 单位不确定
- 页面主要内容无法识别
- 正式内容与编辑备注无法区分

处理方式：

> 不进入 HTML 生成，先要求补充可编辑 PPT、高清图、原文材料或人工校对内容账本。

---

## 4. 进入 HTML 生成的门槛

只有以下状态允许生成 HTML：

```text
ready：允许生成最终 HTML
review_required：允许生成校对版 HTML，但必须输出复核清单
blocked：禁止生成 HTML
```

---

## 5. 检查清单

```text
[ ] 是否识别了页面源类型 sourceType
[ ] 是否建立了 content_inventory
[ ] 是否建立了 editInstructionInventory
[ ] 图片型内容是否包含 confidence
[ ] 低置信内容是否进入 uncertainContentInventory
[ ] 是否保留了数字、单位、趋势符号
[ ] 是否保留了图表与指标关系
[ ] 是否识别并排除了编辑备注
[ ] 是否能判断页面类型
[ ] 是否允许进入 HTML 生成
```
