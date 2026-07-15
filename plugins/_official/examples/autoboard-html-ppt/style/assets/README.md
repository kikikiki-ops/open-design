# Background and Logo Assets

本目录包含 3 张无 Logo 背景图资产：

- `bg-cover.svg`：封面页背景，无 Logo
- `bg-content.svg`：内容页背景，无 Logo
- `bg-closing.svg`：封尾页背景，无 Logo

Logo 不再烘焙进背景图，而是作为独立组件渲染。

SVG Logo 源地址：

```text
https://p5-ad.adkwai.com/udata/pkg/ks-ad-fe/md-tools/quick-cut/6689:5117.b90a9c9d53932e9b.svg
```

接入建议：

- 生产环境可直接用该 URL 作为 `<img src>`。
- 更稳妥的方式是将该 SVG 下载到本目录并命名为 `logo.svg`，再将 `asset_manifest.json` 中的 `logo.localPath` 指向 `assets/logo.svg`。
- 标题、正文、数字、图表标签、二维码、联系方式等仍需作为独立 HTML / 组件输出。

当前包内未内置本地 `logo.svg`，默认使用 `sourceUrl` 远程 SVG 渲染。如需离线使用，请将该地址下载为 `assets/logo.svg`。
