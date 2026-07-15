# Page Background Routing

## 1. 页面角色与背景类型分离

页面角色：

```text
cover | section | content | closing
```

背景类型：

```text
cover | content | closing
```

映射：

| pageRole | backgroundVariant |
|---|---|
| cover | cover |
| section | content |
| content | content |
| closing | closing |

章节页使用内容背景，不代表它是普通内容结构；背景类型也不得反向决定页面角色。

## 2. 资产职责

- 风格 Skill 管理背景资产地址；
- 总控输出 `backgroundVariant`；
- 组件 Skill 使用 `SlideBackground` 渲染；
- Logo 使用独立 `BrandLogo` 渲染。

## 3. 禁止

背景图不得承载：正式标题、正文、数字、单位、图表标签、二维码或 Logo。
