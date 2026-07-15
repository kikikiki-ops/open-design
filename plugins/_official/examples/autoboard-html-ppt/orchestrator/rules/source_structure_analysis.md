# Source Structure Analysis

## 1. 目标

除文本内容外，还要读取源页面的空间结构，用于理解信息关系，但不能机械复刻源页面的视觉样式。

## 2. 必须记录

- 文本框和图形的阅读顺序；
- 标题、正文、指标值、指标标签、单位；
- 位置与标准化边界框；
- 同一卡片、同一列、同一流程或同一图表的分组；
- 箭头、连线、括号、乘号等关系；
- 图片和图表与文字说明的绑定；
- 页面中是否存在章编号、页码、内部备注。

## 3. 页面语义特征

每个源页面形成：

```json
{
  "sourcePage": 6,
  "mustRenderItemCount": 14,
  "bodyCharCount": 176,
  "metricCount": 5,
  "peerGroupCount": 3,
  "processNodeCount": 0,
  "chartCount": 1,
  "imageCount": 0,
  "relationCount": 3,
  "hasSectionNumber": false,
  "hasSpeakerInfo": false,
  "semanticPatterns": ["parallel-groups", "metrics", "comparison"],
  "inferredGoal": "对比三类预算的现状与增长机会"
}
```

## 4. 使用限制

- 字号大不等于封面或章节页；
- 页面中心有大数字不等于章节编号，必须结合语义判断；
- 源 PPT 排版混乱时，以内容关系为准；
- 视觉参考图的空间结构仅在语义模式一致时才能复用。
