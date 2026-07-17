# HTML Output Contract

## 1. Deck 与 Slide 容器

完整演示必须使用可翻页的 deck 容器组织独立页面，禁止以纵向长页面或单张拼图交付。每个 slide 固定为 3696 × 1008，显示时可缩放预览，但不得改变其内部排版基准。

最终产物必须写入当前项目根目录：

- `index.html`：包含全部可翻页 slide 的可预览 HTML PPT。
- `index.html.artifact.json`：同级 Open Design artifact 元数据，声明 HTML 预览入口。

```json
{
  "kind": "html",
  "entry": "index.html",
  "renderer": "html",
  "status": "pending_runtime_audit",
  "source": "autoboard-html-ppt"
}
```

---

## 10. Artifact 与页面状态机（P0）

### 10.1 Artifact 状态枚举

```
draft                  → HTML 尚在生成中
pending_runtime_audit  → HTML 已生成，等待在浏览器中运行审计
complete               → 审计已在浏览器执行且全部页面通过
blocked                → 存在无法恢复的来源或渲染问题
```

**禁止：** 在生成 HTML 的同时直接将 `status` 写死为 `complete`。

正确流程：
```
生成 HTML → pending_runtime_audit
浏览器中运行 window.__odLayoutAudit() → 全部 pass → complete
浏览器中运行 window.__odLayoutAudit() → 存在 fail → blocked
无法运行审计（非浏览器环境）→ 保持 pending_runtime_audit
```

### 10.2 单页面状态枚举

每个输出页面在 `page_plan.json` 中必须有独立的 `slideStatus`：

```
planned                → 已规划，尚未渲染
rendered               → HTML 已生成，等待审计
pending_runtime_audit  → 审计中
pass                   → 该页面审计通过
failed_recoverable     → 失败但可通过换布局/拆页恢复
blocked                → 无法恢复（数据不可读、来源缺失等）
```

### 10.3 单页面失败处理流程

当某页面渲染失败时，**必须按以下顺序尝试恢复**，不得直接标记 `blocked`：

```
1. 尝试换用更简单的布局组件
2. 尝试拆页（将内容拆成 2 页）
3. 尝试安全降级（纯文字版本，无图表）
4. 仍失败 → 标记 slideStatus: blocked，保留页面位置（不删除）
```

**禁止：**
- 静默跳过失败页面（跳过但不提示）
- 用通用 Hero 页面替代失败页（掩盖问题）
- 因为一页失败就放弃整份 Artifact

### 10.4 整体 Artifact 状态规则

| 条件 | Artifact status |
|------|----------------|
| 所有页面 `pass` | `complete` |
| 部分页面 `pending_runtime_audit` | `pending_runtime_audit` |
| 存在 `blocked` 页面 | `blocked` |
| 尚在生成 | `draft` |

### 10.5 质量报告必须包含失败页面列表

```json
{
  "artifactStatus": "blocked",
  "blockedPages": [
    {
      "outputPage": 6,
      "sourcePages": [4],
      "reason": "embedded_chart_data_unreadable",
      "recoveryAttempts": ["换布局", "拆页"],
      "finalStatus": "blocked"
    }
  ],
  "passedPages": [1, 2, 3, 4, 5, 7, 8],
  "pendingPages": []
}
```> ⚠️ **Artifact 状态说明：** 常规 HTML 生成完成后，初始状态为 `pending_runtime_audit`。只有当 `window.__odLayoutAudit()` 在浏览器中执行且全部页面结果为 `pass` 时，才允许将状态更改为 `complete`。如存在无法自动恢复的来源或渲染问题，状态为 `blocked`。
`page_plan.json` 和 `quality_report.json`。这些辅助文件不能替代 `index.html`。

---

### 1.1 全局布局 CSS（必须逐字内嵌，不得省略任何一行）

```css
/* ── 全局重置：禁止 body/html 出现滚动条 ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  width: 100vw;
  height: 100vh;
  overflow: hidden;        /* 禁止出现任何全局滚动条 */
  background: #111418;
}

/* ── Deck 容器：填满视口，隐藏溢出 ── */
.deck-stage {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;        /* 禁止出现任何滚动条 */
}

/* ── Slide：绝对定位叠放，默认隐藏 ── */
/* ❌ 严禁写 position: relative — 会导致所有幻灯片纵向堆叠、出现滚动条 */
.ppt-slide {
  position: absolute;      /* 必须是 absolute，所有幻灯片叠放在 (0,0) */
  top: 0;
  left: 0;
  width: 3696px;
  height: 1008px;
  overflow: hidden;
  transform-origin: top left;
  display: none;           /* 默认隐藏，由 JS 控制 */
  isolation: isolate;
}
.ppt-slide.active {
  display: block;          /* 只有 .active 的 slide 可见 */
}
```

