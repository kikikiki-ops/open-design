# PPT 视觉风格落地规范

## 1. 风格定位

- 风格名称：快手品牌营销·轻奢数据叙事体系
- 参考气质：Interbrand / Landor 式品牌提案感 + 国内大厂业务汇报效率感
- 核心关键词：克制、高级、轻奢、品牌感、数据可信、自然科技
- 不做方向：蓝紫科技光效大铺满、重拟物金属、赛博网格、过度3D炫技

---

## 2. CSS Design Tokens

```css
:root {
  /* ========== Color / Brand ========== */
  --kc-color-title: #052941;
  --kc-color-text-strong: #295957;
  --kc-color-text-mid: #335452;
  --kc-color-text-body: #1f2d33;
  --kc-color-text-muted: #6f7d86;
  --kc-color-text-inverse: #ffffff;

  --kc-color-bg-page: #f8faf8;
  --kc-color-bg-surface: #ffffff;
  --kc-color-bg-soft: #eef2f3;
  --kc-color-bg-tint: #f3f6f4;

  --kc-color-line-strong: #052941;
  --kc-color-line-soft: #d9e2de;
  --kc-color-line-gold: #dcbb8b;
  --kc-color-line-gold-deep: #ac8348;

  --kc-color-gold: #d5ae79;
  --kc-color-gold-soft: #e9d5b9;
  --kc-color-accent-green: #20846f;
  --kc-color-accent-green-soft: #6d9f93;

  --kc-color-accent-pink: #ff2b5e;
  --kc-color-accent-purple: #f238e2;
  --kc-color-accent-lime: #7fc236;

  /* ========== Gradient ========== */
  --kc-gradient-orb: linear-gradient(135deg, #ff2b5e 0%, #f238e2 45%, #7fc236 100%);
  --kc-gradient-gold: linear-gradient(135deg, #e9d5b9 0%, #d5ae79 60%, #ac8348 100%);
  --kc-gradient-soft-bg: linear-gradient(180deg, #ffffff 0%, #f3f6f4 100%);

  /* ========== Typography ========== */
  --kc-font-family: "OPPOSans", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  --kc-font-weight-regular: 400;
  --kc-font-weight-medium: 500;
  --kc-font-weight-bold: 700;
  --kc-font-weight-heavy: 800;

  --kc-font-size-display-xl: 72px;
  --kc-font-size-display-lg: 60px;
  --kc-font-size-h1: 36px;
  --kc-font-size-h2: 28px;
  --kc-font-size-h3: 22px;
  --kc-font-size-title-sm: 18px;
  --kc-font-size-body: 14px;
  --kc-font-size-body-sm: 12px;
  --kc-font-size-caption: 10px;
  --kc-font-size-metric: 44px;
  --kc-font-size-metric-unit: 24px;

  --kc-line-height-tight: 1.08;
  --kc-line-height-title: 1.2;
  --kc-line-height-body: 1.5;

  --kc-letter-spacing-tight: -0.02em;
  --kc-letter-spacing-normal: 0;
  --kc-letter-spacing-wide: 0.04em;

  /* ========== Radius ========== */
  --kc-radius-card-xl: 40px;
  --kc-radius-card-lg: 32px;
  --kc-radius-card-md: 24px;
  --kc-radius-pill: 999px;
  --kc-radius-orb: 999px;

  /* ========== Border / Shadow ========== */
  --kc-border-strong: 2px solid var(--kc-color-line-strong);
  --kc-border-soft: 1px solid var(--kc-color-line-soft);
  --kc-border-gold: 1px solid var(--kc-color-line-gold);
  --kc-border-gold-strong: 2px solid var(--kc-color-line-gold-deep);

  --kc-shadow-card: 0 12px 32px rgba(5, 41, 65, 0.06);
  --kc-shadow-float: 0 16px 40px rgba(5, 41, 65, 0.12);
  --kc-shadow-orb: 0 12px 48px rgba(242, 56, 226, 0.18);

  /* ========== Spacing ========== */
  --kc-space-4: 4px;
  --kc-space-8: 8px;
  --kc-space-12: 12px;
  --kc-space-16: 16px;
  --kc-space-20: 20px;
  --kc-space-24: 24px;
  --kc-space-32: 32px;
  --kc-space-40: 40px;
  --kc-space-48: 48px;
  --kc-space-56: 56px;
  --kc-space-64: 64px;
  --kc-space-72: 72px;
  --kc-space-88: 88px;

  /* ========== Slide Layout ========== */
  --kc-slide-width: 1920px;
  --kc-slide-height: 1080px;
  --kc-page-padding-x: 72px;
  --kc-page-padding-y: 56px;
  --kc-title-max-width: 1120px;
  --kc-content-gap: 28px;
  --kc-card-padding: 28px;
  --kc-panel-padding: 32px;

  /* ========== Ornament ========== */
  --kc-orb-size-sm: 64px;
  --kc-orb-size-md: 120px;
  --kc-orb-size-lg: 180px;
  --kc-orb-blur: 12px;
}
```

