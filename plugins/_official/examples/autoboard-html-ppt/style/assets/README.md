# Background and Logo Assets

本目录包含按页面角色拆分的 3 张背景图资产：

- `bg-cover.svg`：用户提供的封面页原图。底部金色与青绿流线，左上角为独立快手联盟 Logo 预留区域，中央保持标题安全区。
- `bg-content.svg`：用户提供的内容页原图。底部低对比流线，左上角为独立快手联盟 Logo 预留区域，中央保持高可读性。
- `bg-closing.svg`：用户提供的封底原图。底部金色与青绿流线横向延展，左上角预留独立快手联盟 Logo 的展示区域。

封面、内容页与封尾统一使用独立的 `logo.svg` 组件。

SVG Logo 源地址：

```text
https://p5-ad.adkwai.com/udata/pkg/ks-ad-fe/md-tools/quick-cut/6689:5117.b90a9c9d53932e9b.svg
```

接入建议：

- 生产环境可直接用该 URL 作为 `<img src>`。
- 更稳妥的方式是将该 SVG 下载到本目录并命名为 `logo.svg`，再将 `asset_manifest.json` 中的 `logo.localPath` 指向 `assets/logo.svg`。
- 标题、正文、数字、图表标签、二维码、联系方式等仍需作为独立 HTML / 组件输出。

当前包内已内置本地 `logo.svg`，预览和离线交付默认使用该资产；远程地址仅作为来源记录。