**常见错误（禁止）：**
- `position: relative` → 所有幻灯片垂直堆叠，出现滚动条，预览失效
- 省略 `overflow: hidden` on `.deck-stage` → 幻灯片溢出视口
- 省略 `html, body { overflow: hidden }` → 全页滚动条出现
- 用 `visibility: hidden` 代替 `display: none` → 无法被 scaleActive 正确检测

---

### 1.2 幻灯片缩放 JS（必须逐字内嵌，不得省略）

```html
<script>
(function () {
  /* ── 幻灯片缩放：根据视口自动计算 scale ── */
  var CANVAS_W = 3696;
  var CANVAS_H = 1008;
  var slides = Array.from(document.querySelectorAll('.ppt-slide'));

  function scaleActive() {
    var navEl = document.getElementById('nav-hud');
    var navH  = navEl ? navEl.offsetHeight : 0;
    var vw    = window.innerWidth;
    var vh    = window.innerHeight - navH;
    var scale = Math.min(vw / CANVAS_W, vh / CANVAS_H);
    var offsetX = (vw - CANVAS_W * scale) / 2;
    var offsetY = (vh - CANVAS_H * scale) / 2;
    slides.forEach(function (s) {
      s.style.transform       = 'scale(' + scale + ')';
      s.style.transformOrigin = '0 0';
      s.style.left = offsetX + 'px';
      s.style.top  = offsetY + 'px';
    });
  }

  window.addEventListener('resize', scaleActive);
  document.addEventListener('DOMContentLoaded', scaleActive);
  window.addEventListener('load', scaleActive);
  /* 多次 nudge 确保 iframe 首次非零尺寸时正确缩放 */
  setTimeout(scaleActive, 50);
  setTimeout(scaleActive, 200);
})();
</script>
```

**必须**：此 `<script>` 紧跟 `<body>` 开始后或放在 `</body>` 前均可，但必须在导航脚本之前加载，且必须包含 `DOMContentLoaded` 和 `load` 两个监听器。

---

### 1.3 导航 JS（必须逐字内嵌，不得省略）

```html
<script>
(function () {
  var slides = Array.from(document.querySelectorAll('.ppt-slide'));
  var total  = slides.length;
  var current = 0;

  function goTo(idx) {
    if (idx < 0 || idx >= total) return;
    slides[current].classList.remove('active');
    current = idx;
    slides[current].classList.add('active');
    /* 通知 Open Design 宿主当前页码 */
    try {
      window.parent.postMessage({ type: 'od:slide-state', active: current, count: total }, '*');
    } catch (_) {}
  }

  /* 键盘导航 */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') goTo(current + 1);
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp'   || e.key === 'PageUp')   goTo(current - 1);
    if (e.key === 'Home') goTo(0);
    if (e.key === 'End')  goTo(total - 1);
  });

  /* 响应 Open Design 宿主的翻页指令 */
  window.addEventListener('message', function (ev) {
    var data = ev && ev.data;
    if (!data || data.type !== 'od:slide') return;
    if (data.action === 'next')  goTo(current + 1);
    if (data.action === 'prev')  goTo(current - 1);
    if (data.action === 'first') goTo(0);
    if (data.action === 'last')  goTo(total - 1);
    if (data.action === 'go' && typeof data.index === 'number') goTo(data.index);
  });

  /* 首次上报 slide 数量 */
  window.addEventListener('load', function () {
    try {
      window.parent.postMessage({ type: 'od:slide-state', active: current, count: total }, '*');
    } catch (_) {}
  });
})();
</script>
```

---

### 1.4 HTML 骨架（完整结构参考）

```html
<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<title>AutoBoard HTML PPT</title>
<style>
/* 1.1 全局布局 CSS（见上文） */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 100vw; height: 100vh; overflow: hidden; background: #111418; }
.deck-stage { position: relative; width: 100vw; height: 100vh; overflow: hidden; }
.ppt-slide {
  position: absolute; top: 0; left: 0;
  width: 3696px; height: 1008px;
  overflow: hidden; transform-origin: top left;
  display: none; isolation: isolate;
}
.ppt-slide.active { display: block; }
/* … 其余样式 Token、组件 CSS … */
</style>
</head>
<body>

<main class="deck-stage" id="deck-stage" data-canvas-width="3696" data-canvas-height="1008">

  <section class="ppt-slide active" data-slide-index="1" …>…</section>
  <section class="ppt-slide"        data-slide-index="2" …>…</section>
  <!-- … 其余 slide … -->

</main>

<!-- 1.2 缩放 JS -->
<script>…scaleActive…</script>

<!-- 1.3 导航 JS -->
<script>…goTo + od:slide 监听…</script>

<!-- 9. 溢出审计 JS -->
<script>…window.__odLayoutAudit…</script>

</body>
</html>
```