---

## 3. 基础页面规则

### 3.1 画布规则

- 标准画布：`1920 × 1080`
- 页面背景优先使用：`--kc-color-bg-page`
- 内容避免贴边，统一使用页面留白：
  - 左右边距：`72px`
  - 上下边距：`56px`
- 页面结构优先级：
  1. 页面主标题
  2. 品牌栏目眉 / 引导条
  3. 主内容卡片区
  4. 指标强调区
  5. 装饰元素

### 3.2 留白策略

- 页面的高级感主要靠留白，不靠堆装饰
- 同级模块之间的标准间距：`24px ~ 32px`
- 大模块上下间距：`40px ~ 56px`
- 装饰元素与正文最小安全距离：`24px`

### 3.3 层级规则

- L1：页面结论标题
- L2：模块标题
- L3：策略标签 / 方法项
- L4：关键指标
- L5：辅助说明

严禁把 L3/L4 做得比 L1 更抢眼。

---

## 4. 组件规范

## 4.1 Hero 结论标题条

**用途**

- 页面级主结论
- 单页只表达一个核心判断

**结构**

- 可分两行
- 第一行可为品牌名/案例名
- 第二行为结果结论

**样式规则**

```css
.kc-hero-title {
  max-width: var(--kc-title-max-width);
  font-family: var(--kc-font-family);
  font-size: var(--kc-font-size-h1);
  line-height: var(--kc-line-height-title);
  font-weight: var(--kc-font-weight-bold);
  color: var(--kc-color-title);
  letter-spacing: var(--kc-letter-spacing-tight);
}
```

**设计要求**

- 标题颜色固定深色系，不用渐变字
- 不加粗描边，不做发光
- 能断句就断句，别把一句话拖成一整行

---

## 4.2 品牌栏目眉 / Header Strap

**用途**

- 承接统一母命题
- 用于品牌归属、章节归属、平台归属

**结构**

- 横向细条
- 常见文案：品牌主张、栏目名、章节名

**样式规则**

```css
.kc-header-strap {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 18px;
  border-radius: var(--kc-radius-pill);
  border: var(--kc-border-soft);
  background: rgba(255, 255, 255, 0.72);
  color: var(--kc-color-text-body);
  font-size: var(--kc-font-size-body-sm);
  font-weight: var(--kc-font-weight-medium);
  backdrop-filter: blur(8px);
}
```

**设计要求**

- 这是信息秩序组件，不是视觉主角
- 透明可有，但必须轻
- 不做厚重阴影

---

## 4.3 圆角信息卡 / Strategy Card

**用途**

- 承载方法、策略、问题拆解、路径结构

**结构**

- 卡标题
- 卡说明
- 标签区
- 内容区 / 子块区

**样式规则**

```css
.kc-card {
  background: var(--kc-color-bg-surface);
  border-radius: var(--kc-radius-card-lg);
  border: var(--kc-border-gold);
  box-shadow: var(--kc-shadow-card);
  padding: var(--kc-card-padding);
}

.kc-card--soft {
  background: var(--kc-gradient-soft-bg);
  border: var(--kc-border-soft);
}

.kc-card__title {
  font-size: var(--kc-font-size-title-sm);
  font-weight: var(--kc-font-weight-medium);
  color: var(--kc-color-title);
}

.kc-card__desc {
  margin-top: 8px;
  font-size: var(--kc-font-size-body-sm);
  line-height: var(--kc-line-height-body);
  color: var(--kc-color-text-body);
}
```

**设计要求**

- 卡片圆角要足够大，不能太办公化
- 金线边框应细，不要做成土豪金厚边
- 一个页面里卡片样式不要超过 2 种底色变化

---

## 4.4 指标成果卡 / Metric Card

**用途**

- 展示核心增长、占比、效率结果

**结构**

- 指标标题
- 大数字
- 单位
- 标签（如：新突破 / 新成绩 / 新亮点）

**样式规则**

```css
.kc-metric {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kc-metric__label {
  font-size: var(--kc-font-size-body-sm);
  color: var(--kc-color-text-body);
}

.kc-metric__value {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  color: var(--kc-color-title);
}

.kc-metric__number {
  font-size: var(--kc-font-size-metric);
  line-height: 1;
  font-weight: var(--kc-font-weight-bold);
  letter-spacing: var(--kc-letter-spacing-tight);
}

.kc-metric__unit {
  font-size: var(--kc-font-size-metric-unit);
  line-height: 1.1;
  font-weight: var(--kc-font-weight-heavy);
}

.kc-metric__tag {
  align-self: flex-start;
  padding: 6px 12px;
  border-radius: var(--kc-radius-pill);
  background: rgba(32, 132, 111, 0.1);
  color: var(--kc-color-text-strong);
  font-size: var(--kc-font-size-body-sm);
  font-weight: var(--kc-font-weight-medium);
}
```

