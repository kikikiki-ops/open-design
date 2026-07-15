# Logo System

## 1. 方案原则

背景图不承载 Logo，Logo 作为独立组件渲染。

这样可以避免背景图压缩 / 缩放导致 Logo 模糊，同时保证 Logo 可替换、可维护、可编辑配置。

---

## 2. Logo 资产

当前 Logo SVG 源地址：

```text
https://p5-ad.adkwai.com/udata/pkg/ks-ad-fe/md-tools/quick-cut/6689:5117.b90a9c9d53932e9b.svg
```

推荐组件优先级：

1. 优先使用本地 `assets/logo.svg`
2. 如果本地文件不存在，可使用 `asset_manifest.json` 中的 `sourceUrl`
3. 不允许从背景图中裁切 Logo 使用

---

## 3. 展示范围

用户已确认：封面 / 内容 / 封尾都显示 Logo。

```json
{
  "fixedBrandLogo": {
    "enabled": true,
    "showOn": ["cover", "content", "closing"]
  }
}
```

---

## 4. 默认位置与尺寸

适配 3696 × 1008 超宽屏：

```css
.fixed-brand-logo {
  position: absolute;
  left: 96px;
  top: 54px;
  z-index: 5;
  width: 170px;
  height: auto;
  pointer-events: none;
}
```

如果 Logo SVG 已包含图形 + “快手联盟”文字锁定，不得再额外生成第二行品牌文字。

---

## 5. HTML 渲染示例

```html
<section class="ppt-slide" data-page-role="cover" data-bg-variant="cover">
  <div class="slide-background" aria-hidden="true">
    <img src="./assets/bg-cover.png" alt="" />
  </div>

  <img
    class="fixed-brand-logo"
    src="./assets/logo.svg"
    data-asset-role="fixed-brand-logo"
    alt="快手联盟"
  />

  <div class="slide-safe-area">
    <!-- 页面可编辑内容 -->
  </div>
</section>
```

如果使用远程地址：

```html
<img
  class="fixed-brand-logo"
  src="https://p5-ad.adkwai.com/udata/pkg/ks-ad-fe/md-tools/quick-cut/6689:5117.b90a9c9d53932e9b.svg"
  data-asset-role="fixed-brand-logo"
  alt="快手联盟"
/>
```

---

## 6. 禁止事项

- 不得把 Logo 烘焙进背景图
- 不得从背景图里裁切模糊 Logo
- 不得重复生成“快手联盟”文字
- 不得在 Logo 下方自动增加品牌副标题
- 不得将 Logo 转为不可替换背景元素

---

## 7. 检查项

```text
[ ] 背景图是否无 Logo
[ ] Logo 是否通过独立组件渲染
[ ] Logo 是否使用 SVG 或高清透明 PNG
[ ] 封面 / 内容 / 封尾是否都显示 Logo
[ ] 是否没有重复生成“快手联盟”文字
[ ] Logo 是否未影响标题和内容安全区
```
