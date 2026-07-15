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
→ 组件容量规则
→ 风格视觉规则
```
