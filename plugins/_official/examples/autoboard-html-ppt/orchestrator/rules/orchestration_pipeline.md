# Orchestration Pipeline

## 1. 两阶段生成

### Planner Pass

完成：内容抽取、结构分析、角色路由、页面类型、拆页、布局选择、内容映射和规划检查。

Planner Pass 结束时，必须设置：

```json
{"structureFrozen": true}
```

未通过规划检查时不得进入 Renderer Pass。

### Renderer Pass

只能读取冻结后的计划，完成组件映射、风格绑定、背景与 Logo 渲染、HTML 输出和终检。

Renderer Pass 不得重新选择 Hero / 内容页类型，不得减少 `contentRefs`。

## 2. 失败恢复

按以下顺序：

1. 调整内容分组；
2. 更换同一页面类型的布局变体；
3. 选择更准确的内容型页面类型；
4. 拆页；
5. 标记待人工确认。

不得通过删除正式内容或切换为低容量 Hero 页面解决。
