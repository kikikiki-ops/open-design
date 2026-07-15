# Page Background Routing

## 1. 背景路由职责

总控 Skill 不直接管理背景图文件，也不在规则中写死具体图片地址。

总控 Skill 的职责是：

1. 判断每页的页面角色 `pageRole`
2. 输出对应的 `backgroundVariant`
3. 将该值传递给组件 Skill
4. 在质量检查中确认背景类型使用正确

背景图资产由视觉风格 Skill 管理，实际渲染由组件 Skill 完成。

---

## 2. 页面角色枚举

```text
cover：封面页
content：正文内容页
closing：封尾页
```

---

## 3. 背景类型枚举

```text
backgroundVariant = cover
backgroundVariant = content
backgroundVariant = closing
```

三者必须与视觉风格 Skill 中的背景图资产保持一致：

```text
cover   -> assets/bg-cover.png
content -> assets/bg-content.png
closing -> assets/bg-closing.png
```

如实际项目使用 CDN 地址，也必须保持枚举名称不变。

当前版本默认按用户上传顺序绑定背景图资产：第 1 张为封面，第 2 张为内容页，第 3 张为封尾。

---

## 4. 页面类型到背景类型的映射

| 页面类型 | pageRole | backgroundVariant |
|---|---|---|
| CoverPage | cover | cover |
| SectionPage / 章节过渡页 | content | content |
| AgendaPage | content | content |
| MetricOverviewPage | content | content |
| MultiColumnComparisonPage | content | content |
| EcosystemRelationshipPage | content | content |
| StrategyPanoramaPage | content | content |
| StageEvolutionPage | content | content |
| DualCoreArchitecturePage | content | content |
| FormulaDecompositionPage | content | content |
| CaseStudyPage | content | content |
| ProcessFlowPage | content | content |
| CentralModelPage | content | content |
| ShowcaseGalleryPage | content | content |
| TransformationPage | content | content |
| CapabilityRoadmapPage | content | content |
| CapabilityMatrixPage | content | content |
| ClosingPage | closing | closing |
| GeneralStructuredPage | content | content |

---

## 5. 封尾页识别规则

如果页面内容属于以下类型，应路由为 `ClosingPage`：

- 感谢观看
- 谢谢
- Q&A
- 联系我们
- 携手共建
- 开放合作
- 结束语
- 品牌收束
- 合作邀请
- 二维码 / 联系方式作为结束页主要内容

输出：

```json
{
  "pageType": "ClosingPage",
  "pageRole": "closing",
  "backgroundVariant": "closing"
}
```

---

## 6. 页面规划 JSON 示例

封面页：

```json
{
  "pageIndex": 1,
  "pageType": "CoverPage",
  "pageRole": "cover",
  "backgroundVariant": "cover"
}
```

正文页：

```json
{
  "pageIndex": 5,
  "pageType": "MetricOverviewPage",
  "pageRole": "content",
  "backgroundVariant": "content"
}
```

封尾页：

```json
{
  "pageIndex": 18,
  "pageType": "ClosingPage",
  "pageRole": "closing",
  "backgroundVariant": "closing"
}
```

---

## 7. 背景相关保真规则

背景图不得影响内容保真原则：

- 不得把正式文字烘焙进背景图
- 不得把关键数字烘焙进背景图
- 不得用背景图替代正文、图表、标签、单位
- Logo、二维码、联系方式如需后续替换，应作为独立组件
- 背景图只承载氛围，不承载必须编辑的信息

---

## 8. 背景路由质量检查

```text
[ ] 每页是否输出 pageRole
[ ] 每页是否输出 backgroundVariant
[ ] CoverPage 是否使用 cover
[ ] 正文页是否使用 content
[ ] ClosingPage 是否使用 closing
[ ] 背景图是否未承载正式正文信息
[ ] 背景层是否不影响 HTML 文本可编辑性
```

## 9. 常驻品牌信息禁用

当前背景图资产已经包含左上角品牌标识。  
因此页面规划中不得因为 `pageRole` 或 `backgroundVariant` 自动生成额外品牌文字。

特别禁止：

```json
{
  "type": "BrandLogo",
  "text": "快手联盟",
  "source": "default_style"
}
```

除非该内容在原始 PPT 正式内容中存在，否则不得进入最终页面正文。

## 10. 独立 Logo 路由

背景路由只负责 `backgroundVariant`，不负责 Logo。Logo 由独立组件 `FixedBrandLogo` 渲染。

```json
{
  "pageRole": "content",
  "backgroundVariant": "content",
  "fixedBrandLogo": {
    "enabled": true,
    "sourceUrl": "https://p5-ad.adkwai.com/udata/pkg/ks-ad-fe/md-tools/quick-cut/6689:5117.b90a9c9d53932e9b.svg",
    "show": true
  }
}
```

显示规则：

| pageRole | 是否显示 FixedBrandLogo |
|---|---|
| cover | 是 |
| content | 是 |
| closing | 是 |

禁止在背景图中内置 Logo。
