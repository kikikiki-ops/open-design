# Image Slide Parsing Rules
# 图片型 PPT 页面解析规则

## 1. 适用范围

适用于以下输入：

- 整页截图型 PPT
- 每页只有一张大图的 PPT
- 从图片转成 PPT 的页面
- 设计稿截图版 PPT
- 不可编辑 PDF / 图片页转入 PPT 的页面

---

## 2. 解析目标

图片页解析的目标不是“复刻截图”，而是生成可用于 HTML 型 PPT 重建的结构化信息：

- 标题
- 正文
- 数字
- 单位
- 百分比
- 标签
- 图表标注
- 流程节点
- 箭头关系
- 对比关系
- 层级关系
- 页面区域结构

最终输出：

```text
content_inventory
layout_inventory
visual_reference
uncertain_content_inventory
review_required_items
```

---

## 3. 视觉分区规则

解析图片页时，应先进行视觉分区，而不是直接把 OCR 文本平铺。

推荐分区类型：

```text
header_area
title_area
left_panel
center_panel
right_panel
metric_area
chart_area
process_area
footer_area
background_area
```

每个分区需要记录：

```json
{
  "regionId": "region-001",
  "role": "title_area",
  "bbox": [x, y, width, height],
  "contentRefs": ["source-001", "source-002"]
}
```

---

## 4. 内容识别规则

### 4.1 标题识别

优先识别：

- 页面最大字号文本
- 位于上方或中心的结论性文本
- 与页面其他内容有明显间距的文本

标题必须原样保留，不得改写。

### 4.2 指标识别

指标必须将以下信息作为一个整体识别：

```text
数字 + 单位 + 百分号 + 变化方向 + 指标说明
```

例如：

```text
175% ↑
3,580 万/天
45%+
同比增长 300%
降低 2x
```

不得只保留数字，丢失单位或说明。

### 4.3 关系识别

必须识别并保留：

- 箭头方向
- 阶段递进
- 左右对比
- 上下级关系
- 公式关系
- 输入与输出关系
- 原因与结果关系

例如：

```text
CTR × CVR → SCVR 提升
```

不得拆散为无关联的三个文本块。

---

## 5. 不确定内容处理

以下情况必须进入 `uncertain_content_inventory`：

- 小字无法确认
- 字符疑似 OCR 错误
- 数字 / 单位不确定
- 英文缩写识别不稳定
- 图表坐标轴无法确认
- 箭头方向不清晰
- 内容被遮挡或压缩

不确定内容不得直接进入最终 HTML 正文。

---

## 6. 人工确认输出

如果页面来自图片识别，且存在中低置信内容，输出必须包含：

```json
{
  "reviewRequired": true,
  "reviewItems": [
    {
      "id": "uncertain-001",
      "page": 3,
      "value": "疑似识别内容",
      "reason": "OCR 置信度不足 / 小字模糊 / 数字不确定"
    }
  ]
}
```

---

## 7. 允许作为视觉参考的信息

图片页本身可以作为视觉参考，用于：

- 页面大致构图
- 元素分布
- 视觉层级
- 图表相对位置
- 背景氛围参考

但不能直接作为最终 HTML 内容层。

---

## 8. 严禁事项

禁止：

- 把整页截图放进 HTML 作为最终页面
- 用截图替代可编辑文本
- 忽略 OCR 低置信度
- 为了生成完整页面而自动猜测小字
- 自动补全未识别内容
- 用“类似含义”的文本替换原始内容
- 把图片上的备注当正式内容
