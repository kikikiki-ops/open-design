---
name: oryzo-homepage
title: Oryzo Homepage
description: A pixel-faithful, self-contained mirror of the award-winning oryzo.ai homepage by Lusion — a real-time 3D Gaussian-splat product scene with scroll-driven camera choreography, MSDF kinetic type, Rive animation, and product-gallery video. First-party showcase of interactive WebGL marketing craft.
license: MIT
---

# Oryzo Homepage

A first-party **showcase** template that mirrors the live [oryzo.ai](https://oryzo.ai) homepage — an award-winning interactive site by [Lusion](https://lusion.co) — captured to render in the sandboxed preview.

It demonstrates the **top end** of interactive, WebGL-grade product storytelling on the web: a real-time 3D Gaussian-splat scene driven by scroll. Treat it as a reference build to study and adapt, not a fill-in-the-blank generator.

## What it is

- **Real-time 3D Gaussian-splat hero** — a photoreal cork-coaster-on-a-cutting-mat scene rendered from a `.sog` splat, with a scroll-driven camera choreography that moves through the desk as you read.
- **Kinetic MSDF type** — GPU text (the coaster message) rendered with signed-distance-field geometry.
- **Rive animation + product gallery** — vector animation via the Rive runtime, short product-loop videos, and a testimonial section.
- **Craft details** — Halyard variable fonts (Adobe Typekit, bundled locally), a custom loader/intro sequence, and a bespoke scroll manager.

## How it is built (for reference)

- **Stack**: an Astro build with a hand-rolled WebGL/Three.js engine (Gaussian-splat renderer + MSDF text + a Web Worker splat sorter), the Rive canvas runtime, and a custom scroll/route manager.
- **Splat data** is a `.sog` archive (Gaussians packed as WebP), depth-sorted every frame by a WASM sorter in a Web Worker — no `SharedArrayBuffer`, so it needs no cross-origin-isolation headers.
- **Product-loop videos** are re-encoded to stay under the 1 MB repository blob limit with no visible loss.
- **Path-portable**: absolute asset paths are resolved against the entry file's directory (a base injected at load), the SPA route is pinned to home, and the splat-sorter worker loads its WASM relative to itself — so the bundle renders correctly from a nested preview subpath, not just the site root.

## External resources

Most of the site is bundled locally under `assets/`. Three things load over the network:

- **Large media on the repository-assets CDN** (`repo-assets.open-design.ai`): the 3D splat (`props.sog`, ~3 MB), the main Three.js bundle (`hoisted.js`, ~1.1 MB), and the Rive WASM runtime (~1.8 MB) — each exceeds the 1 MB in-repo blob limit, so they are served from the CDN and fetched with CORS.
- **A Vimeo-hosted testimonial video** (`player.vimeo.com`) embedded in one section — a hosted video that can't be bundled.
- **Two footer legal links** (Terms, Privacy) point to the originals on `oryzo.ai` — those documents belong to Oryzo/Lusion, so they are linked rather than copied into the repo.

## Using it

Open `example.html` in the preview to explore the live, interactive result. To adapt the aesthetic (splat scene, scroll choreography, kinetic type) into your own build, study the structure here and recreate it with your preferred WebGL / Gaussian-splat toolchain. Original design and site by Lusion (oryzo.ai).
