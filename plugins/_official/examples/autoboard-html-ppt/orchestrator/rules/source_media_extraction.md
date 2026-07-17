# 来源图片发现、提取与验收规则

本规则是 `image_text_composition.md P0 协议`的执行层，规定"如何发现图片"、"如何提取图片"、"如何建账"和"如何验收"。P0 协议负责"是否保留"的决策；本文件负责"如何执行"的动作序列。

---

## 16. 图片关系证据强度（evidence_strength）

每张图片绑定关系必须声明证据强度，驱动后续审计严格程度：

| `evidence_strength` | 含义 | 对应 `binding_method` |
|---------------------|------|----------------------|
| `definitive` | 同一 GroupShape 或 bbox 重叠 | `group`、`bbox_overlap` |
| `high` | 空间邻近距离 ≤ 0.04 | `spatial_proximity` |
| `medium` | 同行中心 Y 坐标差 ≤ 0.08 | `same_row` |
| `low` | 整页唯一图片，关联全部文字 | `page_only_image` |
| `inferred` | 无法通过空间分析确定，人工推断 | `uncertain` |

**规则：**
- `evidence_strength: "inferred"` 的图片必须在质量报告中标注 `WARN: weak-image-binding`
- `evidence_strength: "low"` 及以下的图片，在 HTML 中允许位置灵活，但仍须在同一 `ppt-slide` 内
- 禁止在没有任何空间证据的情况下将图片标记为 `definitive` 或 `high`

---

## 17. Source-Media 两层结构（SourceItem 与 MediaInstance）

每张来源图片必须拆分为：

- **SourceItem**：唯一来源事实记录，存在于 `source_asset_manifest.json`
- **MediaInstance**：某输出页面中的渲染实例，存在于 `page_plan.json` 的 `source_asset_ids` 或 `contentMapping` 中

| 层 | 字段 | 说明 |
|---|------|------|
| SourceItem | `asset_id`、`source_page`、`semantic_tier`、`preservation` | 来源事实，不重复 |
| MediaInstance | `instanceId`、`sourceAssetId`（引用 SourceItem）、`outputPage`、`role`、`layout_position` | 每次渲染独立记录 |

**允许一张 SourceItem 对应多个 MediaInstance（合理场景）：**
- `role: "navigation_context"`：目录页展示封面的小缩略图
- `role: "comparison_reference"`：对比页左侧展示"Before"版本图片
- `role: "legend"`：图例中引用某图片作为视觉说明

**禁止：** 不同内容的图片共享同一 `asset_id`；同一来源页面的图片不标明 `source_page` 就归入账本。

---

## 18. 默认分类协议（classification_pending）

提取图片后，在空间分析完成之前，所有图片的 `semantic_tier` 必须先设为 `classification_pending`：

```json
{
  "asset_id": "src-slide-03-asset-01",
  "semantic_tier": "classification_pending",
  "preservation": "must_preserve",
  "$comment": "分类待确认，空间分析完成后更新"
}
```

**禁止：**
- 在空间分析前直接写死 `semantic_tier: "decorative"`（常见错误：因为图片面积小就直接标记装饰）
- 在空间分析前直接写死 `semantic_tier: "essential"`（跳过分析流程）
- 用任意默认值（`null`、`unknown`、`optional`）代替 `classification_pending`

**流程：**
```
extract → classification_pending
↓ 空间分析完成
升级为 essential / supporting / decorative / duplicate
↓
验证覆盖率
```

---

## 19. 禁止路径伪造（P0 硬约束）

以下行为触发 `quality_report.json` 失败，代码 `source-media-path-faked`：

```
❌ 声明 "output_path": "assets/source-media/slide-03-asset-01.png"
   但该文件并不存在于项目目录中

❌ 在 source_asset_manifest.json 中记录图片，
   但在 HTML 中引用的是完全不同来源的 CDN 链接

❌ 提取时未执行 Python 代码，只在 JSON 中写入路径作为"计划"
   （计划路径 ≠ 已提取路径）

❌ 用 AI 生成的图片覆盖到本应是来源图片的路径
```