> **重要**：`<main>` 必须带 `id="deck-stage"`，让 Open Design 预览桥识别为框架 deck，正确接管翻页计数。

---

### 1.5 artifact.json

```json
{
  "kind": "html",
  "entry": "index.html",
  "renderer": "html",
  "status": "pending_runtime_audit",
  "source": "autoboard-html-ppt"
}
```

优化 `.pptx` 时还必须输出 `intake_result.json`、`content_inventory.json`、

**规则：index.html 中的背景图和 Logo 必须引用用户项目的 `assets/` 目录下的本地文件，不得引用绝对路径或 skill 内部路径。**

生成前必须已执行 K-0 步骤，将 skill 资产复制到 `assets/` 中，然后 HTML 里这样引用：

| 页面角色 | bg-img src | 说明 |
|---|---|---|
| `cover` | `assets/bg-cover.svg` | 封面背景 |
| `content` / `section` / `contents` | `assets/bg-content.svg` | 内容页背景 |
| `closing` | `assets/bg-closing.svg` | 封底背景 |
| Logo（所有页面） | `assets/logo.svg` | 快手联盟 Logo |

**禁止：**
- `src="/Users/.../bg-cover.svg"` — 绝对本机路径，其他人打开就 404
- `src=".od-skills/style-xxx/assets/bg-cover.svg"` — skill staging 目录，不是用户项目的持久资产
- `src="https://..."` for Logo — 网络不稳定时 Logo 丢失（除非 logo.svg 本地文件确实不存在）
- `background-image: url(...)` 替代 `<img class="bg-img">` — 违反 §4 规则

**每页 slide 的背景图和 Logo 正确写法：**

```html
<section class="ppt-slide active" data-page-role="cover" …>
  <!-- ① 背景图：第一个子元素，z-index:0 -->
  <img class="bg-img" src="assets/bg-cover.svg" alt="" aria-hidden="true" />
  <!-- ② Logo：紧跟背景图之后，safe-zone 之前 -->
  <img class="fixed-brand-logo" src="assets/logo.svg" alt="快手联盟" data-asset-role="fixed-brand-logo" />
  <!-- ③ 内容 safe-zone -->
  <div class="slide-safe-zone">…</div>
</section>

<section class="ppt-slide" data-page-role="content" …>
  <img class="bg-img" src="assets/bg-content.svg" alt="" aria-hidden="true" />
  <img class="fixed-brand-logo" src="assets/logo.svg" alt="快手联盟" data-asset-role="fixed-brand-logo" />
  <div class="slide-safe-zone">…</div>
</section>

<section class="ppt-slide" data-page-role="closing" …>
  <img class="bg-img" src="assets/bg-closing.svg" alt="" aria-hidden="true" />
  <img class="fixed-brand-logo" src="assets/logo.svg" alt="快手联盟" data-asset-role="fixed-brand-logo" />
  <div class="slide-safe-zone">…</div>
</section>
```

**对应 CSS（必须内嵌）：**

```css
.bg-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
  pointer-events: none;
  z-index: 0;
}

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

**交付验证：**
```bash
# 验证 4 个资产文件都存在
ls -lh assets/bg-cover.svg assets/bg-content.svg assets/bg-closing.svg assets/logo.svg
# 验证 HTML 中无绝对路径 (不能出现 /Users/ 或 C:\)
grep -n "bg-img\|fixed-brand-logo" index.html | grep -v "assets/bg-\|assets/logo"
# 以上 grep 输出必须为空
```

---

### 1.7 主标题位置规范（硬约束）

> **来源**：完全遵循 `style/example.html` 实际 HTML 结构（`safe-zone > flex-col > padding-top:var(--space-40) > 首个子元素`）与 `style/examples/example_prompt.md §1.5–§1.6`，任何偏差均视为生成错误。

#### 一、safe-zone 位置定义

```css
.safe-zone {
  position: absolute;
  left: 220px; right: 220px;
  top: 90px; height: 828px;   /* = 1008 - 90 - 90 */
  z-index: 10;
}
```

内容页主标题必须位于 `.safe-zone` 内，使用 `padding-top: var(--space-40)` (40px) 作为标题区起始偏移。

#### 二、内容页（`data-page-role="content"` / `"section"` / `"contents"`）

**标准骨架（必须逐字使用）：**

```html
<div class="safe-zone">
  <!-- 外层 flex-col，height:100% 撑满安全区，padding-top:40px 顶部留白 -->
  <div class="flex-col" style="height:100%; padding-top:var(--space-40); gap:var(--space-16);">

    <!-- ① 页面主标题行（必须是 flex-col 内第一个子元素，align-items:center 垂直居中）-->
    <div style="flex-shrink:0; display:flex; align-items:center; gap:var(--space-16); padding:var(--space-24) 0;">
      <h2 class="title-xl" style="margin:0; line-height:1;">页面主题</h2>
      <!-- 副说明（可选，约为主标题的 30–40% 字号）-->
      <span style="font-size:26px; color:var(--text-muted); font-weight:400;">副说明（可选）</span>
    </div>

    <!-- ② 主体内容区（flex:1 填满剩余高度）-->
    <div style="flex:1; min-height:0;">
      <!-- 卡片、列表、图表等主体内容 -->
    </div>

  </div>
