# Background System

## 1. 背景图定位

本风格 Skill 支持固定三类页面背景图：封面背景、内容页背景、封尾背景。

背景图属于视觉风格资产，由本风格 Skill 统一定义和管理；总控 Skill 只负责判断当前页面角色并传递 `backgroundVariant`；组件 Skill 负责在 HTML 型 PPT 中实际渲染背景图。

核心原则：

> 背景图只负责氛围、纹理、流线、色块和空间感，不承载必须可编辑的正文信息。

---

## 2. 背景图资产约定

## 2.1 当前实际资产映射

当前已接入 3 张实际背景图，默认按用户上传顺序映射：

- 第 1 张 → `cover` → `assets/bg-cover.png`
- 第 2 张 → `content` → `assets/bg-content.png`
- 第 3 张 → `closing` → `assets/bg-closing.png`

如果后续需要调整映射，只需替换 `asset_manifest.json` 和对应文件名即可。

---


固定使用以下三类背景图资产：

| 页面角色 | backgroundVariant | 推荐文件名 | 使用场景 |
|---|---|---|---|
| 封面页 | `cover` | `assets/bg-cover.png` | 大会封面、主题开场、章节级强视觉页 |
| 内容页 | `content` | `assets/bg-content.png` | 正文内容页、数据页、策略页、案例页、流程页 |
| 封尾页 | `closing` | `assets/bg-closing.png` | 感谢页、合作共建页、结束页、品牌收束页 |

如果实际项目中使用 CDN 或远程地址，可在 `asset_manifest.json` 中替换路径，但 `backgroundVariant` 枚举必须保持不变。

---

## 3. 背景图尺寸规范

所有背景图必须适配固定画布：

```text
画布尺寸：3696 × 1008 px
物理尺寸：11m × 3m
比例：11:3，约 3.67:1
```

背景图要求：

- 最佳尺寸：3696 × 1008 px
- 最低建议宽度：3696 px
- 最低建议高度：1008 px
- 不建议使用低分辨率图片拉伸
- 如果使用更高分辨率，必须保持同一比例裁切
- HTML 渲染时使用 `object-fit: cover`

---

## 4. 三类背景图视觉差异

### 4.1 封面背景 `cover`

用于封面页，视觉可以最强。

要求：

- 中心区域为标题预留足够干净空间
- 可以有更明显的柔光流线和品牌氛围
- 不要在中心区域放高对比复杂纹理
- 不要直接烘焙主标题、演讲人、日期等可编辑信息
- Logo 如需固定展示，优先使用独立 Logo 组件，不建议烘焙在背景图中

### 4.2 内容页背景 `content`

用于所有正文内容页，视觉必须最克制。

要求：

- 对比度低于封面背景
- 纹理和流线主要位于底部、左右边缘或安全区外侧
- 不干扰标题、卡片、数据和图表阅读
- 中央内容区域必须干净
- 可通过浅暖底、低透明流线和柔和光晕维持风格统一

### 4.3 封尾背景 `closing`

用于结束页或感谢页，视觉强度可介于封面和内容页之间。

要求：

- 支持中心收束文案，如“感谢观看”“携手共建”等
- 可以加强品牌氛围和流线收束感
- 不要烘焙不可编辑的重要文案
- 联系方式、二维码、Logo 等应优先作为独立 HTML / 图片组件呈现

---

## 5. HTML 渲染建议

组件 Skill 应使用独立背景层渲染背景图：

```html
<section
  class="ppt-slide"
  data-page-type="CoverPage"
  data-page-role="cover"
  data-bg-variant="cover"
>
  <div class="slide-background" aria-hidden="true">
    <img src="./assets/bg-cover.png" alt="" />
  </div>

  <div class="slide-safe-area">
    <!-- 可编辑标题、正文、卡片、图表等内容 -->
  </div>
</section>
```

推荐 CSS：

```css
.ppt-slide {
  width: 3696px;
  height: 1008px;
  position: relative;
  overflow: hidden;
}

.slide-background {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.slide-background img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.slide-safe-area {
  position: relative;
  z-index: 1;
}
```

---

## 6. 禁止事项

禁止将以下内容烘焙进背景图：

- 主标题
- 副标题
- 正文
- 关键数字
- 百分比
- 单位
- 图表标签
- 流程节点文字
- 需要编辑的 Logo
- 需要替换的二维码或联系方式

允许烘焙进背景图：

- 抽象流线
- 柔光光晕
- 低透明纹理
- 装饰性色块
- 不承载信息的氛围图形

---

## 7. 质量检查

生成或应用背景图后，必须检查：

```text
[ ] 背景图尺寸是否适配 3696 × 1008
[ ] 页面角色是否正确匹配 backgroundVariant
[ ] 封面是否使用 cover 背景
[ ] 正文页是否使用 content 背景
[ ] 封尾是否使用 closing 背景
[ ] 背景图是否没有烘焙重要正文信息
[ ] 背景图是否没有影响文字、卡片、图表可读性
[ ] 内容页背景是否足够克制
[ ] 所有正式文字是否仍然为可编辑 HTML 文本
```

## 8. 品牌常驻信息处理

当前 3 张背景图资产中已经包含左上角品牌标识。  
因此组件渲染时不得再额外生成固定品牌文字或重复 Logo。

特别禁止：

- 在左上角背景 Logo 下方再生成一个“快手联盟”
- 把品牌名作为每页默认副标题
- 把顶部品牌区误解为必须输出的文本组件
- 自动添加未来自原始内容的“开发者大会 2026”等角标

允许：

- 保留背景图自带的视觉标识
- 原始 PPT 正式内容中存在的标题、演讲人、会议名等作为可编辑文本展示
- 用户明确要求添加的 Logo / 会议名 / 年份信息

## 9. 背景无 Logo 规则

当前版本背景图必须为无 Logo 背景。

背景图只负责：

- 流线
- 光影
- 色块
- 纹理
- 空间氛围

不得包含：

- Logo
- 品牌文字
- 主标题
- 会议名称
- 年份角标
- 二维码
- 联系方式
- 任何需要后续替换的信息

Logo 统一由 `FixedBrandLogo` 独立组件渲染。
