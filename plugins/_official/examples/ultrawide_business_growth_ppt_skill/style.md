# Style System MD
# 超宽大屏商务增长风格（11m × 3m / 3696 × 1008）

---

## 0. 基本信息

### 0.1 适用场景

本样式系统适用于：

- 会场主屏
- 发布会大屏
- 品牌营销大会
- 商业化业务汇报
- 品牌案例展示
- 数据策略发布
- 增长成果展示
- 超宽横幅型 PPT / KV 画面

### 0.2 固定画布规格

- 物理尺寸：11m × 3m
- 像素分辨率：3696 × 1008 px
- 画面比例：11:3（约 3.67:1）
- 画布方向：超宽横屏

### 0.3 风格关键词

高级、明亮、克制、商务、轻科技、柔光感、品牌感、数据可信、生意增长、确定性、低信息密度、中心聚焦。

### 0.4 风格总原则

整体画面应传达一种专业可信、增长明确、轻盈高级、适合会场大屏观看的品牌商务视觉。

不追求炫技式未来科技感，不使用复杂的赛博视觉语言，而是通过浅暖色背景、青绿 + 香槟金双主色、柔和流线氛围、大标题中心聚焦、白色圆角卡片、大数字 / 大结论表达，建立“生意确定性”的视觉感受。

---

## 1. 超宽屏设计原则

### 1.1 构图原则

由于本画布为超宽比例，必须按照大屏主视觉设计，而不是将普通 16:9 PPT 横向拉长。

核心原则：

- 中间集中表达
- 左右延展氛围
- 模块横向展开
- 留白优先
- 远距离可读

### 1.2 视觉重心

建议将主视觉重心控制在页面中央 50% ~ 60% 区域内。

中心区域适合放：页面主标题、核心结论、核心案例标题、核心策略结构、关键数字结果、主卡片组。

左右两侧适合放：氛围流线、辅助图形、次级模块、辅助标签、装饰性信息延展。

### 1.3 安全区

推荐安全边距：

```text
左安全边距：220 px
右安全边距：220 px
上安全边距：90 px
下安全边距：90 px
```

推荐核心内容区：

```text
内容区起始 X：220 px
内容区结束 X：3476 px
可用内容区宽度：3256 px
内容区起始 Y：90 px
内容区结束 Y：918 px
可用内容区高度：828 px
```

### 1.4 HTML 输出必须使用等比自适应缩放

**所有 HTML 型 PPT 页面必须使用等比自适应缩放**，确保在任何浏览器窗口、iframe 或大屏上都能完整等比居中显示，而不是拉伸变形。

**必须遵守的 CSS 结构：**

```css
html, body {
  width: 100vw; height: 100vh;
  overflow: hidden;
  background: #111418; /* 黑色背景衬托居中区域 */
}
.slideshow {
  position: relative;
  width: 100vw; height: 100vh;
  overflow: hidden;
}
.slide {
  position: absolute;
  width: 3696px; height: 1008px;
  overflow: hidden;
  transform-origin: 0 0;
  display: none;
}
.slide.active { display: block; }
```

**必须包含的自适应缩放 JS（生成时复制此段，不得省略）：**

```js
(function () {
  var SLIDE_W = 3696, SLIDE_H = 1008;
  var slides = Array.from(document.querySelectorAll('.slide'));

  function scaleSlides() {
    var navEl = document.getElementById('nav-hud');
    var navH  = navEl ? navEl.offsetHeight : 0;
    var vw    = window.innerWidth;
    var vh    = window.innerHeight - navH;
    var scale = Math.min(vw / SLIDE_W, vh / SLIDE_H);
    var ox    = (vw - SLIDE_W * scale) / 2;
    var oy    = (vh - SLIDE_H * scale) / 2;
    slides.forEach(function (s) {
      s.style.transform       = 'scale(' + scale + ')';
      s.style.transformOrigin = '0 0';
      s.style.left            = ox + 'px';
      s.style.top             = oy + 'px';
    });
  }

  document.addEventListener('DOMContentLoaded', scaleSlides);
  window.addEventListener('load',   scaleSlides);
  window.addEventListener('resize', scaleSlides);
})();
```