**正确做法：**
- 只有在实际执行提取脚本、文件确实写入磁盘后，才在账本中记录 `output_path`
- 未提取成功的图片必须记录 `extraction_status: "failed"`，不得假装成功
- 文件路径检查（§11）在 HTML 生成前必须实际执行，不得跳过

---

## 20. 图文分离禁令（P0）

以下情况触发 `quality_report.json` 失败，代码 `source-media-text-split`：

```
❌ 图片提取后丢入单独的"图片库"，与来源文字账本完全分离
❌ 图片账本和文字账本各自独立，没有任何 related_content_ids 绑定
❌ 来源图表数据提取为 OCR 文字后，原始图表截图被丢弃
❌ 原生图表（native chart）存在时，用截图/OCR 代替数据提取
```

**原生图表优先规则：**
- 如果 PPTX 包含可读的原生图表（`.xlsx` embedded data）：
  1. 必须先从 `ppt/charts/` 目录提取原始数据
  2. 数据准确率 > OCR；不得用截图文字替代数据
  3. 原始数据入账本 `asset_type: "chart_data"`，截图入账本 `asset_type: "chart_image"`
  4. 两者都保留，在 HTML 中优先使用原始数据重绘，截图作为 `comparison_reference` 备用

---

## 1. 视觉资产扫描（在建立文字内容账本之前必须先完成）

在建立文字内容账本之前，必须先完成来源文件的**视觉资产扫描**。

对于每一页来源页面，必须检测以下所有类型的视觉素材：

- 普通嵌入图片（PNG / JPEG / WebP / GIF 静态首帧）
- 裁切图片
- 组合对象中的图片
- 蒙版或形状填充中的图片
- SVG 矢量图
- EMF / WMF 等传统矢量格式
- 页面截图（整页渲染图中可识别的独立视觉区域）
- 图表导出的图片（图表截图、数据可视化截图）
- 背景图片（含有信息价值的背景，非纯装饰纹理）
- 图片型页面中的局部插图

**不得只读取文本框和表格。**

---

## 2. 图片提取规则

> **重要：图片提取必须通过 bash 或 Python 代码实际执行，而不是仅在规划文档中声明"已提取"。**
> 完整的可执行脚本和备选方法见 `rules/pptx_image_extraction.md`。

### 2.1 提取目录

必须将来源图片提取到独立目录：

```
assets/source-media/
```

### 2.2 命名规范

推荐命名格式：

```
slide-{sourcePage}-asset-{assetIndex}.{ext}
```

示例：

```
slide-03-asset-01.png
slide-03-asset-02.svg
slide-07-asset-01.jpg
```

### 2.3 路径要求

不得在最终 HTML 中引用来源设备的绝对路径：

```
❌ /Users/xxx/Desktop/...
❌ C:\Users\xxx\...
❌ 临时上传地址（即将过期的 URL）
```

必须使用**可交付的项目内相对路径**。

---

## 3. 图片型页面处理规则

当来源页面为 `image_based_slide`，或图片已经与整页内容扁平化时，**不得只做 OCR 后丢弃原始视觉素材**。

必须同时执行：

1. 识别整页中的文字区域；
2. 识别独立图片、插图、截图、图表和视觉主体区域；
3. 为每个视觉主体建立边界框（`source_bbox`）；
4. 将具有信息价值的视觉区域裁切为独立来源素材；
5. 将裁切素材写入来源图片账本（`source_asset_manifest.json`）；
6. 将裁切素材绑定到对应正文、案例或数据结论；
7. 在新页面中重新排版这些视觉素材。

### 3.1 裁切提取说明

如果无法从源文件直接提取图片，可以从高分辨率页面渲染图中裁切，但必须记录：

```json
"extraction_method": "cropped_from_rendered_slide"
```

### 3.2 图片型页面禁止项

- OCR 完成后只保留文字，丢弃视觉素材；
- 将整页截图直接作为最终页面；
- 因无法提取原始嵌入图片而静默删除插图；
- 用通用图标代替来源业务截图；
- 用 AI 生成图替代来源证据图；
- 用纯文字概括来源图片中的正式内容。

---

## 4. 来源图片账本规则（source_asset_manifest.json）

