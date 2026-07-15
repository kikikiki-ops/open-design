# Example Prompt

## 推荐：先规划，再渲染

### 第一步：规划模式

```text
请使用 PPT Orchestrator Skill V2，以 mode=plan 分析我上传的草稿 PPT。

要求：
1. 逐页建立 content_inventory 和 source_page_profile。
2. 页面角色必须通过 cover/section/content/closing 硬门槛。
3. 视觉参考只能影响风格，不能决定页面类型。
4. 输出每页的 routingEvidence、rejectedTypes、pageType、layoutComponent、contentMapping 和拆页判断。
5. 特别检查是否把内容页误判为封面或章节页。
6. 暂不生成 HTML。
```

### 第二步：渲染模式

```text
基于已确认的 page_plan，以 mode=render 生成 3696 × 1008 HTML 型 PPT。
不得重新路由页面类型，不得减少 contentRefs。
绑定指定视觉风格 Skill；背景与 Logo 独立渲染。
输出 HTML 和 quality_report。
```

## 端到端模式

```text
使用 mode=full 生成 HTML 型 PPT。正式内容不得改写、遗漏或新增；编辑指令与占位符不进入正文；内容过多时拆页；结构冻结后再绑定视觉风格。
```