</div>
```

**字号规范（与 `example.html` 一致）：**

| 类别 | class | font-size | font-weight |
|------|-------|-----------|-------------|
| 内容页主标题 | `.title-xl` | `72px` | `600` |
| 目录页主标题 | `.title-toc` | `82px` | `600` |
| 章节标题（大） | `.section-title-lg` | `44px` | `500` |
| 章节标题（小） | `.section-title-sm` | `28px` | `500` |

#### 三、封面页（`data-page-role="cover"`）

封面页使用**全屏垂直居中**布局，不使用 `padding-top` 顶部偏移：

```html
<div class="safe-zone">
  <div class="flex-col items-center justify-center text-center" style="height:100%; gap:32px;">
    <!-- 小标签（可选）-->
    <div class="card-header">2026 品牌营销峰会</div>
    <!-- 封面主标题：148px，居中 -->
    <h1 class="title-cover" style="max-width:2200px; line-height:1.08;">
      快手联盟<br><span class="gold-text">生意确定性</span>年度发布
    </h1>
    <!-- 副标题（可选）-->
    <p class="subtitle" style="max-width:1600px; color:var(--text-body);">
      以真实用户为核心，用数据驱动生意增长
    </p>
  </div>
</div>
```

#### 四、封底页（`data-page-role="closing"`）

封底页同封面，全屏垂直居中，主标题使用 `.title-cover`（148px）或根据内容适当缩小。

#### 五、Title Group 对齐规则（副标题对齐）

| 规则 | 说明 |
|------|------|
| 主标题水平位置 | 相对 safe-zone 左对齐（不强制全局居中） |
| 副标题位置 | 主标题右侧，`align-items:center`（视觉中心对齐） |
| 主标题 `line-height` | 必须设为 `1`，消除隐式行高避免副标题视觉错位 |
| 标题区与主体内容间距 | `48–64px`（用 `padding:var(--space-24) 0` 实现，不用 `margin-bottom` 硬编码） |

#### 六、禁止项（违反则标题位置错误）

| ❌ 禁止 | 原因 |
|---------|------|
| `align-items:baseline` | 大小字号基线不同，副标题视觉下沉 |
| 在 safe-zone 外放置主标题 | 超出安全区，会与 Logo 重叠或被裁切 |
| 用卡片 banner 色块替代主标题 | 违反 §1.5 规定的 `h2.title-xl` 要求 |
| 标题字号 < 28px | 低于最小可见标题 `.section-title-sm` 基准 |
| 内容页省略主标题直接填满卡片 | 破坏页面层级，违反 §1.5 硬约束 |
| 主标题放在 safe-zone 内的 `padding-top:0` 位置 | 紧贴 safe-zone 顶部边缘，无顶部呼吸感（正确应为 `padding-top:40px`） |
| 封面页使用 `padding-top:40px` 偏上布局 | 封面应全屏 `justify-content:center` 居中，不是顶部对齐 |

#### 七、对应 CSS Token（必须内嵌）

```css
/* 标题 Token（来自 example.html :root）*/
--font-cover-title:     148px;   /* 封面 h1 */
--font-toc-title:        82px;   /* 目录页 */
--font-title-xl:         72px;   /* 内容页主标题 */
--font-section-title-lg: 44px;   /* 章节标题大 */
--font-section-title-sm: 28px;   /* 章节标题小 */
--weight-title:    600;
--weight-section:  500;
--space-40: 40px;   /* safe-zone 内 padding-top */
--space-24: 24px;   /* Title Group 上下 padding */
--space-16: 16px;   /* flex-col gap */