每张来源图片都必须进入 `content_inventory.json` 或独立的 `source_asset_manifest.json`。

每个图片资产至少包含以下字段：

```json
{
  "asset_id": "src-slide-03-asset-01",
  "source_page": 3,
  "source_file": "uploaded-source.pptx",
  "asset_type": "illustration",
  "semantic_role": "case_evidence",
  "preservation": "must_preserve",
  "original_path": "ppt/media/image4.png",
  "output_path": "assets/source-media/slide-03-asset-01.png",
  "original_width": 1600,
  "original_height": 900,
  "aspect_ratio": 1.7778,
  "source_bbox": {
    "x": 0.52,
    "y": 0.18,
    "width": 0.38,
    "height": 0.62
  },
  "related_content_ids": [
    "source-slide-03-title",
    "source-slide-03-case-result"
  ],
  "caption": null,
  "planned_output_pages": [],
  "render_status": "pending"
}
```

### 4.1 asset_type 枚举值

```
photo | illustration | product_image | portrait | screenshot | ui_screenshot |
chart_image | diagram | case_evidence | logo | qr_code | document_cover |
background | decorative | unknown
```

### 4.2 图片四级语义分类（新）

在填写 `preservation` 字段之前，必须先为每张图片确定**语义等级**（`semantic_tier`）。这是决定保留/省略的主依据。

| 等级 | `semantic_tier` | 定义 | 默认 preservation |
|-----|----------------|------|-----------------|
| **1 级** | `essential` | 直接承载正式内容（案例图、产品截图、数据图表、流程图、人物/场景的证明图）——删除后内容不完整 | `must_preserve` |
| **2 级** | `supporting` | 辅助说明（配图、示意图、说明性截图）——删除后内容完整但视觉减弱 | `must_preserve` / 用户可申请降级 |
| **3 级** | `decorative` | 纯装饰（模板背景、边框花边、渐变底图、重复 Logo）——无内容价值 | `decorative`（允许省略）|
| **4 级** | `duplicate` | 重复（与已记录图片内容完全相同，或多次出现的 Logo 副本）——仅保留一张 | `decorative` / 首次出现改为 `supporting` |

**判定规则：**

1. 凡来自 PPTX 媒体目录（`ppt/media/`）的图片，先假设为 `supporting`（2 级）
2. 符合以下条件的升级为 `essential`（1 级）：
   - 图片 `source_bbox` 占页面面积 > 15%（非小图标）
   - 图片被文字直接引用（"如右图所示"/"见下图"）
   - 图片是截图、产品图、案例现场图
3. 符合以下条件的降级为 `decorative`（3 级）：
   - 图片 `source_bbox` 占页面面积 < 3%（小装饰元素）
   - 图片 `asset_type` 为 `background` 或 `logo`（且不是唯一出现的主 Logo）
   - 图片无法绑定到任何文字内容（`related_content_ids` 为空且 `primary_content_id` 为空）
4. 相同内容的图片在同一 PPTX 中第二次及以后出现，标记为 `duplicate`

**字段升级：** 在 JSON 中新增 `semantic_tier` 字段，`preservation` 字段保持原有枚举值不变。

```json
{
  "asset_id": "src-slide-03-asset-01",
  "semantic_tier": "essential",       // ← 新增：语义等级
  "preservation": "must_preserve",   // ← 由 semantic_tier 驱动
  ...
}
```

### 4.3 preservation 枚举值（原 §4.2，含义不变）

| 值 | 含义 |
|---|---|
| `must_preserve` | 必须出现在最终 HTML 中 |
| `replace_only_with_approval` | 可替换，但需用户明确批准 |
| `decorative` | 经资产扫描确认为纯装饰，允许省略 |
| `user_requested_removal` | 用户明确要求删除 |

**不得使用含义模糊的值**：`optional`、`maybe`、`use_if_needed`。

---

## 5. 图片与正文关系绑定

来源图片不能只记录为"本页有图片"，必须绑定到具体内容。

每张图片至少需要关联以下一种语义：