**禁止**直接用 `width:100%; height:100%` 或 `width:100vw; height:100vh` 拉伸 `.slide`，这会把 3.67:1 的比例变成屏幕比例。

### 1.5 信息密度原则

超宽大屏必须比普通 PPT 更克制：

- 1 页只讲 1 个主结论
- 减少密集文本
- 避免小字
- 避免复杂表格
- 避免碎片化卡片过多
- 优先让远处观众一眼看懂

---

## 2. 色彩系统

### 2.1 背景色

```css
--bg-main: #FFFCF8;
--bg-warm: #FAF6EF;
--bg-soft: #F8F8F3;
```

使用规则：

- 页面大底以浅暖白、米白为主
- 背景不可偏冷灰
- 不使用纯白生硬底色
- 允许局部使用极轻微暖色渐变

### 2.2 主文字色

```css
--text-primary: #0B2D3A;
--text-secondary: #2D4650;
--text-body: #4C5A60;
--text-muted: #7C878B;
```

使用规则：

- 主标题使用深青黑色
- 正文、标签、说明文字使用深灰蓝 / 青灰色
- 避免纯黑
- 避免高对比刺眼文本

### 2.3 商务金色系统

```css
--gold-main: #D5AE79;
--gold-deep: #C89850;
--gold-light: #E5CDAE;
--gold-soft: #F1E6D8;
```

使用场景：重点强调、模块标题条、数据高亮、重要结果数字、分割线、标签边框、关键图表辅助线。

视觉要求：金色偏香槟金，不偏土黄；有高级感，不俗气；可做轻微渐变，但不能高饱和。

推荐渐变：

```css
background: linear-gradient(90deg, #D5AE79 0%, #E5CDAE 100%);
```

### 2.4 青绿色系统

```css
--teal-main: #4F9B90;
--teal-deep: #22796D;
--teal-light: #9FD1CB;
--teal-soft: #E6F3F0;
```

使用场景：策略感、智能感、增长感表达、趋势线、辅助标签、选中态、结构连接线、图标点缀。

视觉要求：低饱和、柔和、偏高级；不要霓虹绿；不要强发光。

### 2.5 中性色系统

```css
--line-light: rgba(11, 45, 58, 0.08);
--line-soft: rgba(11, 45, 58, 0.12);
--shadow-soft: rgba(11, 45, 58, 0.06);
--white-card: #FFFFFF;
```

---

## 3. 字体系统

### 3.1 字体建议

中文字体：思源黑体、HarmonyOS Sans、阿里巴巴普惠体、OPPOSans。

英文 / 数字字体：DIN、Avenir Next、Arial、Helvetica Neue。

原则：现代、清晰、商务、规整、远距离可读。

不建议：花哨字体、过细字体、装饰性字体、手写体、卡通体。

### 3.2 字号层级（基于 3696 × 1008）

```css
--font-title-xl: 72px;
--font-title-lg: 60px;
--font-title-md: 48px;

--font-subtitle-lg: 30px;
--font-subtitle-md: 24px;

--font-section-title: 22px;
--font-card-title: 20px;

--font-body-lg: 18px;
--font-body-md: 16px;
--font-body-sm: 14px;

--font-label: 14px;
--font-caption: 12px;

--font-number-xl: 88px;
--font-number-lg: 72px;
--font-number-md: 56px;
```

### 3.3 字重建议

```css
--weight-title: 600;
--weight-subtitle: 500;
--weight-section: 500;
--weight-body: 400;
--weight-number: 300 / 400;
```

说明：主标题不宜太粗；核心数字通过字号建立视觉重心，不依赖过粗字重；正文保持轻量清晰。

### 3.4 标题规则

主标题要求：居中排版、单页不超过 2 行、字间距略舒展、行高适中、文字尽量结论化。

副标题要求：位于主标题下方、信息简洁、颜色弱于主标题、不超过 1 行。

---

## 4. 背景系统

### 4.1 背景构成

