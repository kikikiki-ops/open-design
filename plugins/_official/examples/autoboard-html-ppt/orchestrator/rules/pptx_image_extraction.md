# PPTX 图片实际提取规则（可执行动作协议）

> **本规则是 `source_media_extraction.md` 的执行层补充。**
> `source_media_extraction.md` 规定"要保留什么"，本文件规定"如何用代码实际提取"。

---

## 0. 核心问题说明

PPTX 文件本质上是 ZIP 压缩包，图片以二进制形式嵌入在 `ppt/media/` 目录中。

**AI 直接读取 PPTX 内容无法获取图片的实际字节流。**
如果 AI 不执行实际的解包操作，HTML 中的 `<img>` 要么：
- 引用不存在的路径（图片不显示）
- 引用来源设备的绝对路径（换机器后立即失效）
- 被静默省略（页面无任何图片）

**必须通过 bash 或 Python 脚本实际解包 PPTX 并提取图片文件，才能让最终 HTML 正确引用图片。**

### 0.1 只判断 shape_type == 13 会遗漏的图片类型

仅检测 `MSO_SHAPE_TYPE.PICTURE (13)` 会导致以下图片类型**静默遗漏**：

| 遗漏类型 | 说明 | 检测方法 |
|---------|------|---------|
| **背景图** | 幻灯片背景 `slide.background.fill.type == PP_FILL.PICTURE` | 检查 `slide.background.fill` |
| **形状填充图** | 矩形/圆形等被填充了图片（`shape.fill.type == PP_FILL.PICTURE`） | 检查非图片形状的 `.fill.type` |
| **占位符中的图片** | `shape_type == 14`（`PLACEHOLDER`）且占位符内含图片 | 检查 `placeholder_format.type` + `.image` |
| **SVG 图片** | `shape_type == 13` 但 ext 为 `.svg` 或 `.emf`（矢量图） | ext 判断 + EMF 需特殊处理 |
| **视频嵌入** | `shape_type == 16 / 17`（`MEDIA` 类型），含视频帧图 | 检查 `shape_type in (16, 17)` |
| **OLE 对象中的图片** | Excel 图表嵌入为 OLE 对象，含预览图 | `shape_type == 3`（OLE_OBJECT）检查 `.image` |

---

## 1. 提取前提条件检查

在开始处理 PPTX 之前，必须先确认：

```bash
# 检查 PPTX 文件是否存在
ls -lh /path/to/source.pptx

# 检查可用工具（任选其一即可）
python3 -c "import pptx; print('python-pptx OK')"   # 推荐
python3 -c "import zipfile; print('zipfile OK')"      # 备选
which unzip                                            # 备选
```

---

## 2. 推荐提取方法：Python（python-pptx）

### 2.1 完整提取脚本

以下脚本必须在项目目录下执行，提取所有图片到 `assets/source-media/`：