.title-cover { font-size: var(--font-cover-title); font-weight: var(--weight-title); color: var(--text-primary); line-height: 1.08; letter-spacing: -.03em; }
.title-toc   { font-size: var(--font-toc-title);   font-weight: var(--weight-title); color: var(--text-primary); line-height: 1.1;  letter-spacing: -.02em; }
.title-xl    { font-size: var(--font-title-xl);    font-weight: var(--weight-title); color: var(--text-primary); line-height: 1.15; letter-spacing: -.02em; }
.section-title-lg { font-size: var(--font-section-title-lg); font-weight: var(--weight-section); color: var(--text-primary); line-height: 1.25; }
.section-title-sm { font-size: var(--font-section-title-sm); font-weight: var(--weight-section); color: var(--text-primary); line-height: 1.3; }
```

### 1.8 卡片样式变体速查表（硬约束：不得全局只用一种）

本节从 `style/example.html` 提取全部卡片样式，**AI 生成 HTML 时必须按 `layout_selection.md §6` 的调度规则轮换使用，禁止所有页面只用 S1（`.card`）**。

#### 一、完整卡片 CSS Token（必须内嵌到 `<style>` 中）

```css
/* ── S1: 通用卡片（金色描边白底）── */
.card {
  background: var(--white-card);
  border: 1px solid rgba(213,174,121,.35);
  border-radius: 22px;
  box-shadow: 0 10px 28px rgba(11,45,58,.04);
  padding: var(--space-32) var(--space-40);
  overflow: hidden;
}

/* ── S2: 子卡片（浅金描边，小圆角）── */
.card-sm {
  background: var(--white-card);
  border: 1px solid rgba(213,174,121,.20);
  border-radius: 16px;
  box-shadow: 0 6px 18px rgba(11,45,58,.04);
  padding: var(--space-16) var(--space-24);
  overflow: hidden;
}

/* ── S3: 青绿卡（能力 / 增长方向）── */
.card-teal {
  background: var(--teal-soft);          /* rgba(79,155,144,.08) */
  border: 1px solid rgba(79,155,144,.25);
  border-radius: 16px;
  padding: var(--space-16) var(--space-24);
  overflow: hidden;
}

/* ── S4: 金色卡（核心结论 / 重点强调）── */
.card-gold {
  background: linear-gradient(120deg, rgba(213,174,121,.12), rgba(229,205,174,.18));
  border: 1px solid rgba(213,174,121,.35);
  border-radius: 16px;
  padding: var(--space-16) var(--space-24);
  overflow: hidden;
}

