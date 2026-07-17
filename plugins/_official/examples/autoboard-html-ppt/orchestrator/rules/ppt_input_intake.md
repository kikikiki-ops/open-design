# PPTX Input Intake for Optimization

## 1. Trigger and scope

This rule applies whenever the user says “optimize PPT”, “beautify this deck”,
“rebuild this PPT”, or provides a `.pptx` in the current project or conversation.
In this mode, AutoBoard is an optimization pipeline, not a blank-deck generator.

Before any page routing or template selection, locate the supplied `.pptx` and
record it as the source deck. If no PPTX or source material is available, do not
invent an optimization target; ask for the source file or use the user's pasted
content only when they explicitly request a new deck.

## 2. Required intake sequence

```text
Locate uploaded/current-project PPTX
-> [EXECUTE CODE] extract embedded images from PPTX to assets/source-media/
   Run: python3 -c "from pptx import Presentation; ..." (see rules/pptx_image_extraction.md §2)
   Or fallback: unzip source.pptx "ppt/media/*" -d /tmp/pptx_extracted && cp /tmp/pptx_extracted/ppt/media/* assets/source-media/
   Verify: ls assets/source-media/ must show actual files
-> scan visual assets (ALL image types, build source_asset_manifest)
-> enumerate slides and embedded media
-> classify every slide
-> extract or visually parse formal content
-> build source_asset_manifest (visual asset ledger) — reference extracted files in assets/source-media/
-> build content inventory (text ledger)
-> verify both ledgers are complete
-> route page types and AutoBoard templates
-> render a new editable HTML deck using RELATIVE paths for all images
```

> 来源图片扫描必须在文字内容账本建立之前完成。
> **图片提取必须是真实的代码执行**（bash 或 Python），不是规划文档声明。
> 详细的图片发现、提取与脚本规则见 `rules/pptx_image_extraction.md`。
> 图片保留协议与账本结构见 `rules/source_media_extraction.md`。

Each source slide must be classified as exactly one of:

- `editable_slide`: text, charts, tables, and shapes can be extracted as editable structure.
- `image_based_slide`: a full-slide image, screenshot, or flattened visual is the primary source.
- `mixed_slide`: editable text and shape content coexist with visual evidence.
- `unknown_slide`: the source is unreadable or cannot be classified safely.

## 3. Extraction and fidelity rules

### Editable slides

- Extract titles, body text, labels, numbers, units, chart labels, table headers,
  source notes, grouping, reading order, and explicit relationships.
- Preserve the source facts in `content_inventory`; the source layout is evidence,
  not a template to stretch into 11:3.

### Image-based slides

- Render or inspect the source slide before routing.
- Perform OCR and visual-region parsing for title, body, numbers, charts, logos,
  screenshots, and relationship lines.
- Set `contentInventoryStatus` to `review_required` if a critical value, label,
  or relationship is uncertain. Do not turn an unparsed slide screenshot into the
  final HTML page.

### Mixed slides

- Extract editable content first, then use the visual layer to recover screenshots,
  chart structure, grouping, and spatial relationships.
- Preserve supplied screenshots or media as evidence assets; do not redraw or
  invent product UI.

### Unknown slides

- Mark the source slide as `blocked` with the reason.
- Do not silently omit it, replace it with a generic Hero page, or create facts
  that are not visible in the source.

## 4. Minimum intake result

Write `intake_result.json` before rendering. It must include one record per
source slide:

```json
{
  "sourceDeck": "source.pptx",
  "slides": [
    {
      "sourcePageRef": 1,
      "sourceType": "editable_slide",
      "contentInventoryStatus": "ready",
      "nextAction": "route_page_type",
      "confidence": 0.94
    }
  ]
}
```

Allowed `contentInventoryStatus` values are `ready`, `review_required`, and
`blocked`. Only `ready` slides can proceed to final HTML rendering without an
explicit user decision. A `review_required` slide may retain an evidence image
and clearly marked uncertainty, but may not invent unreadable formal content.

## 5. AutoBoard mapping

After intake, use the existing pipeline without changing source facts:

```text
content inventory
-> page role
-> page type
-> templateId
-> 3696 x 1008 ultrawide variant
-> editable HTML output
```

The current source PPTX is a content source, not a design-system override. Its
theme, page ratio, or screenshot dimensions never authorize stretching an old
layout into the 11:3 delivery canvas. Use the template library's ultrawide
adaptation rules instead.

### 5.1 Hidden slide classification

Each source slide must be checked for `is_hidden` status during intake:

```python
# python-pptx: check hidden status
slide_layout = slide.slide_layout
is_hidden = getattr(slide, '_element', None) and \
            slide._element.get('show') == '0'
```

| is_hidden | Default classification | Inclusion in page_plan |
|-----------|----------------------|------------------------|
| False | Normal intake → route to pageType | Yes |
| True | `hidden_slide` | No, unless user explicitly requests hidden content |

Hidden slides must be recorded in `intake_result.json` with `"slideStatus": "hidden_excluded"`.
They must NOT silently disappear — they must be documented.

### 5.2 Canvas profile declaration

`page_plan.json` must declare the canvas profile in the top-level metadata before the slides array:

```json
{
  "canvasProfile": "3696x1008",
  "deliveryMode": "ultrawide_html_ppt",
  "sourceFile": "uploaded.pptx",
  "hiddenSlidesExcluded": 2,
  "slides": [...]
}
```

Prohibition: do not mix slides from different canvas profiles (e.g., 16:9 source and 11:3 delivery) into the same `slides` array without an explicit `sourceCanvasRatio` annotation.

## 6. Optimization delivery

The optimized deck must be a new editable HTML artifact in the active project:

- `index.html`: all independently navigable `3696 x 1008` slides.
- `index.html.artifact.json`: Open Design HTML artifact metadata.
- `intake_result.json`: per-slide source diagnosis.
- `content_inventory.json`: traceable source facts and relationships.
- `source_asset_manifest.json`: per-asset inventory (asset_id, preservation, output_path, render_status).
- `page_plan.json`: roles, page types, templates, alignment contracts, source mapping, and source_asset_ids.
- `quality_report.json`: fidelity, overflow, 11:3, geometry checks, and source-media coverage checks.

Do not overwrite the source `.pptx`. The source file remains intact; `index.html`
is the optimized, previewable result.