```python
#!/usr/bin/env python3
"""
PPTX 图片提取脚本
用法：python3 extract_pptx_images.py <source.pptx> [output_dir]
输出：assets/source-media/ 目录下的所有图片 + source_asset_manifest.json
"""
import sys
import os
import json
import shutil
from pathlib import Path

try:
    from pptx import Presentation
    from pptx.util import Inches
    HAS_PPTX = True
except ImportError:
    HAS_PPTX = False

import zipfile

def extract_images(pptx_path: str, output_dir: str = "assets/source-media") -> dict:
    """提取 PPTX 中所有图片，同时提取文字块坐标，返回资产清单（含空间关联分析所需数据）"""
    pptx_path = Path(pptx_path)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    assets = []
    text_blocks_by_page = {}  # slide_idx -> list of text_block
    asset_index = {}  # page -> count

    # 方法1：用 python-pptx 提取（保留页面关联）
    if HAS_PPTX:
        prs = Presentation(str(pptx_path))
        for slide_idx, slide in enumerate(prs.slides, start=1):
            slide_width = prs.slide_width
            slide_height = prs.slide_height
            text_blocks_by_page[slide_idx] = []
            text_idx = 0

            def process_shape_for_text(s, slide_idx, text_blocks):
                """提取形状的文字块和 bbox"""
                nonlocal text_idx
                if hasattr(s, 'text_frame') and s.text_frame:
                    text = s.text_frame.text.strip()
                    if text:
                        text_idx += 1
                        text_blocks.append({
                            "text_id": f"slide-{slide_idx:02d}-text-{text_idx:02d}",
                            "text_preview": text[:120],
                            "bbox": {
                                "x": round(s.left / slide_width, 4) if slide_width else 0,
                                "y": round(s.top / slide_height, 4) if slide_height else 0,
                                "w": round(s.width / slide_width, 4) if slide_width else 0,
                                "h": round(s.height / slide_height, 4) if slide_height else 0,
                            },
                            "is_title": getattr(s, 'name', '').lower().startswith('title'),
                        })

            page_assets = []
            for shape in slide.shapes:
                # ① 提取文字块坐标（先于图片提取，确保全页文字已入账）
                if shape.has_text_frame:
                    process_shape_for_text(shape, slide_idx, text_blocks_by_page[slide_idx])
                # ② 处理图片形状（MSO_SHAPE_TYPE.PICTURE == 13）
                if shape.shape_type == 13:  # MSO_SHAPE_TYPE.PICTURE
                    img = shape.image
                    ext = img.ext  # png, jpg, svg, etc.
                    asset_index[slide_idx] = asset_index.get(slide_idx, 0) + 1
                    idx = asset_index[slide_idx]
                    filename = f"slide-{slide_idx:02d}-asset-{idx:02d}.{ext}"
                    out_path = output_dir / filename
                    with open(out_path, 'wb') as f:
                        f.write(img.blob)

                    # 记录位置信息（相对于幻灯片的比例坐标）
                    bbox = {
                        "x": round(shape.left / slide_width, 4) if slide_width else 0,
                        "y": round(shape.top / slide_height, 4) if slide_height else 0,
                        "w": round(shape.width / slide_width, 4) if slide_width else 0,
                        "h": round(shape.height / slide_height, 4) if slide_height else 0,
                    }

                    # ③ 计算空间邻近性，找出最近文字块（primary_content_id）
                    primary_content_id, spatial_neighbors = find_nearest_text(
                        bbox, text_blocks_by_page[slide_idx], slide_idx
                    )

                    asset = {
                        "asset_id": f"src-slide-{slide_idx:02d}-asset-{idx:02d}",
                        "source_page": slide_idx,
                        "source_file": pptx_path.name,
                        "asset_type": "photo",  # 待 AI 进一步分类
                        "semantic_role": "unknown",  # 待 AI 填写
                        "preservation": "must_preserve",  # 默认保留
                        "original_path": f"ppt/media/{filename}",
                        "output_path": f"assets/source-media/{filename}",
                        "source_bbox": bbox,
                        "primary_content_id": primary_content_id,  # 最强关联文字
                        "spatial_neighbors": spatial_neighbors,     # 所有邻近文字
                        "related_content_ids": [n["text_id"] for n in spatial_neighbors],
                        "relation_confidence": "high" if spatial_neighbors else "low",
                        "binding_method": "spatial_proximity" if spatial_neighbors else "uncertain",
                        "caption": None,
                        "planned_output_pages": [],
                        "render_status": "extracted"
                    }
                    assets.append(asset)
                    page_assets.append(asset)

                # 处理组合形状中的图片（GroupShape）
                elif hasattr(shape, 'shapes'):
                    # 组内图片与同组文字 bbox 判定为最强绑定（belongs_to）
                    group_texts = []
                    for child in shape.shapes:
                        if hasattr(child, 'text_frame') and child.text_frame:
                            t = child.text_frame.text.strip()
                            if t:
                                group_texts.append(t[:60])
                    for child in shape.shapes:
                        if child.shape_type == 13:
                            img = child.image
                            ext = img.ext
                            asset_index[slide_idx] = asset_index.get(slide_idx, 0) + 1
                            idx = asset_index[slide_idx]
                            filename = f"slide-{slide_idx:02d}-asset-{idx:02d}.{ext}"
                            out_path = output_dir / filename
                            with open(out_path, 'wb') as f:
                                f.write(img.blob)
                            # 组合形状内图片优先绑定同组文字
                            group_text_preview = " | ".join(group_texts) if group_texts else ""
                            asset = {
                                "asset_id": f"src-slide-{slide_idx:02d}-asset-{idx:02d}",
                                "source_page": slide_idx,
                                "source_file": pptx_path.name,
                                "asset_type": "photo",
                                "semantic_role": "unknown",
                                "preservation": "must_preserve",
                                "original_path": f"ppt/media/{filename}",
                                "output_path": f"assets/source-media/{filename}",
                                "source_bbox": {},
                                "primary_content_id": None,  # 同组文字 ID 待 §5.1 完善
                                "spatial_neighbors": [],
                                "related_content_ids": [],
                                "relation_confidence": "high" if group_texts else "low",
                                "binding_method": "group",
                                "group_text_preview": group_text_preview,
                                "caption": None,
                                "planned_output_pages": [],
                                "render_status": "extracted"
                            }
                            assets.append(asset)

            # ③ 提取幻灯片背景图（shape_type 循环内无法捕获）
            try:
                from pptx.enum.dml import PP_FILL
                bg_fill = slide.background.fill
                if hasattr(bg_fill, 'type') and str(bg_fill.type) == 'PICTURE (2)':
                    img = bg_fill.picture
                    ext = img.ext if hasattr(img, 'ext') else 'png'
                    asset_index[slide_idx] = asset_index.get(slide_idx, 0) + 1
                    idx = asset_index[slide_idx]
                    filename = f"slide-{slide_idx:02d}-bg-{idx:02d}.{ext}"
                    with open(output_dir / filename, 'wb') as f:
                        f.write(img.blob)
                    assets.append({
                        "asset_id": f"src-slide-{slide_idx:02d}-bg-{idx:02d}",
                        "source_page": slide_idx,
                        "source_file": pptx_path.name,
                        "asset_type": "background",
                        "semantic_tier": "decorative",
                        "semantic_role": "slide_background",
                        "preservation": "decorative",
                        "original_path": f"ppt/media/{filename}",
                        "output_path": f"assets/source-media/{filename}",
                        "source_bbox": {"x": 0, "y": 0, "w": 1, "h": 1},
                        "primary_content_id": None,
                        "spatial_neighbors": [],
                        "related_content_ids": [],
                        "relation_confidence": "low",
                        "binding_method": "background",
                        "caption": None,
                        "planned_output_pages": [],
                        "render_status": "extracted"
                    })
            except Exception:
                pass  # 背景无图片或 API 不支持

            # ④ 提取形状填充图（矩形/圆形等被填充了图片，shape_type != 13）
            for shape in slide.shapes:
                if shape.shape_type == 13:
                    continue  # 已在 ② 处理
                try:
                    from pptx.enum.dml import PP_FILL
                    if hasattr(shape, 'fill') and hasattr(shape.fill, 'type') \
                            and str(shape.fill.type) == 'PICTURE (2)':
                        img = shape.fill.picture
                        ext = getattr(img, 'ext', 'png')
                        asset_index[slide_idx] = asset_index.get(slide_idx, 0) + 1
                        idx = asset_index[slide_idx]
                        filename = f"slide-{slide_idx:02d}-fill-{idx:02d}.{ext}"
                        with open(output_dir / filename, 'wb') as f:
                            f.write(img.blob)
                        fill_bbox = {
                            "x": round(shape.left / slide_width, 4) if slide_width else 0,
                            "y": round(shape.top / slide_height, 4) if slide_height else 0,
                            "w": round(shape.width / slide_width, 4) if slide_width else 0,
                            "h": round(shape.height / slide_height, 4) if slide_height else 0,
                        }
                        # 占页面 < 5% 的填充图视为装饰
                        area = fill_bbox["w"] * fill_bbox["h"]
                        tier = "decorative" if area < 0.05 else "supporting"
                        primary_id, neighbors = find_nearest_text(
                            fill_bbox, text_blocks_by_page[slide_idx], slide_idx
                        )
                        assets.append({
                            "asset_id": f"src-slide-{slide_idx:02d}-fill-{idx:02d}",
                            "source_page": slide_idx,
                            "source_file": pptx_path.name,
                            "asset_type": "illustration",
                            "semantic_tier": tier,
                            "semantic_role": "shape_fill",
                            "preservation": "decorative" if tier == "decorative" else "must_preserve",
                            "original_path": f"ppt/media/{filename}",
                            "output_path": f"assets/source-media/{filename}",
                            "source_bbox": fill_bbox,
                            "primary_content_id": primary_id,
                            "spatial_neighbors": neighbors,
                            "related_content_ids": [n["text_id"] for n in neighbors],
                            "relation_confidence": "high" if neighbors else "low",
                            "binding_method": "shape_fill",
                            "caption": None,
                            "planned_output_pages": [],
                            "render_status": "extracted"
                        })
                except Exception:
                    pass  # 形状无填充或 API 不支持

    else:
        # 方法2：用 zipfile 直接解包（不保留页面关联，无法做空间分析）
        print("[WARNING] python-pptx not available, using zipfile fallback — spatial binding unavailable")
        with zipfile.ZipFile(str(pptx_path), 'r') as z:
            media_files = [f for f in z.namelist() if f.startswith('ppt/media/')]
            for i, media_path in enumerate(media_files, start=1):
                filename = Path(media_path).name
                out_path = output_dir / filename
                with z.open(media_path) as src, open(out_path, 'wb') as dst:
                    shutil.copyfileobj(src, dst)
                asset = {
                    "asset_id": f"src-asset-{i:03d}",
                    "source_page": None,  # zipfile 方式无法确定页面
                    "source_file": pptx_path.name,
                    "asset_type": "unknown",
                    "semantic_role": "unknown",
                    "preservation": "must_preserve",
                    "original_path": media_path,
                    "output_path": f"assets/source-media/{filename}",
                    "source_bbox": {},
                    "primary_content_id": None,
                    "spatial_neighbors": [],
                    "related_content_ids": [],
                    "relation_confidence": "low",
                    "binding_method": "uncertain",
                    "caption": None,
                    "planned_output_pages": [],
                    "render_status": "extracted"
                }
                assets.append(asset)

    return {"assets": assets, "text_blocks_by_page": text_blocks_by_page}


def bbox_distance(img_bbox: dict, txt_bbox: dict) -> float:
    """计算两个 bbox 的最近边距离（比例坐标，0 表示重叠）"""
    # img_bbox 和 txt_bbox 均为 {x, y, w, h}
    img_right  = img_bbox["x"] + img_bbox.get("w", img_bbox.get("width", 0))
    img_bottom = img_bbox["y"] + img_bbox.get("h", img_bbox.get("height", 0))
    txt_right  = txt_bbox["x"] + txt_bbox.get("w", txt_bbox.get("width", 0))
    txt_bottom = txt_bbox["y"] + txt_bbox.get("h", txt_bbox.get("height", 0))

    # 水平距离
    if img_bbox["x"] > txt_right:
        dx = img_bbox["x"] - txt_right
    elif txt_bbox["x"] > img_right:
        dx = txt_bbox["x"] - img_right
    else:
        dx = 0  # 水平重叠

    # 垂直距离
    if img_bbox["y"] > txt_bottom:
        dy = img_bbox["y"] - txt_bottom
    elif txt_bbox["y"] > img_bottom:
        dy = txt_bbox["y"] - img_bottom
    else:
        dy = 0  # 垂直重叠

    return round((dx ** 2 + dy ** 2) ** 0.5, 4)


def find_nearest_text(img_bbox: dict, text_blocks: list, slide_idx: int,
                      proximity_threshold: float = 0.08) -> tuple:
    """
    找出与图片空间最近的文字块（primary_content_id）
    返回 (primary_content_id, spatial_neighbors_list)
    """
    if not text_blocks:
        return None, []

    distances = []
    for tb in text_blocks:
        d = bbox_distance(img_bbox, tb["bbox"])
        distances.append((d, tb))

    # 按距离排序
    distances.sort(key=lambda x: x[0])

    # 过滤：距离在阈值内的都作为邻近文字
    neighbors = []
    for d, tb in distances:
        if d <= proximity_threshold:
            # 判定方向
            img_cx = img_bbox["x"] + img_bbox.get("w", 0) / 2
            img_cy = img_bbox["y"] + img_bbox.get("h", 0) / 2
            txt_cx = tb["bbox"]["x"] + tb["bbox"].get("w", 0) / 2
            txt_cy = tb["bbox"]["y"] + tb["bbox"].get("h", 0) / 2
            dx = txt_cx - img_cx; dy = txt_cy - img_cy
            if abs(dx) >= abs(dy):
                direction = "right" if dx > 0 else "left"
            else:
                direction = "below" if dy > 0 else "above"
            neighbors.append({
                "text_id": tb["text_id"],
                "text_preview": tb["text_preview"],
                "distance": d,
                "direction": direction,
                "relation_type": "belongs_to" if d == 0 else "supports",
            })

    # 如果没有邻近文字，取最近的1个（不限阈值）
    if not neighbors and distances:
        d, tb = distances[0]
        neighbors.append({
            "text_id": tb["text_id"],
            "text_preview": tb["text_preview"],
            "distance": d,
            "direction": "unknown",
            "relation_type": "page_association",
        })

    primary = neighbors[0]["text_id"] if neighbors else None
    return primary, neighbors


def main():
    if len(sys.argv) < 2:
        print("用法: python3 extract_pptx_images.py <source.pptx> [output_dir]")
        sys.exit(1)

    pptx_path = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "assets/source-media"

    print(f"正在提取: {pptx_path}")
    result = extract_images(pptx_path, output_dir)
    assets = result["assets"]
    text_blocks_by_page = result["text_blocks_by_page"]

    # 写入资产清单（含空间关联信息）
    manifest = {
        "source_file": Path(pptx_path).name,
        "extraction_method": "python-pptx" if HAS_PPTX else "zipfile",
        "total_assets": len(assets),
        "assets": assets
    }
    manifest_path = "source_asset_manifest.json"
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    print(f"✅ 提取完成：{len(assets)} 张图片 → {output_dir}/")
    print(f"✅ 资产清单 → {manifest_path}")
    for a in assets:
        primary = a.get("primary_content_id", "—")
        confidence = a.get("relation_confidence", "—")
        print(f"   {a['asset_id']} | 第 {a['source_page']} 页 | primary={primary} [{confidence}] | {a['output_path']}")

    # 统计低置信度图片（需要 AI 人工判断关联）
    low_conf = [a for a in assets if a.get("relation_confidence") == "low"]
    if low_conf:
        print(f"\n⚠️ {len(low_conf)} 张图片空间关联置信度低，需 AI 根据内容语义手动绑定 primary_content_id：")
        for a in low_conf:
            print(f"   {a['asset_id']} 第 {a['source_page']} 页 → 请查看来源图片内容后绑定到对应正文")


if __name__ == '__main__':
    main()
```