/* ── S5: 标题条（金色渐变横条，非正文卡）── */
.card-header {
  background: linear-gradient(90deg, #D5AE79 0%, #E5CDAE 100%);
  border-radius: 10px;
  padding: 8px 20px;
  display: inline-flex;
  align-items: center;
  font-size: 20px;
  font-weight: 600;
  color: #0B2D3A;
}

/* ── S6: 无边框开放卡（左侧竖线装饰，文字主导）── */
.card-borderless {
  background: transparent;
  border: none;
  border-left: 3px solid var(--gold-main);
  border-radius: 0;
  padding: var(--space-16) var(--space-24);
}

/* ── S7: 深色强调卡（对比"当前 vs 目标"暗侧）── */
.card-dark {
  background: var(--dark-surface);       /* #0B2D3A 或近似深色 */
  border: 1px solid rgba(79,155,144,.30);
  border-radius: 22px;
  padding: var(--space-32) var(--space-40);
  color: var(--text-on-dark, #F5F1EB);
  overflow: hidden;
}

/* ── 案例卡组（CaseStudy专用）── */
.case-study-card {
  flex: 0 0 calc((100% - 56px) / 3);
  box-sizing: border-box;
  height: var(--case-study-card-height, 230px);
}
.case-study-card-group {
  display: flex;
  align-items: stretch;
  gap: 28px;
}
```

#### 二、各卡片样式适用场景与视觉特征

| 代号 | class | 视觉特征 | 适用页面类型 |
|-----|-------|---------|------------|
| S1 | `.card` | 白底 + 金色描边 22px圆角 + 大阴影 | 通用说明、成果对比、三等分能力 |
| S2 | `.card-sm` | 白底 + 极浅金描边 16px圆角 + 小阴影 | 步骤节点、子指标、内嵌列表项 |
| S3 | `.card-teal` | 青绿软底 + 青绿描边 | 能力模块、增长策略、机会方向 |
| S4 | `.card-gold` | 金色渐变底 + 金色描边 | 核心结论、关键数字、最强结果 |
| S5 | `.card-header` | 金色渐变横条 | 封面/章节小标签（非内容卡） |
| S6 | `.card-borderless` | 无背景 + 左竖线金色 | 要点列表、文字主导低密度页 |
| S7 | `.card-dark` | 深色背景 + 青绿描边 | 前后对比暗侧、警示/挑战卡 |

#### 三、多样性示例——连续 3 页的调度

```
第 3 页（MetricOverviewPage）→ 卡片主样式 S1（.card）白底金边
第 4 页（CaseStudyPage）     → 卡片主样式 S2+S4（小步骤卡+金色结果卡）
第 5 页（StrategyPanoramaPage）→ 卡片主样式 S6（无边框左竖线）+ S3（青绿子卡）
第 6 页（DualChainPage）     → 卡片主样式 S2（小步骤卡列表）
第 7 页（ThreeColumnPage）   → 卡片主样式 S1+S7（白底卡+深色对比卡）
```

#### 四、禁止项

- ❌ 整份 PPT 所有内容页只用 `.card`（S1 金边白底）
- ❌ 连续 3 页以上内容页的卡片主样式相同
- ❌ 把 `.card-header` 当内容卡片大量使用（仅限标签/横条装饰）
- ❌ 用 `style="background:#xxx"` 内联色绕过样式系统制造"假多样性"
- ❌ 只在封面/目录页用特殊样式，内容页全部退回 S1

---

## 2. Slide 容器

**第一个 slide 必须带 `.active` 类**，其余不带。

```html
<!-- 第一页：带 active -->
<section
  class="ppt-slide active"
  data-slide-index="1"
  data-source-pages="1"
  data-page-role="cover"
  data-page-type="CoverPage"
  data-layout-component="HeroLayout">
</section>

<!-- 其余页：不带 active（由 JS 控制） -->
<section
  class="ppt-slide"
  data-slide-index="6"
  data-source-pages="6"
  data-page-role="content"
  data-page-type="MultiColumnComparisonPage"
  data-layout-component="ColumnGridLayout"
  data-page-variant="ThreeColumnsWithMetrics">
</section>
```

每页必须声明画布、角色、背景和来源页。`data-slide-index` 从 1 开始连续编号；拆分页仍保留原始 `data-source-pages`。

## 3. 来源与关系绑定

正式内容必须带：

```html
data-source-id="source-031"
```

分组和关系建议带：

```html
data-group-id="group-006-01"
data-relation-id="relation-006-02"
```

组件必须带：

```html
data-component-role="metric-card"
```

## 4. DOM 顺序

DOM 阅读顺序应与内容账本的叙事顺序一致，不能仅通过绝对定位制造视觉顺序。

## 5. 可编辑性

标题、正文、数字、单位、标签、图例和图表说明必须为真实可编辑 DOM。禁止把整页或正文烘焙成图片。

## 6. 风格 Token

使用 CSS variables 接收视觉风格，不得在总控中硬编码整套色彩。

## 7. 超宽屏

固定画布 `3696 × 1008`；内容区横向展开，但不得将普通 16:9 卡片无限拉宽。通过列数、间距、分组和横向叙事利用宽度。

## 8. 交付检查

- 每个 `must-render` 内容节点都应有 `data-source-id`；
- 所有独立 slide 在 100% 尺寸和缩放预览下均不得出现溢出、遮挡或裁切；
- 会议名称、日期、演讲人、联合品牌、二维码只有在源材料或用户指令中存在时才允许渲染；
- Logo、标题、正文、数字、图表标签和二维码不得烘焙进背景图或整页图片。

## 9. 必须内嵌的溢出审计

所有交付 HTML 必须在导航与缩放逻辑之后定义并调用 `window.__odLayoutAudit()`。该函数必须逐页检查，即使 slide 当前处于隐藏状态也不得跳过。

```html
<script>
(function () {
  var CANVAS_W = 3696;
  var CANVAS_H = 1008;
  var SAFE = { left: 220, right: 3476, top: 90, bottom: 918 };
  var TOLERANCE = 2;

  function logicalRect(rect, slideRect, scale) {
    return {
      left: (rect.left - slideRect.left) / scale,
      top: (rect.top - slideRect.top) / scale,
      right: (rect.right - slideRect.left) / scale,
      bottom: (rect.bottom - slideRect.top) / scale
    };
  }

  window.__odLayoutAudit = function () {
    var slides = Array.from(document.querySelectorAll('.ppt-slide'));
    var result = { status: 'pass', canvas: { width: CANVAS_W, height: CANVAS_H }, slides: [] };

    slides.forEach(function (slide) {
      var wasHidden = getComputedStyle(slide).display === 'none';
      var priorDisplay = slide.style.display;
      var priorVisibility = slide.style.visibility;
      if (wasHidden) {
        slide.style.display = 'block';
        slide.style.visibility = 'hidden';
      }

      var issues = [];
      var slideRect = slide.getBoundingClientRect();
      var scale = slideRect.width / CANVAS_W || 1;
      if (slide.scrollWidth > CANVAS_W + TOLERANCE || slide.scrollHeight > CANVAS_H + TOLERANCE) {
        issues.push({ code: 'canvas-scroll-overflow', width: slide.scrollWidth, height: slide.scrollHeight });
      }

      Array.from(slide.querySelectorAll('[data-source-id]')).forEach(function (node) {
        var rect = logicalRect(node.getBoundingClientRect(), slideRect, scale);
        var outsideCanvas = rect.left < -TOLERANCE || rect.top < -TOLERANCE || rect.right > CANVAS_W + TOLERANCE || rect.bottom > CANVAS_H + TOLERANCE;
        var outsideSafe = !node.hasAttribute('data-allow-safe-overflow') && (rect.left < SAFE.left - TOLERANCE || rect.top < SAFE.top - TOLERANCE || rect.right > SAFE.right + TOLERANCE || rect.bottom > SAFE.bottom + TOLERANCE);
        if (outsideCanvas || outsideSafe) issues.push({ code: outsideCanvas ? 'canvas-clip' : 'safe-area-overflow', sourceId: node.dataset.sourceId, rect: rect });
      });

      Array.from(slide.querySelectorAll('[data-bounded-stack]')).forEach(function (stack) {
        var stackRect = logicalRect(stack.getBoundingClientRect(), slideRect, scale);
        var cards = Array.from(stack.children).filter(function (child) { return child.classList.contains('card'); });
        var expected = Number(stack.dataset.cardCount);
        if (expected && cards.length !== expected) issues.push({ code: 'bounded-stack-card-count', expected: expected, actual: cards.length });
        cards.forEach(function (card, index) {
          var cardRect = logicalRect(card.getBoundingClientRect(), slideRect, scale);
          if (cardRect.top < stackRect.top - TOLERANCE || cardRect.bottom > stackRect.bottom + TOLERANCE) {
            issues.push({ code: 'bounded-stack-overflow', cardIndex: index + 1 });
          }
        });
      });

      Array.from(slide.querySelectorAll('h1,h2,h3,h4,p,li,dt,dd,strong,span')).forEach(function (node) {
        if (!node.textContent.trim() || node.clientWidth === 0 || node.clientHeight === 0) return;
        if (node.scrollWidth > node.clientWidth + TOLERANCE || node.scrollHeight > node.clientHeight + TOLERANCE) {
          issues.push({ code: 'text-overflow', text: node.textContent.trim().slice(0, 48) });
        }
        var overflow = getComputedStyle(node).overflow;
        if (overflow === 'hidden' || overflow === 'clip') issues.push({ code: 'text-clipping-style', text: node.textContent.trim().slice(0, 48) });
      });

      result.slides.push({ slideIndex: Number(slide.dataset.slideIndex), issues: issues, checkedSourceNodes: slide.querySelectorAll('[data-source-id]').length, checkedTextNodes: slide.querySelectorAll('h1,h2,h3,h4,p,li,dt,dd,strong,span').length });
      if (issues.length) result.status = 'fail';

      if (wasHidden) {
        slide.style.display = priorDisplay;
        slide.style.visibility = priorVisibility;
      }
    });

    document.documentElement.dataset.odLayoutAudit = result.status;
    return result;
  };
})();
</script>
```

生成器必须在 100% 画布与缩放预览各调用一次。若任一结果不是 `pass`，必须按 `layout_overflow_protocol.md` 重排或拆页，不能交付。

### `window.__odLayoutAudit` 环境降级处理

> **问题背景**：`window.__odLayoutAudit()` 依赖浏览器 DOM 的 `getBoundingClientRect()`。在非浏览器环境（Node.js 服务端渲染、AI 直接生成但不运行 HTML、Jest 单元测试等）中无法执行，若不做处理会导致静默失败。

**生成规则：**

1. **浏览器环境**：生成器须将 `window.__odLayoutAudit()` 调用包裹在 `DOMContentLoaded` 事件内，并在完成后将结果写入 `document.documentElement.dataset.odLayoutAudit`（`pass` / `fail`）。

2. **非浏览器环境（AI 直接生成 HTML 但不在浏览器中运行）**：
   - 不得强制要求在非浏览器环境中执行审计
   - 应在 HTML `<body>` 底部内嵌一段**静态预审计注释**：
     ```html
     <!-- od-pre-audit: generated-by-ai; runtime-audit-required-in-browser -->
     ```
   - AI 必须在**生成代码时做静态自查**（不依赖 DOM）：
     - 检查所有 `.card` 是否有 `overflow: hidden`（卡片本体禁止，除了 §8.1）
     - 检查是否有 `position: absolute` 且无 `data-allow-safe-overflow` 的元素超出 safe-zone 估算范围
     - 检查是否所有 `data-source-id` 元素都在对应 slide 内

3. **降级代码模板（内嵌到 HTML）**：

```html
<script>
(function () {
  var IS_BROWSER = typeof window !== 'undefined' && typeof document !== 'undefined'
    && typeof document.querySelector === 'function'
    && typeof Element.prototype.getBoundingClientRect === 'function';

  if (!IS_BROWSER) {
    // 非浏览器环境：跳过 DOM 审计，仅注册空函数供外部检测
    if (typeof window !== 'undefined') {
      window.__odLayoutAudit = function () {
        return { status: 'skipped', reason: 'non-browser-environment' };
      };
    }
    return;
  }

  // 浏览器环境：执行完整审计
  window.__odLayoutAudit = function () {
    /* ... 完整审计代码 ... */
  };

  // 延迟到 DOM 就绪后自动运行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { window.__odLayoutAudit(); });
  } else {
    window.__odLayoutAudit();
  }
})();
</script>
```

> 交付时，AI 须将 §9 完整审计函数体替换上方 `/* ... 完整审计代码 ... */` 占位符，并在文件顶部 `<meta>` 中注明 `data-od-audit-env="browser-required"`。

## 超宽画布内容模块宽度约束

超宽画布只代表页面可用横向空间更大，不代表单个内容模块也可无限变宽。

**文本卡片宽度上限：**

```css
.text-card {
  width: 100%;
  max-width: var(--text-card-max-width); /* 推荐 800px–1200px，不超过画布宽度 38% */
}
.card-copy {
  max-width: 34ch;   /* 中文正文 ≈ 22–40 汉字/行 */
  line-height: 1.5;
}
```

**图片容器 object-fit 规则（带例外）：**

```css
/* ✅ 默认：内容图片使用 cover 裁切，填满容器不留空白 */
.image-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
  display: block;
}