- 支撑哪个标题
- 解释哪个结论
- 对应哪个案例
- 展示哪个产品
- 证明哪个数据
- 展示哪个流程
- 对应哪个功能
- 对应哪段正文
- 是否是页面主视觉
- 是否是品牌识别资产

推荐关系类型：

```
supports | explains | demonstrates | proves | compares_with |
belongs_to | visualizes | identifies_brand
```

如果图片与文字在来源页面中处于**同一分组、同一卡片或相邻区域**，应默认建立关联，**不得在重新排版时拆散语义关系**。

---

## 5.1 空间邻近性分析与语义关联判定协议（P0 硬约束）

> **这是解决"图片乱插入"问题的核心规则。**
> 仅凭 asset_type、semantic_role 的字段填写无法保证图片与正确内容关联。
> 必须通过以下协议，利用来源页面的空间坐标和分组关系，精确确定每张图片属于哪段内容。

### 一、强制执行顺序

**提取图片后，必须立即在同一脚本中提取所有文字区块的 `source_bbox`（左上角 x/y 比例坐标 + 宽度/高度）**，与图片坐标一起进行空间分析。不得先提取图片、再单独分析文字，两者必须在同一 pass 中完成。

```python
# 在 pptx_image_extraction.py 脚本中扩展：同时提取文字框坐标
for shape in slide.shapes:
    if shape.shape_type == 13:   # 图片
        # ... 原有图片提取逻辑 ...
        asset["source_bbox"] = {
            "x": round(shape.left / slide_width, 4),
            "y": round(shape.top / slide_height, 4),
            "w": round(shape.width / slide_width, 4),
            "h": round(shape.height / slide_height, 4),
        }
    elif shape.has_text_frame:   # 文字块
        text_content = shape.text_frame.text.strip()
        if text_content:
            text_blocks.append({
                "text_id": f"slide-{slide_idx:02d}-text-{text_idx:02d}",
                "text": text_content[:120],  # 截断摘要
                "bbox": {
                    "x": round(shape.left / slide_width, 4),
                    "y": round(shape.top / slide_height, 4),
                    "w": round(shape.width / slide_width, 4),
                    "h": round(shape.height / slide_height, 4),
                }
            })
```

### 二、空间邻近度计算（判定图片属于哪段文字）

使用以下优先级顺序判定图片的 `related_content_ids`：

**优先级 1：同一父分组（shape_group）**
- 如果图片和文字块属于同一 GroupShape，必须绑定，relation_type = `belongs_to`
- 这是最强约束，跳过所有其他判定

**优先级 2：同一矩形区域（bbox 重叠或紧邻）**
```
定义「邻近」：图片 bbox 与文字块 bbox 的最近边距离 ≤ 0.04（相对画布宽度/高度）
```
- 水平方向：图片右边缘 ← → 文字左边缘，距离 ≤ 0.04，relation_type = `supports`（图左文右 / 图右文左）
- 垂直方向：图片底边 ← → 文字顶边，距离 ≤ 0.04，relation_type = `supports`（图上文下 / 图下文上）
- bbox 有重叠：relation_type = `belongs_to`

**优先级 3：垂直带对齐（同一横行）**
```
定义「同行」：图片中心 Y 坐标与文字块中心 Y 坐标差值 ≤ 0.08
```
- 同行内最近的文字块优先关联
- 同行内多个文字块时，左→右顺序全部关联（图片通常是该行内容的视觉说明）

**优先级 4：整页唯一图片**
- 如果该页只有 1 张图片，则关联页面标题（最大字号文字）和页面正文全部内容

**优先级 5：无法判定（默认保守关联）**
- 关联来源页面所有文字内容
- 设置 `relation_confidence: "low"`
- 在质量报告中标记 `WARN: image-binding-uncertain`

### 三、`related_content_ids` 填写规则

```json
{
  "asset_id": "src-slide-03-asset-01",
  "source_page": 3,
  "source_bbox": { "x": 0.52, "y": 0.18, "w": 0.38, "h": 0.62 },
  "spatial_neighbors": [
    {
      "text_id": "slide-03-text-02",
      "text_preview": "产品转化率提升 47%...",
      "distance": 0.021,
      "direction": "left",
      "relation_type": "supports"
    }
  ],
  "related_content_ids": ["slide-03-text-01", "slide-03-text-02"],
  "primary_content_id": "slide-03-text-02",
  "relation_confidence": "high",
  "binding_method": "spatial_proximity"
}
```