### 2.2 执行命令

```bash
# 在项目目录中执行
python3 extract_pptx_images.py source.pptx

# 或指定输出目录
python3 extract_pptx_images.py source.pptx assets/source-media
```

---

## 3. 备选提取方法：unzip（最简单）

当 python-pptx 不可用时，可以用 unzip 直接解包：

```bash
# PPTX 就是 ZIP 文件，直接解包
mkdir -p assets/source-media
cd /tmp && cp /path/to/source.pptx source_extract.zip
unzip -q source_extract.zip "ppt/media/*" -d pptx_extracted/

# 将所有媒体文件复制到项目目录
cp pptx_extracted/ppt/media/* /path/to/project/assets/source-media/
```

---

## 4. AI 执行时的强制流程

当 AI 接收到 PPTX 美化请求时，**必须按以下顺序执行实际操作**，而不是仅在规划文档中声明"已保留图片"：

```text
步骤 1：确认 PPTX 文件路径
  - 找到项目目录中的 .pptx 文件
  - 确认文件存在且可读

步骤 2：创建输出目录
  mkdir -p assets/source-media

步骤 3：执行 Python 提取脚本（或 unzip 备选）
  python3 extract_pptx_images.py <source.pptx>

步骤 4：确认提取结果
  ls -la assets/source-media/
  cat source_asset_manifest.json

步骤 5：更新资产清单（空间分析 + 语义绑定）
  - 【重要】同时提取本页所有文字块坐标（bbox），与图片坐标进行空间邻近性分析
  - 按 source_media_extraction.md §5.1 协议执行：分组判定 → 邻近判定 → 同行判定 → 唯一图片判定
  - 为每张图片填写 primary_content_id（最强关联文字的 ID）
  - 填写 related_content_ids（所有关联文字 ID）
  - 填写 relation_confidence（high / medium / low）
  - 填写 binding_method（group / spatial_proximity / same_row / page_only_image / uncertain）
  - 填写 asset_type（photo/screenshot/diagram/...）
  - 填写 semantic_role（与哪个正文对应）
  - 确认 preservation 策略（must_preserve / decorative / ...）
  ⚠️ 如果 primary_content_id 为空，图片将在 HTML 输出中随机插入，必须在此步骤完成绑定

步骤 6：在 page_plan.json 中绑定图片 ID
  - 每个输出页面必须列出 source_asset_ids

步骤 7：在生成的 HTML 中引用相对路径
  <img src="assets/source-media/slide-03-asset-01.png" ... />
  ❌ 不得使用绝对路径
  ❌ 不得使用临时 URL
```

