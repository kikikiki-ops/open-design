# AutoBoard HTML PPT Combined Skill V2

## 1. Skill 定位

本 Skill 是一套完整的 HTML 型 PPT 生成能力，包含：

- `orchestrator/`：总控、内容保真、页面路由、拆页、组件能力选择和质量检查
- `style/`：3696 × 1008 超宽大屏视觉系统、组件规范、字阶、图标、背景和独立 Logo 资产

统一输出目标：

```text
HTML 型可编辑 PPT
画布：3696 × 1008 px
物理尺寸：11m × 3m
比例：11:3
```

---

## 2. 最高优先级

执行优先级固定为：

```text
原始内容完整
→ 信息关系正确
→ 页面结构清晰
→ 组件容量合理
→ 视觉风格统一
```

除非用户明确要求改写、精简或优化文案，否则：

- 不得删除正式内容
- 不得改写正式内容
- 不得修改数字、百分比、单位和专有名词
- 不得改变因果、流程、对比、阶段和层级关系
- 内容装不下时必须调整结构或拆页，不得缩字号硬塞

明显编辑指令、修改备注和待替换占位符不进入最终页面正文。

---

## 3. 执行顺序

### Step 1：读取总控规则

先读取：

```text
orchestrator/SKILL.md
orchestrator/rules/orchestration_pipeline.md
orchestrator/rules/content_preservation.md
orchestrator/rules/source_structure_analysis.md
orchestrator/rules/page_role_router.md
orchestrator/rules/page_type_router.md
orchestrator/rules/layout_selection.md
orchestrator/rules/component_interface.md
```

完成：

1. 原始内容提取
2. 内容账本建立
3. 编辑备注识别
4. 页面角色识别
5. 页面类型判断
6. 布局与组件能力选择
7. 拆页判断

### Step 2：绑定视觉风格

再读取：

```text
style/SKILL.md
style/style.md
style/components.md
style/background_system.md
style/logo_system.md
style/asset_manifest.json
```

将页面计划绑定到统一视觉系统。

### Step 3：生成 HTML 型 PPT

输出必须遵守：

```text
orchestrator/rules/html_output_contract.md
```

所有标题、正文、数字和标签必须为真实 HTML 文本或独立可编辑组件，不得将整页内容图片化。

### Step 4：执行双重检查

先执行：

```text
orchestrator/rules/quality_check.md
```

再执行：

```text
style/checklist.md
```

任一检查失败时，不得直接交付；应重新布局、更换页面变体或拆页。

---

## 4. 页面背景路由

本版本使用三张独立 SVG 背景：

```text
cover   → style/assets/bg-cover.svg
content → style/assets/bg-content.svg
closing → style/assets/bg-closing.svg
```

页面映射：

```text
CoverPage   → cover
普通内容页  → content
ClosingPage → closing
```

背景图只负责视觉氛围，不承载可编辑正文信息。

---

## 5. 独立 Logo

Logo 使用：

```text
style/assets/logo.svg
```

默认在封面、内容页、封尾页独立渲染。

禁止：

- 把 Logo 烘焙进背景图
- 从背景图裁切 Logo
- 重复生成第二个品牌文字
- 在 Logo 下方自动补充“快手联盟”等常驻副标题

Logo 规则详见：

```text
style/logo_system.md
```

---

## 6. 页面类型与组件

页面类型优先使用总控 Skill 中的路由结果，具体视觉结构参考风格 Skill 的组件系统。

必须支持的典型页面包括：

- 封面页
- 目录页
- 章节过渡页
- 核心指标页
- 数据结论页
- 案例成果页
- 多列对比页
- 策略分析页
- 流程链路页
- 能力矩阵页
- 路线图页
- 封尾页

目录页必须支持以下结构：

```text
顶部品牌区
顶部页面类型标识（目录 · CONTENTS）
中心大会 / 汇报主标题
横向三列章节导航区
超大章节序号
章节名称
章节辅助说明
列间竖向分隔线
底部时间 / 地点信息
底部轻氛围背景
```

---

## 7. 组件 Skill 接入方式

当真实 PPT 组件 Skill 尚未接入时，使用总控中的抽象组件能力输出语义化 HTML。

当真实组件 Skill 接入后：

```text
总控页面类型
→ 布局能力
→ 页面组件
→ 内容组件
→ 基础视觉组件
```

组件容量不足时必须拆页，不允许删除原始内容。

---

## 8. 输出建议

每次生成建议输出：

1. 文档结构分析
2. 内容账本摘要
3. 编辑备注识别结果
4. 页面规划 JSON
5. HTML 页面
6. 内容保真报告
7. 页面结构检查
8. 视觉风格检查

---

## 9. 文件入口

```text
SKILL.md                         # 当前统一入口
orchestrator/SKILL.md            # 总控详细规则
style/SKILL.md                   # 风格详细规则
style/asset_manifest.json        # 背景与 Logo 资产映射
style/example.html               # 风格预览示例
```
