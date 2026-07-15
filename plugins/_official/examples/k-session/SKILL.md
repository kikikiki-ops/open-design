---
name: k-session
description: "Create refined 12:4 HTML presentation decks in a modern Chinese Dunhuang style, with fixed centered title/subtitle typography, two replaceable background-image roles, supplied corner logos, and concise mixed framed/borderless information cards. Use for Chinese business sessions, culture-themed keynotes, project reviews, event recaps, and requests mentioning K-session, 敦煌风 PPT, 12:4 横幅演示, or 信息卡演示。"
---

# K-session

Create a multi-slide 12:4 PPT deck in HTML with a modern Dunhuang visual language. Use the bundled template; do not substitute a generic 16:9 layout, a single-page web page, or a default card UI. The finished HTML deck is the PPT source that Open Design previews and exports slide-by-slide.

## Build the deck

1. The **Skill root** path provided above is the source of truth. Read its `example.html` first, then its `assets/template.html`. Do not start from a generic deck skeleton.
2. Before writing `index.html`, copy the supplied `assets/` directory from that Skill root into the output folder unchanged. This includes `logo-left.svg`, `logo-right.svg`, `backgrounds/dunhuang-cover.png`, `backgrounds/dunhuang-content.png`, `k-session.css`, and `k-session.js`. Never call an image-generation tool or create replacement SVG/logo/background files when those supplied resources exist.
3. Copy the example deck to `index.html` as the canonical visual scaffold, preserving its CSS class vocabulary and navigation script. Its six pages demonstrate the preferred narrative modules; they are not a fixed output count or immutable DOM.
4. Decide page count from the amount of source material and the complete story: keep one cover and one closing page, then add only as many content pages as distinct decisions, evidence groups, cases, or actions require (minimum: 3). Do not default to six pages and do not split one weak idea into a page merely to reach a count.
5. Treat complete layouts as composition examples, not indivisible templates. A case can be used whole or split into its `case-media-card`, `case-workbench`, and `case-outcomes` groups; an evidence layout can likewise contribute only its `evidence-chart`, `evidence-metrics`, or `strategy-ladder` group. Place split groups in `.module-grid` and use its `module-span-*` utilities to freely combine them with Bento, statements, and framed/borderless cards. Future complete-layout examples follow this same rule: their meaningful groups may be independently reused and recomposed.
6. Preserve each selected group's internal hierarchy (for example, keep `outcome-metric` items inside `case-outcomes`, and `strategy-row` items inside `strategy-ladder`) while freely reordering, adding, removing, resizing, or recombining groups to fit the supplied content. Do not force every group into a box; preserve the K-session visual tokens, whitespace, and mixed framed/borderless treatment.
7. Replace every bracketed placeholder, preserve one `.slide--cover` first and one `.slide--closing` last, and update every `.page-number` to the real total. Set the document title.
8. In the final HTML, keep the direct paths `assets/logo-left.svg`, `assets/logo-right.svg`, `assets/backgrounds/dunhuang-cover.png`, and `assets/backgrounds/dunhuang-content.png`. Do not use text stand-ins such as brand names, data URLs, newly drawn SVGs, or flat-color substitutes.
9. Keep the deck at a 3:1 ratio (12:4). The template already handles presentation, gallery, and print views; do not change the ratio to 16:9.
10. Keep `.slide-inner` as the fixed 1440×480 design canvas and retain its container-width scale transform in both directions. Do not cap it at `scale(1)` or convert the sizing tokens to viewport pixels: the transform keeps all typography, logos, spacing, and cards proportional in compact previews and on wider 3:1 displays.
11. Deliver a navigable `index.html` deck and the copied `assets/` folder. Do not turn all slides into a long scrolling page or merge their content into one `.slide`. For inline artifact delivery, emit the generated HTML inside an `artifact` block and retain the same asset-relative paths.

## Content transformation

Turn source material into a story, not a transcription.

