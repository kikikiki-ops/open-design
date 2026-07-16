# Orchestrator ↔ Style Binding Contract

## 页面规划字段

总控输出至少包含：

```json
{
  "pageType": "AgendaPage",
  "pageRole": "content",
  "backgroundVariant": "content",
  "styleSkill": "ultrawide_business_growth",
  "canvas": {
    "width": 3696,
    "height": 1008
  },
  "delivery": {
    "format": "editable-html-deck",
    "independentSlides": true,
    "renderChecks": ["100-percent-canvas", "scaled-preview"]
  },
  "alignmentContract": {
    "contentBandId": "main-content-band",
    "heightMode": "shared-content-band",
    "moduleAlignment": ["top", "bottom", "equal-height"],
    "geometryCheck": "getBoundingClientRect",
    "maxErrorPx": 2
  },
  "overflowContract": {
    "auditFunction": "window.__odLayoutAudit",
    "requiredModes": ["100-percent-canvas", "scaled-preview"],
    "maxCanvasOverflowPx": 2,
    "maxSafeAreaOverflowPx": 2,
    "maxTextOverflowPx": 2,
    "failureAction": "reflow-or-split-before-delivery"
  },
  "requiredCapabilities": []
}
```

## 背景映射

```text
cover   → ../style/assets/bg-cover.svg
content → ../style/assets/bg-content.svg
closing → ../style/assets/bg-closing.svg
```

## Logo 映射

```text
fixedBrandLogo → ../style/assets/logo.svg
```

## 冲突优先级

```text
内容保真规则
→ 总控结构与拆页规则
→ 内容带 / 卡片对齐规则
→ 组件容量规则
→ 风格视觉规则
→ 装饰与氛围
```

## 同一内容带绑定

当 `alignmentContract.heightMode = shared-content-band` 时，风格层必须保留总控给出的
`contentBandId`、共同高度 `H`、一级模块边界和内部行轨道。风格层只能绑定颜色、字号、
圆角和阴影，不得为个别模块新增高度、`min-height`、位移或绝对定位。

“标题条 + 卡片列表”模块必须把标题区与卡片区拆为独立 Grid 行；单体数据、成果和图表
模块与同带模块共享外框高度。渲染完成后由页面执行 `getBoundingClientRect()` 几何验收。