**必须填写 `primary_content_id`**（最强关联的一个内容 ID），这是图片在 HTML 输出中的定位锚点——图片必须与此内容放在同一卡片、同一列或相邻位置，**不得跨列或跨卡片分离**。

### 四、输出页面分配规则（基于 `primary_content_id`）

| `primary_content_id` 所在输出页 | 图片分配结果 |
|---------------------------------|-------------|
| 已确定输出页 N | 图片必须放入输出页 N |
| 内容被拆分到页 N 和 N+1 | 图片跟随 `primary_content_id` 所在页 |
| 内容被删减 | 图片跟随保留的核心结论所在页 |
| 内容页未知（`relation_confidence: "low"`）| 放入距离来源页最近的输出页，并在报告中标注 |

**严禁以下行为：**
- 图片按提取顺序（slide-01-asset-01 → 第1页, slide-02-asset-01 → 第2页）机械分配，不考虑内容关联
- 图片被插入与 `primary_content_id` 不在同一输出页的页面
- 多张图片全部堆入封面或第一内容页（这是"来源页未读、按顺序分配"的典型症状）
- 图片与其关联标题、案例文字、数据结论分离在不同幻灯片

### 五、图片插入位置规则（HTML 生成阶段）

绑定关系确定后，在 HTML 中图片必须与关联内容**物理相邻**：

```
图片 "supports" 某卡片标题     → 图片放在该卡片内部（卡片顶部或底部）
图片 "belongs_to" 某分组       → 图片放在该分组容器内，与同组文字同一 flex/grid 父节点
图片 "supports" 某正文区块     → 图片放在该正文左侧、右侧或紧上方
图片 semantic_role = "main_visual" → 放在 safe-zone 视觉中心或主图位置
图片 semantic_role = "flow_diagram" → 放在流程说明文字的上方或内嵌其中
图片 semantic_role = "case_evidence" → 放在案例文字右侧或下方，图文同容器
```

**禁止将图片单独漂浮**（`position:absolute` 脱离文档流，未与任何文字容器绑定）

### 六、关联验证检查

生成 HTML 前必须逐图验证：

```text
对于每张 must_preserve 图片：
[ ] primary_content_id 已填写（不为空）
[ ] primary_content_id 对应的文字在 page_plan 中的输出页与图片分配页一致
[ ] HTML 中图片节点与关联文字在同一父容器或相邻兄弟元素内（data-group-id 或 data-relation-id 匹配）
[ ] 图片不在与关联内容不同的 ppt-slide 中
```

---

## 6. 页面规划强制绑定规则

`page_plan.json` 中，每个输出页面必须明确列出来源图片 ID：

```json
{
  "output_page": 5,
  "source_pages": [3],
  "page_type": "CaseEvidencePage",
  "content_ids": [
    "source-slide-03-title",
    "source-slide-03-problem",
    "source-slide-03-result"
  ],
  "source_asset_ids": [
    "src-slide-03-asset-01",
    "src-slide-03-asset-02"
  ],
  "media_layout": "main_image_with_evidence_text"
}
```

如果来源页存在 `must_preserve` 图片，而页面规划中**没有对应 `source_asset_ids`**，页面规划不得通过。

必须先执行以下操作之一：

1. 将图片放入当前输出页；
2. 将图片分配至相邻拆分页；
3. 与来源内容一起移动到新的案例页；
4. 明确记录用户要求删除；
5. 明确记录图片属于已确认的装饰素材。

**模板不支持来源图片时，必须：**

- 更换为支持图片的模板；
- 使用 `MediaTextSplit`；
- 使用 `SourceMediaFrame`；
- 使用 `SourceMediaRail`；
- 使用 `DualMediaCompare`；
- 使用 `MediaFlowTrack`；
- 或拆分新页面。

> **"模板没有位置"不能成为删除来源图片的理由。**

---

## 7. 来源图片渲染规则

所有被规划使用的来源图片必须在最终 HTML 中**实际渲染**。