---

## 5. HTML 中图片路径规则（P0 硬约束）

### 5.1 允许的路径格式

```html
<!-- ✅ 正确：相对路径 -->
<img src="assets/source-media/slide-03-asset-01.png" alt="..." />

<!-- ✅ 正确：相对路径（带上级目录） -->
<img src="./assets/source-media/slide-03-asset-01.png" alt="..." />
```

### 5.2 禁止的路径格式

```html
<!-- ❌ 禁止：来源设备绝对路径 -->
<img src="/Users/username/Desktop/source.pptx/media/image1.png" />

<!-- ❌ 禁止：Windows 绝对路径 -->
<img src="C:\Users\username\Downloads\image1.png" />

<!-- ❌ 禁止：临时上传 URL（会过期） -->
<img src="https://files.anthropic.com/tmp/xxxx.png" />

<!-- ❌ 禁止：不存在的占位路径 -->
<img src="assets/source-media/placeholder.png" />

<!-- ❌ 禁止：空 src -->
<img src="" />

<!-- ❌ 禁止：省略图片节点（没有任何 <img>） -->
<!-- 来源图片被静默删除 -->
```

---

## 6. 图片提取失败时的处理策略

| 失败场景 | 处理方式 |
|---------|---------|
| PPTX 中无嵌入图片（纯文字幻灯片） | 正常进行，资产清单为空数组 |
| 图片格式不常见（EMF/WMF） | 记录 `extraction_method: "format_unsupported"`，告知用户需要手动导出 |
| 图片被保护或加密 | 记录 `render_status: "blocked_encrypted"`，询问用户 |
| PPTX 文件损坏 | 尝试 unzip 备选，失败则标记 `blocked_corrupted` |
| 提取路径权限不足 | 切换到 /tmp 中间目录再复制 |

