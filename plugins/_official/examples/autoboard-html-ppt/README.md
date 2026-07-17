# AutoBoard HTML PPT Combined Skill V2.6.0

这是一个合并后的单 Skill 包，包含 HTML PPT 总控 Skill v2 与超宽大屏商务增长风格 Skill。

用于 11m × 3m / 3696 × 1008 会场主屏，既可生成新演示，也可优化当前项目、对话或附件中的 `.pptx`。优化时先诊断可编辑页、图片页和混合页，建立内容账本后再重构为内容可追溯、可编辑、可翻页的 HTML 演示文稿。正式内容默认保真；信息过载时通过重组与拆页处理，不能为了美化而删除或改写。

## 目录

```text
autoboard_html_ppt_combined_skill_v2_all_svg/
├── SKILL.md
├── README.md
├── metadata.json
├── orchestrator/
└── style/
```

## 当前固定资产

- 封面背景：`style/assets/bg-cover.svg`
- 内容页背景：`style/assets/bg-content.svg`
- 封尾背景：`style/assets/bg-closing.svg`
- 独立 Logo：`style/assets/logo.svg`

请从根目录 `SKILL.md` 开始执行。

优化 PPT 的预览产物固定写入项目根目录：`index.html` 与同级
`index.html.artifact.json`；源 `.pptx` 保持不变。