推荐结构：

```html
<figure
  class="source-media-frame"
  data-source-id="src-slide-03-asset-01"
  data-source-page="3"
  data-asset-role="case-evidence"
>
  <img
    src="assets/source-media/slide-03-asset-01.png"
    alt="来源第 3 页案例图片"
  />
</figure>
```

必须保留：`data-source-id`、`data-source-page`、`data-asset-role`。

### 7.1 以下情况不视为"图片已保留"

- 图片路径存在，但页面没有 `<img>` 或可见媒体节点；
- 图片节点使用 `display: none`；
- 图片透明度为 0；
- 图片尺寸为 0；
- 图片完全位于画布外；
- 图片被其他不透明模块完全遮挡；
- 图片仅作为不可见预加载资源；
- 图片只出现在生成报告中；
- 图片被替换成通用占位符。

---

## 8. 原图优先规则

当来源文件已经提供正式图片时，优先级如下：

```
来源原图
> 来源页中裁切出的原始视觉区域
> 用户额外提供的替代图片
> 明确获得批准的重新生成图片
> 通用素材
> AI 临时生成图
```

### 8.1 未经用户批准，禁止：

- 用 AI 生成图替换产品实拍图；
- 用通用图库图替换人物照片；
- 用重新绘制的图标替换业务截图；
- 用抽象插画替换案例证据；
- 用 CSS 图形替换来源图表截图；
- 用文本卡片替换图片证据。

### 8.2 允许重新绘制的内容仅限：

- 简单箭头；
- 分隔线；
- 无品牌识别的基础图标；
- 可以从来源数据完整重建的简单图表；
- 明确标记为装饰的视觉元素。

---

## 9. 图片数量覆盖规则

完成来源资产扫描后，必须计算：

| 指标 | 说明 |
|------|------|
| `sourceMeaningfulAssetCount` | 来源中有信息价值的图片总数 |
| `plannedSourceAssetCount` | 已进入 page_plan 的图片数量 |
| `renderedSourceAssetCount` | 最终 HTML 中实际渲染的图片数量 |
| `omittedSourceAssetCount` | 未渲染的图片数量 |

必须满足：

```
sourceMeaningfulAssetCount
= plannedSourceAssetCount
= renderedSourceAssetCount + userApprovedRemovalCount + confirmedDecorativeCount
```

对于所有 `must_preserve` 图片，必须满足：

```
mustPreserveAssetCount = renderedMustPreserveAssetCount
```

否则质量检查**必须失败**。

---

## 10. 图片遗漏失败条件

出现以下任一情况，必须将 `quality_report.json` 标记为 `status: fail`：

| 失败代码 | 触发条件 |
|---------|---------|
| `source-media-not-inventoried` | 来源图片未进入资产账本 |
| `source-media-not-planned` | must_preserve 图片未进入 page_plan |
| `source-media-not-rendered` | 已规划图片未出现在最终 HTML 中 |
| `source-media-path-broken` | 图片路径不可访问或文件不存在 |
| `source-media-hidden` | 图片节点不可见（display:none / opacity:0 / 尺寸为0） |
| `source-media-outside-canvas` | 图片完全位于画布外 |
| `source-media-unapproved-replacement` | 未经批准用 AI 图或通用图标替代来源图片 |
| `source-media-relationship-lost` | 图片与对应正文语义绑定断开 |
| `source-media-count-mismatch` | 来源有意义图片数量与最终处理数量不一致 |
| `source-media-silently-omitted` | must_preserve 图片静默省略，无任何记录 |

示例：

```json
{
  "code": "source-media-not-rendered",
  "asset_id": "src-slide-03-asset-01",
  "source_page": 3,
  "planned_output_page": 5,
  "message": "来源图片已进入内容账本和页面规划，但未在最终 HTML 中找到可见节点"
}
```

**只要存在一个未处理的 `must_preserve` 图片，最终交付不得标记为通过。**

---

## 11. 图片路径可用性检查

最终交付前必须逐一验证：

