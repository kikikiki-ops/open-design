# Page Role Router

## 1. 角色先于类型

先输出 `pageRole`，再选择 `pageType`。角色枚举：

```text
cover | section | content | closing
```

## 2. Cover Gate

全部满足才通过：

- 用户明确指定封面，或为整套演示首屏；
- 仅含主题、演讲人、日期、组织等开场信息；
- `metricCount = 0`；
- `chartCount = 0`；
- `processNodeCount = 0`；
- `peerGroupCount <= 1`；
- `mustRenderItemCount <= 4`。

任何条件不满足，拒绝 `CoverPage`。

## 3. Section Gate

全部满足才通过：

- 有明确章节过渡意图；
- 有章节编号/章节名/简短导语；
- 无指标、图表、流程、案例、对比、公式、画廊；
- `peerGroupCount <= 1`；
- `mustRenderItemCount <= 4`；
- 正文不超过 80 个汉字。

章节标题中含“增长、升级、策略、预算”等词，不构成章节证据。

## 4. Closing Gate

全部满足才通过：

- 用户明确指定，或位于演示结尾；
- 内容以感谢、Q&A、合作邀请、联系方式、品牌收束为主；
- 不承担复杂业务解释。

## 5. 默认

未通过任何 Hero Gate 时：

```json
{"pageRole": "content"}
```

## 6. 反误判检查

以下任意条件成立时，`pageRole = cover/section` 直接失败：

- `metricCount >= 1`；
- `peerGroupCount >= 2`；
- `relationCount >= 1` 且关系需解释；
- 存在图表/多图/流程；
- `mustRenderItemCount > 4`；
- 页面目标包含“说明、对比、证明、拆解、展示过程”。