背景由三部分组成：

1. 浅暖白底
2. 低透明柔焦光晕
3. 青绿色 + 香槟金流线装饰

### 4.2 背景流线规则

流线特征：轻盈、半透明、柔焦、横向延展、有层次但不复杂，可有丝带感 / 轨迹感。

分布建议：左下角、右下角、页面底部横向延展、左右边缘轻微穿插。

不建议：中央大面积遮挡内容、发光过强、粒子过多、赛博科技线框、复杂几何爆炸图案。

### 4.3 光晕规则

可以加入极轻柔光，但必须模糊、低透明、不形成强对比、不干扰文字阅读、不作为主要视觉主体。

---

## 5. 版式系统

### 5.1 页面基础结构

```text
顶部品牌区
中上主标题区
中部主体内容区
底部 / 两侧氛围延展区
```

### 5.2 顶部品牌区

建议高度：70 ~ 90 px。

布局建议：顶部区域保持干净，不自动叠加常驻品牌文字或重复 Logo；如背景图已包含品牌标识，则不再生成第二个品牌组件。右侧业务线 / 主题标识 / 联合品牌仅在原始内容明确提供时展示。

### 5.3 标题区

建议占位高度：150 ~ 220 px。

规则：标题始终居中；主标题优先放在中上区域；标题与主体内容之间保留明显呼吸感；章节页 / 封面页可进一步放大标题占比。

### 5.4 主体内容区

建议高度：500 ~ 620 px。

布局优先级：

1. 横向并列
2. 中心聚焦 + 左右辅助
3. 1 个主模块 + 2 个副模块
4. 对称布局
5. 三段式叙事布局

避免：上下堆叠太多层、过多卡片平均铺满全屏、小模块过碎。

### 5.5 间距系统

```css
--space-8: 8px;
--space-12: 12px;
--space-16: 16px;
--space-20: 20px;
--space-24: 24px;
--space-32: 32px;
--space-40: 40px;
--space-48: 48px;
--space-64: 64px;
--space-80: 80px;
```

超宽屏推荐：标题到主体区 48~64px；卡片间距 24~40px；卡片内边距 24~32px；主体区到页面边缘至少 220px。

---

## 6. 卡片系统

### 6.1 基础卡片

```css
.card {
  background: #FFFFFF;
  border: 1px solid rgba(213, 174, 121, 0.35);
  border-radius: 22px;
  box-shadow: 0 10px 28px rgba(11, 45, 58, 0.04);
}
```

规则：白色或暖白填充、大圆角、细边框、阴影非常轻、强调轻盈悬浮感。

### 6.2 主卡片

适用于核心内容承载。

建议规格：高度 320~440px；内边距 28~32px；可容纳标题、结构、图表、数字结果。

### 6.3 子卡片

适用于卡片内部的局部信息承载。

建议规格：圆角 16px；边框弱化；背景可用浅米白 / 浅青绿 / 浅金色弱底。

### 6.4 标题条卡片

```css
.card-header {
  background: linear-gradient(90deg, #D5AE79 0%, #E5CDAE 100%);
  border-radius: 10px;
  color: #0B2D3A;
}
```

规则：高度不要过高，轻量使用，可搭配线性图标，不要做成厚重按钮感。

---

## 7. 数据与结果组件

### 7.1 大数字组件

适合表达：GMV 达成、ROI 提升、新客占比、转化提升、增长结果、项目成绩。

结构：

```text
数值
单位
结果标签
解释说明
```

样式建议：数值 72~88px；颜色香槟金 / 深青黑；标签小型标题；说明 14~16px。

原则：每页 2~4 个大数字为宜；数字必须是视觉锚点；单位清晰但不要喧宾夺主。

### 7.2 指标组

适合表达多项并列成果。

布局建议：横向 2~4 列；列间距均匀；组内对齐统一；每组包含名称 / 数值 / 简要说明。

### 7.3 趋势图 / 相关性图

图表风格要求：极简、清晰、低噪音、高可读、不复杂。