**设计要求**

- 数字和单位分层，单位不应比数字更重
- 关键数字优先深色，不优先荧光色
- 标签负责总结，不喧宾夺主

---

## 4.5 标签胶囊 / Pill Tag

**用途**

- 表示策略点、资源位、方法项、状态

**样式规则**

```css
.kc-pill {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 12px;
  border-radius: var(--kc-radius-pill);
  border: var(--kc-border-gold);
  color: var(--kc-color-text-body);
  background: #fffdf9;
  font-size: var(--kc-font-size-body-sm);
  font-weight: var(--kc-font-weight-medium);
}

.kc-pill--solid {
  background: var(--kc-color-accent-green);
  color: var(--kc-color-text-inverse);
  border: none;
}
```

**设计要求**

- 同页标签风格统一
- 不同标签状态尽量通过底色浅深区分，不靠乱七八糟彩虹配色

---

## 4.6 关系节点 / Connector Node

**用途**

- 表示流程串联、策略递进、问题到解法映射

**组成**

- 菱形、小圆点、短线段、箭头尾迹

**样式建议**

```css
.kc-node-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--kc-color-gold);
}

.kc-node-diamond {
  width: 14px;
  height: 14px;
  background: var(--kc-color-gold-soft);
  border: 1px solid var(--kc-color-line-gold);
  transform: rotate(45deg);
}

.kc-node-line {
  height: 1px;
  background: var(--kc-color-line-gold);
}
```

**设计要求**

- 连接元素是结构说明，不是装饰堆料
- 线条必须细
- 颜色优先金系 / 深色系

---

## 4.7 渐变装饰球 / Gradient Orb

**用途**

- 页面边角提气
- 给纯商务结构加高级记忆点

**样式规则**

```css
.kc-orb {
  width: var(--kc-orb-size-md);
  height: var(--kc-orb-size-md);
  border-radius: var(--kc-radius-orb);
  background: var(--kc-gradient-orb);
  filter: blur(var(--kc-orb-blur));
  opacity: 0.9;
  box-shadow: var(--kc-shadow-orb);
}
```

**设计要求**

- 每页 1~3 个足够
- 只在边角、空白区、标题附近出现
- 绝不覆盖正文信息
- 不可满页飘

---

## 5. 页面模板建议

## 5.1 封面页

结构：
- 左/中大标题
- 小副标题
- 一处大装饰球
- 可搭配金色细线或品牌标识条

## 5.2 结论页

结构：
- 顶部 Hero 标题
- 中部栏目眉
- 下部 2~3 个内容卡
- 右上或右下放装饰节点

## 5.3 双栏策略页

结构：
- 顶部标题
- 左右两张大卡并列
- 中间用节点连接过渡
- 底部可接指标成果卡

## 5.4 成果数据页

结构：
- 顶部标题
- 中区指标卡并列
- 下区方法解释/资源组合说明

---

## 6. 组合规则

### 可以这样组合

- Hero 标题 + Header Strap + 双栏 Card
- Hero 标题 + Metric Card 组三联 + Strategy Card
- Hero 标题 + 左图形关系区 + 右指标区

### 不要这样组合

- 一页里同时出现 4 种不同圆角风格
- 一页里既有金边卡、重阴影卡、纯色卡、玻璃卡同时互殴
- 指标数字和彩色装饰抢同一视觉中心
- 标题已经很长，还做满屏花装饰

---

## 7. 响应 Autoboard / HTML 实施建议

### 文件拆分建议

- `tokens.css`：只放 Design Tokens
- `components.css`：只放 kc- 前缀组件
- `layouts.css`：只放页面布局模板
- `demo.html`：只放拼装实例

### 命名规范

- 前缀统一：`kc-`
- Block：`.kc-card`
- Element：`.kc-card__title`
- Modifier：`.kc-card--soft`

### 实现原则

- 先搭信息骨架，再加装饰
- 让装饰可开关
- 所有颜色、字号、圆角全部 token 化
- 组件不写死案例文案
- 装饰层单独 absolute，不污染内容层

---

## 8. 反模式清单

以下做法会立刻破坏这套风格：

1. 大面积蓝紫科技渐变背景
2. 赛博网格、地球、粒子轨道
3. 发光描边标题字
4. 金色过厚、过亮、像婚庆海报
5. 卡片阴影太重，像后台管理系统
6. 一页超过 3 个主强调色
7. 装饰球数量太多，像彩妆广告
8. 图表默认 ECharts 蓝橙绿全家桶直接上

---

## 9. 最小可用组件清单（建议优先做）

1. `kc-hero-title`
2. `kc-header-strap`
3. `kc-card`
4. `kc-card--soft`
5. `kc-metric`
6. `kc-pill`
7. `kc-node-dot` / `kc-node-diamond` / `kc-node-line`
8. `kc-orb`

这 8 个先做完，已经能覆盖大多数同风格页面。
