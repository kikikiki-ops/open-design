# Style Binding Rules
# 视觉风格 Skill 绑定规则

## 1. 默认绑定

默认绑定以下视觉风格：

```text
超宽大屏商务增长风格
画布尺寸：3696 × 1008
物理尺寸：11m × 3m
```

该风格适用于会场主屏、开发者大会、品牌营销大会、商业化业务汇报、增长成果展示等场景。

## 2. 总控 Skill 与风格 Skill 的关系

总控 Skill 负责：

- 页面类型判断
- 内容保真
- 拆页
- 组件选择
- HTML 输出
- 质量检查

风格 Skill 负责：

- 色彩
- 字体
- 背景
- 卡片
- 图表
- 间距
- 视觉禁止项

总控 Skill 不应复制全部视觉细节，而应引用风格 Skill。

## 3. 必须继承的风格约束

生成页面时必须继承：

- 画布尺寸
- 安全区
- 背景风格
- 字体层级
- 色彩系统
- 卡片规则
- 图表规则
- 信息密度规则
- 禁止项

## 4. 默认画布

```css
.ppt-slide {
  width: 3696px;
  height: 1008px;
  position: relative;
  overflow: hidden;
}
```

推荐安全区：

```css
.slide-safe-area {
  position: absolute;
  left: 220px;
  right: 220px;
  top: 90px;
  bottom: 90px;
}
```

## 5. 风格冲突处理

如果内容保真与视觉美观冲突，优先级为：

```text
内容完整
↓
信息可读
↓
结构清晰
↓
视觉美观
```

不得为了画面好看删除正式信息。

## 6. 多风格扩展

未来如新增风格 Skill，总控 Skill 只需要切换 `styleSkill` 字段。

示例：

```json
{
  "styleSkill": "ultrawide_business_growth",
  "canvas": {
    "width": 3696,
    "height": 1008
  }
}
```


---

## 背景资产绑定

当绑定 `ultrawide_business_growth_ppt_skill` 时，同时继承其背景系统：

```json
{
  "backgroundVariants": {
    "cover": "assets/bg-cover.png",
    "content": "assets/bg-content.png",
    "closing": "assets/bg-closing.png"
  }
}
```

总控 Skill 不直接使用图片文件，而是在页面规划中输出：

```json
{
  "pageRole": "content",
  "backgroundVariant": "content"
}
```

实际渲染交给组件 Skill 的 `SlideBackground` 能力完成。


## 当前背景图资产映射

默认按用户上传顺序绑定：

- `cover` → `assets/bg-cover.png`
- `content` → `assets/bg-content.png`
- `closing` → `assets/bg-closing.png`

如果后续风格 Skill 替换了背景资产，总控 Skill 仍保持 `pageRole` / `backgroundVariant` 枚举不变。

## 常驻品牌信息策略

绑定当前风格 Skill 时必须遵守：

```json
{
  "autoRenderBrandText": false,
  "autoRenderLogo": false
}
```

背景图自带的左上角品牌标识视为视觉资产，不应再由 HTML 层重复叠加。  
总控 Skill 只应输出来自原始内容的正式文本，不得为了“补齐模板”自动生成品牌副标题或角标。

## 独立 Logo 资产绑定

绑定当前风格 Skill 时，同时启用独立 Logo 组件：

```json
{
  "fixedBrandLogo": {
    "enabled": true,
    "sourceUrl": "https://p5-ad.adkwai.com/udata/pkg/ks-ad-fe/md-tools/quick-cut/6689:5117.b90a9c9d53932e9b.svg",
    "localPath": null,
    "showOn": ["cover", "content", "closing"]
  }
}
```

背景图资产必须无 Logo；Logo 由 HTML / 组件层渲染。