```css
--chart-main: #4F9B90;
--chart-sub: #D5AE79;
--chart-grid: rgba(11, 45, 58, 0.08);
--chart-axis: rgba(11, 45, 58, 0.25);
--chart-area: rgba(79, 155, 144, 0.14);
```

规则：主线用青绿色；辅助线用香槟金；面积填充低透明；网格线轻量；图例简洁；避免复杂装饰。

---

## 8. 图标与图形系统

### 8.1 图标风格

推荐图标风格：线性、圆角、低复杂度、商务简洁。

推荐来源：Lucide、Tabler Icons、Remix Icon。

```css
--icon-primary: #0B2D3A;
--icon-teal: #4F9B90;
--icon-gold: #D5AE79;
--icon-muted: #8C969B;
```

### 8.2 装饰图形

允许使用：细线弧形、柔和环形、流线丝带、圆弧轨迹、浅色投影椭圆、低透明渐变面。

不允许：赛博科技网格、光束爆炸、锐利机械结构、复杂几何金属装置、卡通插画元素。

---

## 9. 标签 / 胶囊 / 状态组件

### 9.1 普通标签

```css
.tag {
  background: #FFFFFF;
  border: 1px solid rgba(213, 174, 121, 0.35);
  border-radius: 999px;
  color: #2D4650;
  padding: 8px 16px;
}
```

适用于：资源类型、策略名称、人群标签、路径节点、业务属性。

### 9.2 选中标签

```css
.tag-active {
  background: #EAF5F2;
  border: 1px solid #9FD1CB;
  color: #22796D;
}
```

### 9.3 弱标签

```css
.tag-muted {
  background: #F7F6F2;
  border: 1px solid rgba(11, 45, 58, 0.08);
  color: #7C878B;
}
```

---

## 固定背景图系统

本风格 Skill 支持固定封面、内容页、封尾三类背景图。背景图资产由本 Skill 管理，详见 `background_system.md` 与 `asset_manifest.json`。

页面背景枚举：

```text
cover：封面页背景
content：正文内容页背景
closing：封尾页背景
```

分工规则：

```text
风格 Skill：定义背景图资产、视觉强度和使用规则
总控 Skill：判断页面角色并传递 backgroundVariant
组件 Skill：根据 backgroundVariant 渲染背景图
```

背景图不得承载必须可编辑的信息。主标题、正文、关键数字、单位、图表标签、Logo、二维码等应作为独立 HTML / 组件呈现。

## 17. 固定品牌信息禁用规则

当前背景图已经带有左上角品牌标识，生成 HTML 型 PPT 时不得再额外叠加常驻品牌信息。

禁止自动生成：

- 第二个“快手联盟”文本
- 顶部品牌副标题
- 左上角重复 Logo
- 未由原始内容提供的会议名、年份、角标
- 任何固定出现在所有页面上的装饰性品牌文字

顶部品牌区只作为安全区与构图参考，不代表必须生成可见文本。  
如需展示额外标题、会议名、演讲人等信息，必须来自原始 PPT 正式内容或用户明确输入。

## 18. 背景无 Logo 与独立 Logo 组件

当前风格采用“背景图不带 Logo，Logo 独立组件渲染”。

### 背景图规则

- `assets/bg-cover.png`：封面页背景，无 Logo
- `assets/bg-content.png`：内容页背景，无 Logo
- `assets/bg-closing.png`：封尾页背景，无 Logo

背景图不得包含固定品牌 Logo、品牌文字、会议名或可编辑正文信息。

### Logo 组件规则

Logo 通过独立组件 `FixedBrandLogo` 渲染。

默认显示范围：

```text
封面页：显示
内容页：显示
封尾页：显示
```

默认位置：

```css
.fixed-brand-logo {
  position: absolute;
  left: 96px;
  top: 54px;
  width: 170px;
  height: auto;
  z-index: 5;
}
```

Logo SVG 源地址：

```text
https://p5-ad.adkwai.com/udata/pkg/ks-ad-fe/md-tools/quick-cut/6689:5117.b90a9c9d53932e9b.svg
```

不得额外生成第二个“快手联盟”文字。