- 文件是否真实存在；
- HTML 路径是否可访问；
- 文件不是 0 字节；
- 图片能够正常解码；
- 相对路径在预览环境中有效；
- 不依赖来源设备绝对路径；
- 不依赖临时上传地址；
- 不依赖即将过期的 URL；
- SVG 不包含无法加载的外部依赖；
- 图片在 HTML 中具有可见宽高。

### 11.1 推荐交付目录结构

```
index.html
assets/
  source-media/
    slide-03-asset-01.png
    slide-03-asset-02.svg
  style/
    bg-cover.svg
    bg-content.svg
    bg-closing.svg
    logo.svg
source_asset_manifest.json
content_inventory.json
page_plan.json
quality_report.json
```

---

## 12. 溢出与拆页规则

如果保留来源图片导致当前页面内容容量不足，**不得删除或缩小图片至不可辨认**。

处理顺序必须为：

1. 调整图文占比；
2. 更换支持图片的版式；
3. 减少非必要装饰；
4. 缩短图片旁的辅助说明（不得改写正式内容）；
5. 将图片与对应内容拆分到连续页面；
6. 创建独立案例证据页或图片展示页。

禁止：

- 删除来源图片解决溢出；
- 将图片缩小为无法识别的缩略图；
- 裁掉图片核心主体；
- 隐藏图片；
- 将图片移出安全区；
- 用占位符替代；
- 将多张不同语义图片拼成无法阅读的小宫格。

---

## 13. 装饰图片判定限制

只有**同时满足以下全部条件**的素材，才允许标记为 `decorative`：

1. 不包含文字、数字、Logo、二维码或品牌信息；
2. 不展示产品、人物、案例、界面、图表或业务关系；
3. 删除后不影响任何正文理解；
4. 删除后不影响来源页面的证据链；
5. 删除后不影响品牌识别；
6. 删除后不改变页面核心叙事；
7. 已在资产账本中记录删除理由。

账本记录示例：

```json
{
  "asset_id": "src-slide-04-asset-06",
  "preservation": "decorative",
  "omit_reason": "无语义的右下角渐变光斑，由新背景系统替代"
}
```

**不得仅因为图片面积小、风格不一致或模板没有位置，就将其标记为装饰。**

---

## 14. 图片素材生成前检查

生成页面前必须确认：

```text
[ ] 是否完成所有来源页面的图片扫描（在建立文字账本之前）
[ ] 是否提取嵌入图片和组合对象中的图片
[ ] 是否识别图片型页面中的局部插图
[ ] 是否为每张有意义图片生成唯一 asset_id
[ ] 是否判断 must_preserve 或 decorative
[ ] 是否建立图片与正文的关系绑定
[ ] 是否将 must_preserve 图片分配至输出页面
[ ] 当前模板是否具备对应图片槽位
[ ] 如无图片槽位，是否更换模板或拆页
```

未完成以上检查，不得开始生成最终 HTML。

---

## 15. 图片素材生成后检查

输出完成后必须确认：

```text
[ ] 所有 must_preserve 图片是否进入内容账本
[ ] 所有 must_preserve 图片是否进入 page_plan
[ ] 所有计划图片是否在最终 HTML 中实际出现
[ ] 所有图片路径是否有效
[ ] 所有图片节点是否可见
[ ] 图片是否位于安全区或允许的全出血区域
[ ] 图片是否未被拉伸变形
[ ] 图片是否未裁掉核心主体
[ ] 图片与对应正文是否仍保持语义关联
[ ] 是否未使用通用图标或 AI 图替代来源证据图
[ ] 是否没有来源图片被静默省略
[ ] 来源有意义图片数量与最终处理数量是否一致
```

---

## 16. 核心执行原则

1. **来源图片与来源文字具有同等的正式内容地位**。
2. 未经用户明确允许，不得因为换模板、统一风格、控制密度或空间不足而删除来源图片。
3. 所有具有信息价值的来源图片必须经历**发现 → 提取 → 入账 → 绑定 → 规划 → 渲染 → 验收**七个阶段。
4. 只写"保留来源图片"不算完成；必须用唯一资产 ID、页面映射和数量校验证明图片已进入最终输出。
5. 无法判断图片是否重要时，**默认保留，而不是默认省略**。