**不得因任何技术困难而静默省略已知存在的图片，必须在质量报告中明确记录。**

---

## 7. 图片提取结果验证

提取完成后必须执行以下验证：

```bash
# 检查文件是否存在且不为空
for f in assets/source-media/*; do
  size=$(wc -c < "$f")
  if [ "$size" -eq 0 ]; then
    echo "警告：空文件 $f"
  else
    echo "OK: $f ($size bytes)"
  fi
done

# 验证图片是否可正常解码
python3 -c "
from PIL import Image
import os
for f in os.listdir('assets/source-media'):
    try:
        img = Image.open(f'assets/source-media/{f}')
        img.verify()
        print(f'OK: {f}')
    except Exception as e:
        print(f'FAIL: {f} - {e}')
" 2>/dev/null || echo "(PIL 不可用，跳过解码验证)"
```

---

## 8. 调试：确认图片在 HTML 中实际可见

生成 HTML 后，执行以下检查脚本确认图片路径有效：

```python
import re
from pathlib import Path

with open('index.html', encoding='utf-8') as f:
    html = f.read()

srcs = re.findall(r'<img[^>]+src="([^"]+)"', html)
print(f"HTML 中共有 {len(srcs)} 个 <img> 标签")

ok = broken = 0
for src in srcs:
    if src.startswith('http'):
        print(f"  外部URL（需网络）: {src[:80]}")
        ok += 1
    elif Path(src).exists():
        print(f"  ✅ {src}")
        ok += 1
    else:
        print(f"  ❌ 路径不存在: {src}")
        broken += 1

print(f"\n结果：{ok} 有效 / {broken} 失效")
if broken > 0:
    print("⚠️ 存在失效路径，图片将无法显示！")
```

---

## 9. 与其他规则的关系

| 规则文件 | 职责 |
|---------|------|
| `source_media_extraction.md` | 定义"要保留什么"（账本结构、preservation 枚举、覆盖率公式） |
| `image_text_composition.md § P0` | 定义"保留决策"（must_preserve vs decorative） |
| **本文件（pptx_image_extraction.md）** | 定义"如何用代码实际提取"（脚本、命令、路径规则） |
| `content_preservation.md` | 定义"整体内容保真原则" |

---

## 10. 核心原则

> **规则文件中写"要保留图片"不等于图片已经被提取。**
> 
> 图片保留的证据是：
> 1. `assets/source-media/` 目录下存在对应的实际文件；
> 2. `source_asset_manifest.json` 中有该文件的记录；
> 3. `index.html` 中存在可见的 `<img src="assets/source-media/...">` 节点；
> 4. 该节点的 `src` 路径指向一个真实存在的文件。
>
> 以上四条必须同时满足，缺一不可。