- Assign one decision, conclusion, or question to each content page.
- Treat the user's main composer prompt as the primary content source. `source_content`, when supplied, is optional supplemental material rather than a prerequisite for starting the deck.
- Reduce each source passage to a title, one short subtitle, and at most three information units. Prefer numbers, contrasts, named stages, and concrete outcomes.
- Use `.info-card--framed` only for a primary metric, a compact comparison, or a discrete action. Use `.info-card--plain` for explanations, evidence, and supporting points. Never put every information unit inside a box.
- Use `.case-outcome-layout` for a complete case study and `.evidence-strategy-layout` for a complete evidence-to-strategy story. Both are also module libraries: use `.module-grid` to recombine their major groups when a whole layout would be too rigid. Keep each module purposeful rather than recreating a dense dashboard.
- Keep body copy to two short lines per card when possible. Split crowded pages instead of reducing the fixed type scale.
- Centre the title, subtitle, and content group. The two logos remain the only items anchored to corners.

## Non-negotiable visual rules

- Keep the supplied `assets/logo-left.svg` at the upper left at `24px` high and `assets/logo-right.svg` at the upper right at `22px` high on every page. Keep their widths automatic and unconstrained. Do not replace them unless the user supplies a replacement.
- Use `assets/backgrounds/dunhuang-cover.png` on the first and final pages and `assets/backgrounds/dunhuang-content.png` on all content pages by default.
- Keep `--title-size: 40px`, `--title-line-height`, `--subtitle-size: 16px`, and `--subtitle-line-height` uniform across the full deck. Keep every page title and subtitle to one line; rewrite overlong copy instead of reducing the type scale.
- Adjust page edges only through `--page-padding-top`, `--page-padding-right`, `--page-padding-bottom`, and `--page-padding-left` in `assets/k-session.css` or an intentional `:root` override. Do not introduce arbitrary per-page padding.
- Let `.page-heading` occupy at most 80% of the page width. Omit `.page-kicker` from all content pages. Keep the content heading naturally at the top of content pages; use `padding-top: 32px` and `padding-bottom: 8px` on their `.slide-main`; keep `.content-block` at 90% page width or less and let its full height centre cards both horizontally and vertically underneath it.
- Use the bundled `bento-grid` when one key metric needs emphasis alongside two to three supporting facts. Keep at least one Bento item borderless.
- Keep `case-outcome-layout` and `evidence-strategy-layout` to one message per region; do not compress the labels or add more metrics to imitate a dense dashboard.
- Keep the palette bright and restrained: pearl, pale gold, blush, and a trace of mineral red. Use only abstract, broadly symmetrical silk-light ribbons in the backgrounds; avoid all literal objects, religious iconography, emoji, glass effects, and decorative clutter.

## Replace the backgrounds

Set new global paths without changing any page markup:

```html
<style>
:root {
  --cover-background: url("assets/backgrounds/my-cover.png");
  --content-background: url("assets/backgrounds/my-content.png");
}
</style>
```

Place replacement files in `assets/backgrounds/`. CSS background URLs support SVG and raster PNG (as well as JPG/WebP); the shipped defaults are PNG. Use a per-page `style="--slide-background: url('assets/backgrounds/example.png')"` only when one page needs a deliberate exception. Preserve sufficient contrast for the fixed title and subtitle color.

## Verify before delivery

- Check that the browser view is letterboxed rather than stretched and each page remains 3:1.
- Count `.deck > .slide` before delivery, verify that each page earns its place in the story, and use arrow keys or dots to reach the closing page.
- Navigate with arrow keys, Page Up/Down, Space, Home/End, dots, mouse wheel, and horizontal touch swipes.
- Check that every page has the two logos, cover/closing pages use the cover background, and content pages use the content background.
- Check a content-dense page at presentation size. If it feels card-heavy, convert supporting cards to `.info-card--plain` or split the page.
- Print preview at 12in × 4in and ensure all slides are visible.
