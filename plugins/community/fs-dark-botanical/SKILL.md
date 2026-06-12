---
name: fs-dark-botanical
description: "Create elegant, premium near-black HTML decks in the Dark Botanical style: centered serif composition, blurred warm pink/gold/terracotta glow orbs, thin vertical accent lines, italic signature typography. Fixed 1920×1080 stage scaled to any viewport, zero dependencies."
triggers:
  - "dark botanical"
  - "elegant dark slides"
  - "premium dark deck"
  - "botanical slides"
  - "luxury presentation"
od:
  mode: deck
  surface: web
  category: slides
  upstream: "https://github.com/zarazhangrui/frontend-slides"
  preview:
    type: html
    entry: example.html
  example_prompt: "Use Dark Botanical to turn my content into an elegant single-file HTML deck: near-black ground, centered Cormorant serif typography, blurred warm pink/gold/terracotta glow orbs in the corners, thin vertical accent lines, italic signature lines, fixed 1920×1080 stage with uniform scaling. Start from example.html and replace only the content — keep the design system."
  example_prompt_i18n:
    zh-CN: "用暗夜植物园风格把我的内容做成一套高级感单文件 HTML 幻灯片：近黑底居中排版、Cormorant 衬线字、暖粉/金/赤陶模糊渐变圆光晕、细竖向 accent 线、斜体签名字，固定 1920×1080 舞台等比缩放。从 example.html 出发只替换内容，保留设计系统。"
---

# Dark Botanical (暗夜植物园)

