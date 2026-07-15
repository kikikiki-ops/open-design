# HTML Output Contract
# HTML 型 PPT 输出规范

## 1. OpenDesign 可预览文件

最终输出必须写入项目根目录：

- `index.html`：完整 HTML 型 PPT deck，包含所有 slide。
- `index.html.artifact.json`：预览元数据，声明 `kind: "html"`、`entry: "index.html"`、`renderer: "html"`、`status: "complete"`。

禁止只输出 HTML 片段、Markdown 说明、JSON 计划，或只把文件写到 `.od-skills/`、`assets/`、临时目录中。

示例：

```json
{
  "version": 1,
  "kind": "html",
  "title": "HTML 型 PPT",
  "entry": "index.html",
  "renderer": "html",
  "status": "complete",
  "exports": ["html", "pdf", "zip"],
  "metadata": {
    "deck": true,
    "canvas": "3696x1008",
    "source": "ppt-orchestrator-html"
  }
}
```

## 2. 输出目标

输出必须是 HTML 型可编辑 PPT 页面。

每页应为独立 HTML Slide，不得输出整页图片化结果。

## 2. 页面尺寸

默认尺寸：

```css
.ppt-slide {
  width: 3696px;
  height: 1008px;
  position: relative;
  overflow: hidden;
}
```

## 3. 安全区

推荐安全区：

```css
.slide-safe-area {
  position: absolute;
  left: 220px;
  right: 220px;
  top: 90px;
  bottom: 90px;
}
```

## 4. 文本可编辑

所有文字必须是真实文本节点。

禁止：

- 将文字嵌入背景图
- 将整页导出为图片
- 将图表文字转为图片
- 用 canvas 绘制不可编辑文字
- 用 SVG outline 代替文本

## 5. 数据绑定

正式内容推荐绑定 `data-source-id`。

示例：

```html
<span data-source-id="source-023">3,580 万/天</span>
```

## 6. 页面元信息

每页 HTML 建议包含：

```html
<section
  class="ppt-slide"
  data-page-index="1"
  data-page-type="StageEvolutionPage"
  data-style-skill="ultrawide-business-growth"
>
</section>
```

## 7. 推荐 DOM 结构

```html
<section class="ppt-slide" data-page-type="MetricOverviewPage">
  <div class="slide-safe-area">
    <header class="slide-header">
      <div class="brand-area"></div>
    </header>

    <main class="slide-main">
      <section class="slide-title-area">
        <h1 data-source-id="source-001">页面标题</h1>
      </section>

      <section class="slide-content-area">
        <div class="metric-group">
          <article class="metric-card" data-source-id="source-002">
            <span class="metric-value">175%</span>
            <span class="metric-label">CTR 年同增长</span>
          </article>
        </div>
      </section>
    </main>
  </div>
</section>
```

## 8. CSS 输出要求

CSS 应尽量使用可复用 class，而不是大量无语义内联样式。

允许页面级 CSS，但需要保持：

- 结构清晰
- 命名稳定
- 便于前端编辑器识别
- 避免过多一次性 class

## 9. 图表处理

图表优先使用 HTML / CSS / SVG 结构化表达。

图表中的文字、数字、标签必须保留为可编辑文本。

## 10. 图片处理

如果原始 PPT 中存在素材图、截图、案例图：

- 图片可以作为图片元素保留
- 图片对应说明文字必须为真实文本
- 不得把整页合成一张图

## 11. 输出检查

HTML 输出后必须检查：

- 页面尺寸是否正确
- 是否为真实 HTML 文本
- 是否可编辑
- 是否有清晰 DOM 结构
- 是否存在文本溢出
- 是否存在内容被遮挡
- 是否存在无法编辑的整页图片


---

## 背景图 HTML 合同

每页根节点必须输出背景相关属性：

```html
<section
  class="ppt-slide"
  data-page-type="MetricOverviewPage"
  data-page-role="content"
  data-bg-variant="content"
>
</section>
```

背景层推荐结构：

```html
<div class="slide-background" aria-hidden="true">
  <img src="./assets/bg-content.png" alt="" />
</div>
```

内容层必须位于背景层之上，且全部正式文本保持可编辑 HTML 文本。

## 固定品牌信息输出限制

HTML 中不得自动生成与背景图重复的固定品牌信息。

禁止示例：

```html
<div class="brand-area">
  <span>快手联盟</span>
</div>
```

除非 `快手联盟` 来自原始 PPT 正式内容账本中的某条 `source-id`，否则不应输出。

允许保留空的品牌容器用于布局，但不得包含默认文本：

```html
<header class="slide-header" aria-hidden="true"></header>
```

## 独立 Logo HTML 输出规范

页面 HTML 应使用独立 Logo 组件，而不是依赖背景图。

推荐输出：

```html
<img
  class="fixed-brand-logo"
  src="https://p5-ad.adkwai.com/udata/pkg/ks-ad-fe/md-tools/quick-cut/6689:5117.b90a9c9d53932e9b.svg"
  data-asset-role="fixed-brand-logo"
  alt="快手联盟"
/>
```

如果本地 `assets/logo.svg` 不存在，可回退到远程 SVG：

```html
<img
  class="fixed-brand-logo"
  src="https://p5-ad.adkwai.com/udata/pkg/ks-ad-fe/md-tools/quick-cut/6689:5117.b90a9c9d53932e9b.svg"
  data-asset-role="fixed-brand-logo"
  alt="快手联盟"
/>
```

CSS：

```css
.fixed-brand-logo {
  position: absolute;
  left: 96px;
  top: 54px;
  width: 170px;
  height: auto;
  z-index: 5;
  pointer-events: none;
}
```

禁止输出重复品牌文字。