/* ✅ 例外1：Logo / 品牌图标 使用 contain，保留透明区域不裁切 */
.logo-img,
[data-asset-type="logo"] img,
[data-asset-type="icon"] img {
  object-fit: contain;
  object-position: center center;
}

/* ✅ 例外2：图表截图 / 原始证据截图 使用 contain，禁止裁切关键数据 */
[data-asset-type="chart_image"] img,
[data-asset-type="screenshot"] img,
[data-asset-type="case_evidence"] img {
  object-fit: contain;
  object-position: center top;  /* 数据通常在上方 */
}

/* ❌ 禁止：对普通内容图片使用 contain（会产生上下左右无意义空白） */
```

**规则说明：**
- `object-fit: cover`：用于**内容图片、产品图、场景图**——确保图片填满容器，无空白边缘
- `object-fit: contain`：仅用于 **Logo、图标、图表截图、原始证据截图**——禁止裁切图中的重要内容
- 不得对同一类型的图片混用两种规则

禁止：在无明确业务理由的情况下使用 `contain` 导致图片悬浮在容器中，产生大量无意义空白。

**图文组合比例约束：**

- 图片主导型：图片 55%–70%，文本 30%–45%
- 信息主导型：文本 55%–65%，图片 35%–45%
- 超宽画布中不建议出现单侧超过模块宽度 75% 的普通内容区

```css
.media-card {
  display: grid;
  grid-template-columns: minmax(0, var(--image-max-width)) minmax(0, var(--text-max-width));
  gap: var(--content-gap);
}
```

**卡片组最大宽度：**

```css
.card-group {
  width: min(100%, var(--group-max-width));
  margin-inline: auto;
  display: grid;
  gap: var(--card-gap);
}
```

禁止主体内容从左安全区一直连续铺到右安全区；内容组必须有明确最大宽度上限。


## 连接枢纽组件 CSS 约束

以下规则与 `components.md §3.9 ConnectionHub` 配套，必须内嵌于所有使用连接枢纽组件的 HTML 输出。

### 核心节点严格正圆

```css
.hub-node,
[class*="hub-node"] {
  aspect-ratio: 1 / 1;
  width: var(--hub-node-size, 220px);
  max-width: var(--hub-node-max, 300px);
  min-width: 100px;
  border-radius: 50%;
  box-sizing: border-box;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
}
```

### 枢纽组超宽画布约束

```css
.connection-hub {
  width: min(100%, var(--hub-max-width, 2800px));
  margin-inline: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--hub-gap, 48px);
}

.hub-modules {
  display: grid;
  align-items: stretch;
  gap: var(--hub-module-gap, 24px);
  width: min(100%, var(--hub-modules-max-width, 900px));
  min-width: 0;
}

.hub-module {
  min-width: 0;
  min-height: 0;
  box-sizing: border-box;
}
```

### 连接线最小线宽（大屏可读性）

```css
.hub-spokes line,
.hub-spokes path,
.hub-spoke {
  stroke-width: 2;            /* 主路径 ≥ 2px */
}

.hub-spokes.secondary line,
.hub-spokes.secondary path {
  stroke-width: 1.5;          /* 辅助路径最小 1.5px */
}
```

### 运算符节点

```css
.hub-operator {
  flex-shrink: 0;
  font-size: 48px;
  font-weight: 300;
  color: var(--gold-main);
  line-height: 1;
  text-align: center;
  min-width: 48px;
}
```

### 外部模块防溢出（复用 §8 card overflow 规则）

```css
.hub-module > * {
  min-width: 0;
  min-height: 0;
  box-sizing: border-box;
}

.hub-module-title {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.hub-module-body {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}
```