Elegant, sophisticated, artistic, premium. Centered composition on near-black, soft blurred glow orbs in warm low-saturation colors, thin vertical accent lines, italic serif signatures. Abstract CSS shapes only — **no illustrations, no photos**. Derived from the MIT-licensed [zarazhangrui/frontend-slides](https://github.com/zarazhangrui/frontend-slides) `STYLE_PRESETS.md` preset 4 "Dark Botanical".

**Start from `example.html` in this plugin folder. It is the proven seed: keep its stage CSS (the full viewport-base.css block), the slide shell chrome, the `:root` tokens, and the entire `SlidePresentation` controller script verbatim — replace only the slide content. Do not rewrite the design, do not introduce colors or fonts outside this spec.**

## Design tokens (locked — copy verbatim)

```css
:root {
    --stage-bg: #0a0a0a;
    --bg-primary: #0f0f0f;
    --text-primary: #e8e4df;
    --text-secondary: #9a9590;
    --text-faint: rgba(232, 228, 223, 0.34);
    --accent-warm: #d4a574;   /* terracotta gold — primary accent */
    --accent-pink: #e8b4b8;   /* dusty rose — italic emphasis */
    --accent-gold: #c9b896;   /* pale gold — signature lines */
    --line: rgba(232, 228, 223, 0.14);
    --line-warm: rgba(212, 165, 116, 0.45);

    --font-display: 'Cormorant', serif;
    --font-body: 'IBM Plex Sans', sans-serif;
    --title-size: 150px;
    --h2-size: 88px;
    --subtitle-size: 30px;
    --body-size: 26px;

    --slide-pad: 110px;

    --ease-botanic: cubic-bezier(0.22, 1, 0.36, 1);
    --duration-normal: 0.9s;
}
```

No other colors are permitted. No purple, no blue, no saturated hues. Forbidden: `#6366f1` indigo, purple gradients, neon anything.

## Typography (locked)

- **Display:** `Cormorant` 400/500/600 with true italics (Google Fonts). Titles at weight 500, generous line-height ~1.0–1.05. Italic + `--accent-pink` for the emphasized word inside titles (`<em>` inside `.display`/`.h2`).
- **Body:** `IBM Plex Sans` 300/400. Default body weight is **300** (light); 400 only for small caps labels.
- **Kicker:** 19px IBM Plex Sans, `letter-spacing: 0.42em`, uppercase, `--accent-warm`.
- **Signature line (`.signature`):** Cormorant italic 400, 32px, `--accent-gold` — one per cover/divider/closing slide. This italic signature is a hallmark of the style.
- Never use Inter, Roboto, Arial, or system fonts.

## Signature decorative devices (must appear)

1. **Glow orbs (`.orb`)** — absolutely-positioned circles, `border-radius: 50%`, `filter: blur(90px)`, radial-gradient fills of the three accents at 0.40–0.55 alpha fading to transparent. 380–700px diameter, anchored off-canvas in slide corners (negative offsets), 1–3 per slide, overlapping warm+pink for depth. Pure CSS — never images.
2. **Thin vertical accent line (`.vline`)** — 1px wide, 80–110px tall, `linear-gradient(to bottom, var(--line-warm), transparent)`. Used above titles, atop pillar columns, and as the center divider of comparison slides.
3. **Italic signature typography** — see `.signature` above.
4. **Outlined serif numeral** — section dividers use a giant (~430px) Cormorant numeral with `color: transparent; -webkit-text-stroke: 1.5px var(--accent-warm)`.
5. **Blurred orb dots** — small (58px) `blur(7px)` radial dots as card bullets in grids.

## Layout system (locked)

- **Centered composition**: `.slide-inner` is a centered flex column with `text-align: center` and `padding: var(--slide-pad)`. Dark Botanical content sits on the vertical axis; only comparison/list internals go `text-align: left`.
- **Shell chrome on every slide**: roman-numeral slide number top-left (Cormorant, `--accent-warm`), small-caps breadcrumb nav top-right (active crumb in `--accent-warm`), 1px baseline rule bottom with two small-caps labels.
- **Master pages** (compose decks from these, as seeded in example.html):
  `cover` (kicker + vline + display title + lede + signature, corner orbs) · `contents` (serif numbered list with italic roman indices and hairline rules) · `section divider` (outlined giant numeral + italic subtitle) · `pillars` (3 columns, each topped by a vline in a different accent) · `big number` (~400px Cormorant numeral in `--accent-warm` over a centered orb) · `chart` (slender 92px rounded gradient columns, scaleY entrance — pure CSS, no chart libraries) · `quote` (70px Cormorant italic, bold accent span) · `comparison` (two columns split by a vertical gradient line; "ours" column accented warm) · `collection grid` (2×2 hairline cards with blurred orb dots) · `closing` (display title + signature + small-caps contact links with inline SVG icons).

## Stage & runtime (locked — the frontend-slides scaling system)

- Author every slide on a fixed **1920×1080** canvas: `.deck-viewport` (fills window) wraps `.deck-stage` (1920×1080, `transform-origin: 0 0`).
- JS scales the whole stage uniformly: `factor = min(innerWidth/1920, innerHeight/1080)` then `translate(x, y) scale(factor)` to center with letterbox/pillarbox; re-run on `resize`. Never reflow content per device; no responsive breakpoints inside slides; all measurements are fixed px at design size.
- Each page is one `<section class="slide">` directly inside `.deck-stage`. Switching toggles `.active`/`.visible` (visibility/opacity/pointer-events) — **never `display: none`**.
- Navigation (keep the seed script verbatim): `←`/`→`/`↑`/`↓`/Space/PageUp/PageDown/Home/End keyboard, debounced wheel (~650ms), touch swipe (≥40px), `#/<index>` hash routing with deep-link restore. Page counter chrome lives in `.deck-controls`, fixed outside the scaled stage.
- Include the full viewport-base.css block (already embedded in the seed), including print styles and `prefers-reduced-motion`.

## Motion (locked)

- Entrances: `.reveal` children translate up 30px + fade when the slide gains `.visible`, staggered via `transition-delay` steps of ~0.12s.
- One signature easing: `cubic-bezier(0.22, 1, 0.36, 1)`. Animate only `transform` and `opacity`. Chart columns animate `scaleY(0) → 1` from the bottom.
- Motion is languid and soft (0.9s) — never bouncy, never snappy.

## Content rules

- Default 8–11 slides for a standard deck; honor the requested slide count when the user picks one; split content rather than shrinking type. No scrolling, no overflow at 1920×1080.
- Low-density speaker-led by default: one idea per slide, max 3 pillars / 4 cards / 4 chart columns.
- Icons are inline SVG, 1.6px stroke, `--accent-warm`. No external images, no CDN scripts, no chart libraries — single self-contained HTML file.
- Comment every section: `/* === SECTION NAME === */`. CSS gotcha: never negate CSS functions directly — use `calc(-1 * ...)`.

## Attribution

Style preset, fixed-stage model, and workflow come from the upstream MIT-licensed [zarazhangrui/frontend-slides](https://github.com/zarazhangrui/frontend-slides) (© 2025 Zara Zhang), STYLE_PRESETS.md section 4 "Dark Botanical". The LICENSE file ships in this plugin folder; keep it in place when redistributing.
