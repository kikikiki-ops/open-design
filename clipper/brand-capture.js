// Open Design web clipper brand/design-system capture runtime.
//
// Injected on demand by the service worker. It does not clone the page. Instead
// it programmatically reads brand signals from the live DOM/CSSOM and fills a
// stable, reviewable design-system HTML template.

(function () {
  if (window.__odBrandCapture) return;

  const MAX_ELEMENTS = 1400;
  const MAX_IMAGES = 15;
  const MAX_LOGOS = 8;
  const MAX_RESOURCES = 120;
  const I18N = globalThis.OD_CLIPPER_I18N;
  let activeLocale = I18N?.currentLocale ? I18N.currentLocale() : 'en';

  // Built-in English copy for every label this capture renders. The extension's
  // shared i18n bundle (i18n.js) is preferred when present — it carries the
  // translations — but injection/order glitches have shipped captures with the
  // bundle missing, which used to bake raw keys ("brandPalette") straight into
  // the saved HTML. This map guarantees real words no matter what; `tr` only
  // falls back to the raw key when a string is genuinely unknown.
  const EN_FALLBACK = {
    brandFallbackTitle: 'Captured site',
    brandFallbackDescription: 'Programmatically extracted from the live web page.',
    brandPageTitleSuffix: 'Design System',
    brandFileTitle: '{title}',
    brandReady: 'Captured',
    brandLogo: 'Logo',
    brandNoLogoFound: 'No logo detected',
    brandTypography: 'Typography',
    brandPalette: 'Palette',
    brandVoiceTone: 'Voice & tone',
    brandImageryLayout: 'Imagery & layout',
    brandImages: 'Images',
    brandComponentKit: 'Component kit',
    brandComponentKitSub: 'A working UI kit colored entirely from the captured palette, type and corner radius.',
    brandSubjectsLabel: 'Subjects',
    brandRadiusLabel: 'Corner radius',
    brandLayoutPosture: 'Layout posture',
    brandImageryStyle: '{count} representative images captured from this page.',
    brandImageryStyleNone: 'No representative imagery was captured from this page.',
    brandViewAll: 'View all ({count})',
    brandAllImages: 'All images · {count}',
    brandClose: 'Close',
    brandPrevImage: 'Previous image',
    brandNextImage: 'Next image',
    brandImageLabel: 'Image {index}',
    brandKeywordFallback: 'captured',
    brandDataNote: 'A structured JSON payload is embedded at <code>#od-design-system-data</code> for downstream automation.',
    swatchBackground: 'Background',
    swatchSurface: 'Surface',
    swatchForeground: 'Foreground',
    swatchMuted: 'Muted',
    swatchBorder: 'Border',
    swatchAccent: 'Accent',
    swatchSupport: 'Secondary',
    swatchHighlight: 'Highlight',
    swatchColor: 'Color {index}',
    swatchUseBackground: 'Page background',
    swatchUseSurface: 'Cards and raised panels',
    swatchUseForeground: 'Primary text and icons',
    swatchUseMuted: 'Secondary text and captions',
    swatchUseBorder: 'Dividers and outlines',
    swatchUseAccent: 'Primary actions and emphasis',
    swatchUseSupport: 'Secondary highlights',
    swatchUseHighlight: 'Accents and details',
    layoutSquare: 'Square, sharp corners',
    layoutRounded: 'Rounded corners (~{px}px radius)',
    layoutShadow: 'Soft shadows add depth',
    layoutFlat: 'Flat surfaces, minimal shadow',
    layoutBordered: 'Hairline borders frame content',
    kitButtons: 'Buttons',
    kitPrimary: 'Primary',
    kitSecondary: 'Secondary',
    kitGhost: 'Ghost',
    kitDisabled: 'Disabled',
    kitForms: 'Form controls',
    kitFieldLabel: 'Email address',
    kitFieldPlaceholder: 'you@example.com',
    kitSelectLabel: 'Plan',
    kitTextareaPlaceholder: 'Write a message…',
    kitCheckbox: 'Email me updates',
    kitRadioA: 'Monthly',
    kitRadioB: 'Annual',
    kitSwitch: 'Enabled',
    kitBadges: 'Badges & navigation',
    kitBadgeNew: 'New',
    kitBadgeBeta: 'Beta',
    kitBadgePro: 'Pro',
    kitCardTitle: 'Card title',
    kitCardBody: 'Cards, fields and chips inherit the captured radius, border and color.',
    kitAlert: 'Heads up — this kit is generated from one captured design seed.',
    kitTabs: 'Table',
    kitTabOverview: 'Overview',
    kitTabActivity: 'Activity',
    kitTabSettings: 'Settings',
    kitTableHead1: 'Name',
    kitTableHead2: 'Role',
    kitTableHead3: 'Status',
    kitTableStatus: 'Active',
  };

  function interpolateLocal(raw, vars) {
    if (!vars) return raw;
    return String(raw).replace(/\{(\w+)\}/g, (_, name) => (vars[name] == null ? `{${name}}` : String(vars[name])));
  }

  function setActiveLocale(locale) {
    const api = globalThis.OD_CLIPPER_I18N || I18N;
    activeLocale = api?.normalizeLocale ? (api.normalizeLocale(locale) || activeLocale) : (locale || activeLocale);
  }

  function tr(key, vars) {
    const api = globalThis.OD_CLIPPER_I18N || I18N;
    if (api?.t) {
      const value = api.t(key, vars, activeLocale);
      // The shared bundle returns the key unchanged when it has no entry; treat
      // that as a miss and fall through to the built-in English copy.
      if (value != null && value !== key) return value;
    }
    return interpolateLocal(EN_FALLBACK[key] || key, vars);
  }

  function text(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeScriptJson(json) {
    return json.replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
  }

  function safeCss(value) {
    return String(value || '').replace(/<\/style/gi, '<\\/style');
  }

  function absUrl(url, base) {
    if (!url) return '';
    try {
      return new URL(url, base || document.baseURI).href;
    } catch {
      return '';
    }
  }

  function isHttp(url) {
    return /^https?:\/\//i.test(url || '');
  }

  function hostOf(url) {
    try {
      return new URL(url).host;
    } catch {
      return '';
    }
  }

  function meta(name) {
    const selectors = [
      `meta[name="${name}"]`,
      `meta[property="${name}"]`,
      `meta[name="og:${name}"]`,
      `meta[property="og:${name}"]`,
      `meta[name="twitter:${name}"]`,
      `meta[property="twitter:${name}"]`,
    ];
    for (const selector of selectors) {
      const value = document.querySelector(selector)?.getAttribute('content');
      if (text(value)) return text(value);
    }
    return '';
  }

  function parseRgb(value) {
    if (!value || value === 'transparent' || value === 'currentColor') return null;
    const rgba = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.]+))?\s*\)/i.exec(value);
    if (rgba) {
      const a = rgba[4] === undefined ? 1 : Number(rgba[4]);
      if (!Number.isFinite(a) || a <= 0.04) return null;
      return {
        r: Math.max(0, Math.min(255, Math.round(Number(rgba[1])))),
        g: Math.max(0, Math.min(255, Math.round(Number(rgba[2])))),
        b: Math.max(0, Math.min(255, Math.round(Number(rgba[3])))),
        a,
      };
    }
    const hex = /#([0-9a-f]{3,8})\b/i.exec(value);
    if (!hex) return null;
    let raw = hex[1];
    if (raw.length === 3 || raw.length === 4) raw = raw.split('').map((c) => c + c).join('');
    const r = parseInt(raw.slice(0, 2), 16);
    const g = parseInt(raw.slice(2, 4), 16);
    const b = parseInt(raw.slice(4, 6), 16);
    const a = raw.length >= 8 ? parseInt(raw.slice(6, 8), 16) / 255 : 1;
    if (![r, g, b, a].every(Number.isFinite) || a <= 0.04) return null;
    return { r, g, b, a };
  }

  function hexOf(c) {
    const part = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
    return `#${part(c.r)}${part(c.g)}${part(c.b)}`.toUpperCase();
  }

  function luminance(c) {
    const lin = (n) => {
      const v = n / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  }

  function saturation(c) {
    const max = Math.max(c.r, c.g, c.b);
    const min = Math.min(c.r, c.g, c.b);
    return max === 0 ? 0 : (max - min) / max;
  }

  function contrastText(hex) {
    const c = parseRgb(hex);
    return c && luminance(c) < 0.48 ? '#FFFFFF' : '#111111';
  }

  function distinctColors(items, limit) {
    const out = [];
    for (const item of items) {
      const c = parseRgb(item.hex);
      if (!c) continue;
      const tooClose = out.some((existing) => {
        const e = parseRgb(existing.hex);
        if (!e) return false;
        return Math.abs(c.r - e.r) + Math.abs(c.g - e.g) + Math.abs(c.b - e.b) < 44;
      });
      if (!tooClose) out.push(item);
      if (out.length >= limit) break;
    }
    return out;
  }

  function visibleElements() {
    const out = [];
    const all = document.body ? document.body.getElementsByTagName('*') : [];
    for (let i = 0; i < all.length && out.length < MAX_ELEMENTS; i += 1) {
      const el = all[i];
      if (!el || el.id?.startsWith('od-clipper-')) continue;
      let s;
      let r;
      try {
        s = getComputedStyle(el);
        if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) continue;
        r = el.getBoundingClientRect();
      } catch {
        continue;
      }
      if (r.width <= 0 || r.height <= 0) continue;
      out.push({ el, style: s, rect: r });
    }
    return out;
  }

  function collectPalette(elements) {
    const scores = new Map();
    const add = (raw, score, role) => {
      const c = parseRgb(raw);
      if (!c) return;
      const hex = hexOf(c);
      const prev = scores.get(hex) || { hex, score: 0, roles: new Set(), c };
      prev.score += score;
      if (role) prev.roles.add(role);
      scores.set(hex, prev);
    };

    add(meta('theme-color'), 60, 'theme');
    add(getComputedStyle(document.documentElement).backgroundColor, 25, 'background');
    add(getComputedStyle(document.body || document.documentElement).backgroundColor, 40, 'background');
    add(getComputedStyle(document.body || document.documentElement).color, 40, 'foreground');

    const root = getComputedStyle(document.documentElement);
    for (let i = 0; i < root.length; i += 1) {
      const prop = root[i];
      if (!prop || !prop.startsWith('--')) continue;
      const lower = prop.toLowerCase();
      if (!/(color|bg|background|accent|brand|border|surface|foreground|text)/.test(lower)) continue;
      add(root.getPropertyValue(prop), 16, prop);
    }

    for (const item of elements) {
      const area = Math.min(40, Math.max(1, (item.rect.width * item.rect.height) / 6000));
      const tag = item.el.tagName.toLowerCase();
      const isControl = /^(a|button|input|select|textarea)$/.test(tag) || item.el.getAttribute('role') === 'button';
      add(item.style.backgroundColor, area + (isControl ? 24 : 0), isControl ? 'component-bg' : 'background');
      add(item.style.color, Math.min(18, text(item.el.textContent).length / 12) + (isControl ? 18 : 2), 'text');
      add(item.style.borderTopColor, isControl ? 10 : 3, 'border');
      add(item.style.outlineColor, 2, 'outline');
      add(item.style.fill, 4, 'svg-fill');
      add(item.style.stroke, 4, 'svg-stroke');
    }

    const ranked = [...scores.values()]
      .filter((item) => item.hex !== '#000000' || item.score > 8)
      .sort((a, b) => b.score - a.score);
    return distinctColors(ranked, 12).map((item) => ({
      hex: item.hex,
      score: Math.round(item.score),
      roles: [...item.roles].slice(0, 4),
      luminance: Number(luminance(item.c).toFixed(3)),
      saturation: Number(saturation(item.c).toFixed(3)),
    }));
  }

  function clamp255(n) {
    return Math.max(0, Math.min(255, Math.round(n)));
  }

  // Linear interpolation between two hex colors (t in 0..1, toward b).
  function mixHex(a, b, t) {
    const ca = parseRgb(a) || { r: 255, g: 255, b: 255 };
    const cb = parseRgb(b) || { r: 0, g: 0, b: 0 };
    return hexOf({
      r: clamp255(ca.r + (cb.r - ca.r) * t),
      g: clamp255(ca.g + (cb.g - ca.g) * t),
      b: clamp255(ca.b + (cb.b - ca.b) * t),
    });
  }

  function pxValue(value) {
    const match = /(-?[\d.]+)px/.exec(String(value || ''));
    return match ? parseFloat(match[1]) : null;
  }

  function firstDefined() {
    for (let i = 0; i < arguments.length; i += 1) {
      if (arguments[i] != null) return arguments[i];
    }
    return null;
  }

  const ROLE_NAME_KEYS = {
    background: 'swatchBackground',
    surface: 'swatchSurface',
    foreground: 'swatchForeground',
    muted: 'swatchMuted',
    border: 'swatchBorder',
    accent: 'swatchAccent',
    'accent-secondary': 'swatchSupport',
    highlight: 'swatchHighlight',
  };
  const ROLE_USAGE_KEYS = {
    background: 'swatchUseBackground',
    surface: 'swatchUseSurface',
    foreground: 'swatchUseForeground',
    muted: 'swatchUseMuted',
    border: 'swatchUseBorder',
    accent: 'swatchUseAccent',
    'accent-secondary': 'swatchUseSupport',
    highlight: 'swatchUseHighlight',
  };

  function roleColor(role, hex) {
    return {
      role,
      hex,
      name: tr(ROLE_NAME_KEYS[role] || 'swatchHighlight'),
      usage: tr(ROLE_USAGE_KEYS[role] || 'swatchUseHighlight'),
    };
  }

  // Map the observed palette onto stable semantic roles. Crucially, only these
  // swatches and the single accent ever surface the real brand colors — the page
  // chrome stays on a fixed neutral paper/surface set. That is the fix for the
  // old behavior where a saturated brand background (picked as `surface`) tinted
  // every card on the page.
  function deriveBrandColors(palette) {
    const parsed = palette.map((p) => ({ ...p, c: parseRgb(p.hex) })).filter((p) => p.c);
    if (!parsed.length) {
      return [roleColor('background', '#FFFFFF'), roleColor('foreground', '#1A1A18'), roleColor('accent', '#C96442')];
    }
    const lumOf = (p) => luminance(p.c);
    const satOf = (p) => saturation(p.c);
    const byLight = [...parsed].sort((a, b) => lumOf(b) - lumOf(a));
    const byScore = (list) => [...list].sort((a, b) => b.score - a.score);
    const neutrals = byScore(parsed.filter((p) => satOf(p) < 0.16));
    const colored = parsed
      .filter((p) => satOf(p) > 0.2 && lumOf(p) > 0.05 && lumOf(p) < 0.93)
      .sort((a, b) => b.score * (0.4 + satOf(b)) - a.score * (0.4 + satOf(a)));

    const background = byLight[0] && lumOf(byLight[0]) > 0.55 ? byLight[0].hex : '#FFFFFF';
    const darkest = [...byLight].reverse();
    const foreground = (darkest.find((p) => lumOf(p) < 0.4) || darkest[0]).hex;
    const surface =
      firstDefined((neutrals.find((p) => p.hex !== background && lumOf(p) > 0.84) || {}).hex) ||
      mixHex(background, '#FFFFFF', 0.55);
    const muted =
      firstDefined((neutrals.find((p) => lumOf(p) > 0.22 && lumOf(p) < 0.62) || {}).hex) ||
      mixHex(foreground, background, 0.5);
    const border =
      firstDefined(
        (neutrals.find((p) => lumOf(p) > 0.6 && lumOf(p) < 0.92 && p.hex !== surface && p.hex !== background) || {})
          .hex,
      ) || mixHex(background, foreground, 0.12);
    const accent = (colored[0] && colored[0].hex) || mixHex(foreground, '#C96442', 0.45);
    const accentLum = luminance(parseRgb(accent) || { r: 0, g: 0, b: 0 });
    const accentSecondary = colored.find((p) => p.hex !== accent && Math.abs(lumOf(p) - accentLum) > 0.03);

    const used = new Set([background, surface, foreground, muted, border, accent]);
    const roles = [
      roleColor('background', background),
      roleColor('surface', surface),
      roleColor('foreground', foreground),
      roleColor('muted', muted),
      roleColor('border', border),
      roleColor('accent', accent),
    ];
    if (accentSecondary) {
      roles.push(roleColor('accent-secondary', accentSecondary.hex));
      used.add(accentSecondary.hex);
    }
    // Surface any remaining distinctive brand colors so the palette feels complete.
    for (const p of colored) {
      if (roles.length >= 8) break;
      if (used.has(p.hex)) continue;
      used.add(p.hex);
      roles.push(roleColor('highlight', p.hex));
    }
    return roles;
  }

  // A readable variant of the accent for text/iconography on light surfaces — a
  // pale brand accent (e.g. a yellow) is darkened toward the ink so chips, links
  // and "—" pillar markers never fall below legibility on white.
  function accentInk(accent, foreground) {
    const c = parseRgb(accent);
    if (c && luminance(c) > 0.6) return mixHex(accent, foreground || '#1A1A18', 0.55);
    return accent;
  }

  // Observable layout posture — corner radius, shadow depth and border treatment
  // read straight off the page's real components. Honest, not invented.
  function deriveLayout(components) {
    const card = components.card || {};
    const button = components.button || {};
    const input = components.input || {};
    const radius = firstDefined(pxValue(card.radius), pxValue(button.radius), pxValue(input.radius));
    const hasShadow = [card.shadow, button.shadow].some((s) => s && s !== 'none');
    const rules = [];
    if (radius != null) {
      rules.push(radius <= 2 ? tr('layoutSquare') : tr('layoutRounded', { px: Math.round(radius) }));
    }
    rules.push(hasShadow ? tr('layoutShadow') : tr('layoutFlat'));
    rules.push(tr('layoutBordered'));
    return { radius: radius != null ? `${Math.round(radius)}px` : '—', postureRules: rules };
  }

  function firstFamily(fontFamily) {
    return text(fontFamily).split(',')[0]?.replace(/["']/g, '').trim() || 'system-ui';
  }

  function fontSpecFor(selector, fallbackEl) {
    const el = document.querySelector(selector) || fallbackEl || document.body || document.documentElement;
    const s = getComputedStyle(el);
    return {
      selector,
      family: firstFamily(s.fontFamily),
      stack: s.fontFamily || 'system-ui',
      weight: s.fontWeight || '400',
      size: s.fontSize || '16px',
      lineHeight: s.lineHeight || 'normal',
      letterSpacing: s.letterSpacing || 'normal',
    };
  }

  function collectFontFaces(resources) {
    const faces = [];
    for (const sheet of Array.from(document.styleSheets)) {
      let rules;
      try {
        rules = sheet.cssRules;
      } catch {
        continue;
      }
      if (!rules) continue;
      for (const rule of Array.from(rules)) {
        if (faces.length >= 8) break;
        if (rule.type !== CSSRule.FONT_FACE_RULE) continue;
        const css = rule.cssText || '';
        css.replace(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi, (_m, ref) => {
          const url = absUrl(ref, sheet.href || document.baseURI);
          if (isHttp(url)) resources.add(url);
          return _m;
        });
        faces.push(css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (m, q, ref) => {
          const url = absUrl(ref, sheet.href || document.baseURI);
          return url ? `url(${q}${url}${q})` : m;
        }));
      }
    }
    return faces;
  }

  function collectTypography() {
    const specs = [
      { role: 'Display', ...fontSpecFor('h1, [class*="hero" i], [class*="title" i]') },
      { role: 'Body', ...fontSpecFor('body, p') },
      { role: 'UI', ...fontSpecFor('button, a, input, select') },
      { role: 'Mono', ...fontSpecFor('code, pre, kbd') },
    ];
    const familyScores = new Map();
    for (const el of Array.from(document.querySelectorAll('body, h1, h2, h3, p, a, button, input, code')).slice(0, 80)) {
      try {
        const s = getComputedStyle(el);
        const family = firstFamily(s.fontFamily);
        familyScores.set(family, (familyScores.get(family) || 0) + 1);
      } catch {
        // ignore
      }
    }
    return {
      specs,
      families: [...familyScores.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([family, count]) => ({ family, count })),
    };
  }

  function addCandidate(out, rawSrc, label, kind, score) {
    const src = absUrl(rawSrc);
    if (!isHttp(src) && !/^data:image\//i.test(src)) return;
    if (out.some((item) => item.src === src)) return;
    out.push({ src, label: text(label), kind, score });
  }

  function collectImageAssets(elements, resources) {
    const candidates = [];
    document.querySelectorAll('link[rel~="icon"], link[rel~="apple-touch-icon"], link[rel~="mask-icon"]').forEach((link) => {
      addCandidate(candidates, link.getAttribute('href'), link.getAttribute('rel') || 'App icon', 'logo', 70);
    });
    addCandidate(candidates, meta('image'), 'Social preview image', 'image', 45);

    for (const img of Array.from(document.images)) {
      const src = img.currentSrc || img.src;
      if (!src) continue;
      const r = img.getBoundingClientRect();
      const area = Math.max(img.naturalWidth || r.width || 0, 1) * Math.max(img.naturalHeight || r.height || 0, 1);
      const hay = `${img.alt || ''} ${img.id || ''} ${img.className || ''} ${img.src || ''}`.toLowerCase();
      const logoish = /(logo|brand|mark|icon|wordmark)/.test(hay) || img.closest('header, nav');
      if (Math.max(img.naturalWidth || r.width || 0, img.naturalHeight || r.height || 0) < 32 && !logoish) continue;
      addCandidate(
        candidates,
        src,
        img.alt || (logoish ? 'Brand mark' : 'Page image'),
        logoish ? 'logo' : 'image',
        (logoish ? 75 : 20) + Math.min(30, area / 30000),
      );
    }

    for (const item of elements.slice(0, 900)) {
      const bg = item.style.backgroundImage;
      if (!bg || bg === 'none' || !bg.includes('url(')) continue;
      const match = /url\(\s*['"]?([^'")]+)['"]?\s*\)/i.exec(bg);
      if (!match) continue;
      const area = item.rect.width * item.rect.height;
      if (Math.max(item.rect.width, item.rect.height) < 64) continue;
      addCandidate(
        candidates,
        match[1],
        item.el.getAttribute('aria-label') || item.el.getAttribute('title') || 'Background image',
        'image',
        18 + Math.min(35, area / 30000),
      );
    }

    const sorted = candidates.sort((a, b) => b.score - a.score);
    const logos = sorted.filter((item) => item.kind === 'logo').slice(0, MAX_LOGOS);
    const images = sorted.filter((item) => item.kind !== 'logo').slice(0, MAX_IMAGES);
    for (const item of [...logos, ...images]) if (isHttp(item.src)) resources.add(item.src);
    return { logos, images };
  }

  function collectContent() {
    const title =
      meta('site_name') ||
      text(document.querySelector('h1')?.textContent) ||
      text(document.title) ||
      hostOf(location.href) ||
      tr('brandFallbackTitle');
    const description =
      meta('description') ||
      text(document.querySelector('main p, article p, [class*="subtitle" i], [class*="description" i]')?.textContent) ||
      tr('brandFallbackDescription');
    const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
      .map((el) => text(el.textContent))
      .filter(Boolean)
      .filter((value, index, arr) => arr.indexOf(value) === index)
      .slice(0, 8);
    const keywords = [
      ...text(meta('keywords')).split(',').map((s) => text(s)).filter(Boolean),
      ...headings.slice(0, 4),
    ].slice(0, 8);
    return {
      title,
      description,
      domain: hostOf(location.href),
      url: location.href,
      documentTitle: text(document.title),
      headings,
      keywords,
    };
  }

  function collectComponents() {
    const s = (selector, fallback) => {
      const el = document.querySelector(selector);
      if (!el) return fallback;
      const cs = getComputedStyle(el);
      return {
        background: cs.backgroundColor,
        color: cs.color,
        border: cs.borderTopColor,
        radius: cs.borderTopLeftRadius,
        shadow: cs.boxShadow,
        font: cs.fontFamily,
      };
    };
    return {
      button: s('button, a[role="button"], input[type="submit"], .btn, [class*="button" i]', {}),
      input: s('input, textarea, select, [contenteditable="true"]', {}),
      card: s('article, section, .card, [class*="card" i], [class*="panel" i]', {}),
      nav: s('nav, header', {}),
    };
  }

  function renderHtml(data, fontFaces) {
    const content = data.content;
    const colors =
      data.brand && data.brand.colors && data.brand.colors.length
        ? data.brand.colors
        : [roleColor('background', '#FFFFFF'), roleColor('foreground', '#1A1A18'), roleColor('accent', '#C96442')];
    const byRole = (role, fallback) => {
      const found = colors.find((c) => c.role === role);
      return found ? found.hex : fallback;
    };
    const background = byRole('background', '#FFFFFF');
    const foreground = byRole('foreground', '#1A1A18');
    const accent = byRole('accent', '#C96442');
    const ink = accentInk(accent, foreground);
    const onAccent = contrastText(accent);

    const specs = (data.typography && data.typography.specs) || [];
    const stackAt = (i, fallback) => (specs[i] && specs[i].stack) || fallback;
    const fontDisplay = stackAt(0, 'ui-serif, Georgia, "Times New Roman", serif');
    const fontBody = stackAt(1, 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif');
    const fontMono = stackAt(3, 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace');

    const logos = data.assets.logos || [];
    const images = data.assets.images || [];
    const logo = logos[0];
    const fontCss = fontFaces.length ? `${fontFaces.join('\n')}\n` : '';
    const initial = escapeHtml((content.title || '?').trim().slice(0, 1).toUpperCase());

    const layout = data.layout || { radius: '—', postureRules: [] };
    const radiusNum = pxValue(layout.radius);
    const uiRadius = radiusNum != null ? `${Math.max(0, Math.min(16, Math.round(radiusNum)))}px` : '10px';

    // --- Header identity mark ---
    const headerMark = logo
      ? `<span class="id-mark" style="background:${escapeHtml(background)}"><img src="${escapeHtml(logo.src)}" alt="" /></span>`
      : `<span class="id-mark initial">${initial}</span>`;

    // --- Hero band (first representative image) ---
    const heroHtml = images.length
      ? `<div class="hero"><img src="${escapeHtml(images[0].src)}" alt="${escapeHtml(content.title)}" loading="lazy" /></div>`
      : '';

    // --- Logo ---
    const logoThumbs =
      logos.length > 1
        ? `<div class="logo-thumbs">${logos
            .map(
              (item, i) =>
                `<button type="button" class="logo-thumb${i === 0 ? ' active' : ''}" data-src="${escapeHtml(item.src)}" aria-label="${escapeHtml(item.label || 'logo')}"><img src="${escapeHtml(item.src)}" alt="" /></button>`,
            )
            .join('')}</div>`
        : '';
    const logoBlock = logo
      ? `<div class="logo-stage" style="background:${escapeHtml(background)}"><img id="od-logo-img" src="${escapeHtml(logo.src)}" alt="${escapeHtml(logo.label || content.title)}" /></div>${logoThumbs}`
      : `<div class="logo-stage empty"><span class="logo-initial">${initial}</span><span class="logo-empty-note">${escapeHtml(tr('brandNoLogoFound'))}</span></div>`;

    // --- Typography ---
    const fontTiles = [
      ['Display', 0],
      ['Body', 1],
      ['Mono', 3],
    ]
      .map(([label, i]) => ({ label, spec: specs[i] }))
      .filter((t) => t.spec && t.spec.family)
      .map(
        (t) =>
          `<div class="font-tile"><div class="ag" style="font-family:${escapeHtml(t.spec.stack)}">Ag</div><div class="ft-meta"><div class="ft-name">${escapeHtml(t.spec.family)}</div><div class="ft-role">${escapeHtml(t.label)}</div></div></div>`,
      )
      .join('');
    const fontTilesHtml = fontTiles ? `<div class="fonts">${fontTiles}</div>` : '';
    const typeRows = [
      { label: 'Display', i: 0, sample: content.title || 'Aa Bb Cc', size: '32px', weight: 600 },
      { label: 'Body', i: 1, sample: content.description || 'The quick brown fox jumps over the lazy dog.', size: '16px', weight: 400 },
      { label: 'Mono', i: 3, sample: 'const system = capture(url)', size: '13px', weight: 400 },
    ]
      .filter((r) => specs[r.i] && specs[r.i].family)
      .map((r) => {
        const spec = specs[r.i];
        const w = spec.weight ? ` · ${escapeHtml(String(spec.weight))}` : '';
        return `<div class="type-row"><div class="type-meta"><span class="type-label">${escapeHtml(r.label)}</span><span class="type-font">${escapeHtml(spec.family)}${w}</span></div><p class="type-sample" style="font-family:${escapeHtml(spec.stack)};font-size:${r.size};font-weight:${r.weight}">${escapeHtml(r.sample)}</p></div>`;
      })
      .join('');

    // --- Palette ---
    const paletteHtml = colors
      .map(
        (c) =>
          `<div class="swatch"><div class="swatch-chip" style="background:${escapeHtml(c.hex)};color:${contrastText(c.hex)}"><span class="hex">${escapeHtml(c.hex)}</span></div><div class="swatch-body"><div class="swatch-name">${escapeHtml(c.name || c.role)}</div><div class="swatch-role">${escapeHtml(c.role || '')}</div>${c.usage ? `<div class="swatch-usage">${escapeHtml(c.usage)}</div>` : ''}</div></div>`,
      )
      .join('');

    // --- Voice & tone (all observed copy: keyword chips, the site's own
    //     description, real page headings as key messages) ---
    const chips = (content.keywords || [])
      .slice(0, 8)
      .map((k) => `<span class="chip">${escapeHtml(k)}</span>`)
      .join('');
    const pillars = (content.headings || [])
      .slice(0, 5)
      .map((h) => `<li><span class="dash">—</span><span>${escapeHtml(h)}</span></li>`)
      .join('');
    const voiceHtml = `<div class="card">${chips ? `<div class="chips">${chips}</div>` : ''}${content.description ? `<p class="tone">${escapeHtml(content.description)}</p>` : ''}${pillars ? `<ul class="pillars">${pillars}</ul>` : ''}</div>`;

    // --- Imagery & layout ---
    const imageryLine = images.length ? tr('brandImageryStyle', { count: images.length }) : tr('brandImageryStyleNone');
    const subjects = (content.keywords || []).slice(0, 6).join(', ');
    const posture = (layout.postureRules || []).map((r) => `<li>${escapeHtml(r)}</li>`).join('');
    const imageryHtml = `<div class="card imagery"><p>${escapeHtml(imageryLine)}</p>${subjects ? `<p><span class="k">${escapeHtml(tr('brandSubjectsLabel'))}:</span> ${escapeHtml(subjects)}</p>` : ''}<p><span class="k">${escapeHtml(tr('brandRadiusLabel'))}:</span> ${escapeHtml(layout.radius)}</p>${posture ? `<div class="posture"><div class="mini-label">${escapeHtml(tr('brandLayoutPosture'))}</div><ul>${posture}</ul></div>` : ''}</div>`;

    // --- Images gallery (compact, click to preview) ---
    const gallery = images.length
      ? `<section class="sec"><div class="sec-head"><h2 class="sec-title">${escapeHtml(tr('brandImages'))}</h2>${images.length > 8 ? `<button type="button" class="view-all" id="od-view-all">${escapeHtml(tr('brandViewAll', { count: images.length }))}</button>` : ''}</div><div class="gallery">${images
          .map((s, i) => {
            const cap = s.label || '';
            return `<button type="button" class="shot" data-idx="${i}" aria-label="${escapeHtml(cap || tr('brandImageLabel', { index: i + 1 }))}"><span class="shot-frame"><img src="${escapeHtml(s.src)}" alt="${escapeHtml(cap)}" loading="lazy" /></span>${cap ? `<span class="shot-cap">${escapeHtml(cap)}</span>` : ''}</button>`;
          })
          .join('')}</div></section>`
      : '';

    // --- Component kit (a complete, on-brand UI kit) ---
    const kit = `<div class="kit">
      <div class="kit-group">
        <div class="kit-label">${escapeHtml(tr('kitButtons'))}</div>
        <div class="kit-row">
          <button type="button" class="btn primary">${escapeHtml(tr('kitPrimary'))}</button>
          <button type="button" class="btn secondary">${escapeHtml(tr('kitSecondary'))}</button>
          <button type="button" class="btn ghost">${escapeHtml(tr('kitGhost'))}</button>
          <button type="button" class="btn primary sm">${escapeHtml(tr('kitPrimary'))}</button>
          <button type="button" class="btn primary" disabled>${escapeHtml(tr('kitDisabled'))}</button>
        </div>
      </div>
      <div class="kit-group">
        <div class="kit-label">${escapeHtml(tr('kitForms'))}</div>
        <div class="kit-grid">
          <label class="field-label">${escapeHtml(tr('kitFieldLabel'))}<input class="input" type="email" placeholder="${escapeHtml(tr('kitFieldPlaceholder'))}" /></label>
          <label class="field-label">${escapeHtml(tr('kitSelectLabel'))}<select class="input"><option>${escapeHtml(tr('kitRadioA'))}</option><option>${escapeHtml(tr('kitRadioB'))}</option></select></label>
        </div>
        <textarea class="input textarea" rows="2" placeholder="${escapeHtml(tr('kitTextareaPlaceholder'))}"></textarea>
        <div class="kit-row toggles">
          <label class="check"><input type="checkbox" checked /> ${escapeHtml(tr('kitCheckbox'))}</label>
          <label class="check"><input type="radio" name="od-kit-r" checked /> ${escapeHtml(tr('kitRadioA'))}</label>
          <label class="check"><input type="radio" name="od-kit-r" /> ${escapeHtml(tr('kitRadioB'))}</label>
          <span class="switch on"><span class="knob"></span></span><span class="switch-label">${escapeHtml(tr('kitSwitch'))}</span>
        </div>
      </div>
      <div class="kit-group">
        <div class="kit-label">${escapeHtml(tr('kitBadges'))}</div>
        <div class="kit-row">
          <span class="badge solid">${escapeHtml(tr('kitBadgeNew'))}</span>
          <span class="badge soft">${escapeHtml(tr('kitBadgeBeta'))}</span>
          <span class="badge outline">${escapeHtml(tr('kitBadgePro'))}</span>
          <span class="dot-status"><span class="dot"></span>${escapeHtml(tr('kitTableStatus'))}</span>
        </div>
        <div class="tabs"><button type="button" class="tab active">${escapeHtml(tr('kitTabOverview'))}</button><button type="button" class="tab">${escapeHtml(tr('kitTabActivity'))}</button><button type="button" class="tab">${escapeHtml(tr('kitTabSettings'))}</button></div>
      </div>
      <div class="kit-group two">
        <div class="ui-card">
          <div class="ui-card-title">${escapeHtml(tr('kitCardTitle'))}</div>
          <p class="ui-card-body">${escapeHtml(tr('kitCardBody'))}</p>
          <div class="kit-row"><button type="button" class="btn primary sm">${escapeHtml(tr('kitPrimary'))}</button><button type="button" class="btn ghost sm">${escapeHtml(tr('kitSecondary'))}</button></div>
        </div>
        <div class="alert"><span class="alert-icon">&#9733;</span><span>${escapeHtml(tr('kitAlert'))}</span></div>
      </div>
      <div class="kit-group">
        <div class="kit-label">${escapeHtml(tr('kitTabs'))}</div>
        <table class="ui-table"><thead><tr><th>${escapeHtml(tr('kitTableHead1'))}</th><th>${escapeHtml(tr('kitTableHead2'))}</th><th>${escapeHtml(tr('kitTableHead3'))}</th></tr></thead><tbody>
          <tr><td>Ada Lovelace</td><td>${escapeHtml(tr('kitTabOverview'))}</td><td><span class="badge soft">${escapeHtml(tr('kitTableStatus'))}</span></td></tr>
          <tr><td>Alan Turing</td><td>${escapeHtml(tr('kitTabActivity'))}</td><td><span class="badge soft">${escapeHtml(tr('kitTableStatus'))}</span></td></tr>
        </tbody></table>
        <div class="progress"><span style="width:62%"></span></div>
      </div>
    </div>`;

    const json = escapeScriptJson(JSON.stringify(data, null, 2));
    const lbl = escapeScriptJson(
      JSON.stringify({
        close: tr('brandClose'),
        prev: tr('brandPrevImage'),
        next: tr('brandNextImage'),
        all: tr('brandAllImages', { count: images.length }),
      }),
    );
    const api = globalThis.OD_CLIPPER_I18N || I18N;
    const htmlLocale = api && api.htmlLang ? api.htmlLang(activeLocale) : activeLocale;
    const dir = api && api.isRtl && api.isRtl(activeLocale) ? 'rtl' : 'ltr';

    return `<!doctype html>
<html lang="${escapeHtml(htmlLocale)}" dir="${escapeHtml(dir)}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(content.title)} — ${escapeHtml(tr('brandPageTitleSuffix'))}</title>
<meta name="od-library-kind" content="design-system" />
<style data-brand-fonts>${safeCss(fontCss)}</style>
<style>
  :root {
    color-scheme: light;
    --paper: #faf9f5;
    --surface: #ffffff;
    --ink: #1a1a18;
    --ink-mute: #57564f;
    --ink-faint: #8a887f;
    --line: #e7e5dc;
    --line-soft: #efeee7;
    --accent: ${accent};
    --accent-ink: ${ink};
    --on-accent: ${onAccent};
    --ok: #3d7a4f;
    --err: #b4453a;
    --radius: 14px;
    --ui-radius: ${uiRadius};
    --font-display: ${fontDisplay};
    --font-body: ${fontBody};
    --font-mono: ${fontMono};
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; }
  body { background: var(--paper); color: var(--ink); font-family: var(--font-body); font-size: 15px; line-height: 1.5; -webkit-font-smoothing: antialiased; }
  .wrap { max-width: 1040px; margin: 0 auto; padding: 40px 28px 96px; }
  a { color: inherit; }
  .muted { color: var(--ink-faint); font-size: 13px; }

  header.kit-head { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 16px; }
  .kit-id { display: flex; align-items: center; gap: 14px; min-width: 0; }
  .id-mark { width: 52px; height: 52px; flex: none; display: flex; align-items: center; justify-content: center; border: 1px solid var(--line); border-radius: 13px; overflow: hidden; }
  .id-mark img { max-width: 78%; max-height: 78%; object-fit: contain; }
  .id-mark.initial { font-family: var(--font-display); font-weight: 700; font-size: 24px; background: var(--surface); color: var(--accent-ink); }
  .kit-id-text { min-width: 0; }
  .kit-title { font-family: var(--font-display); font-size: 38px; line-height: 1.05; font-weight: 600; letter-spacing: -0.02em; margin: 0; word-break: break-word; }
  .kit-tagline { margin: 6px 0 0; font-size: 16px; color: var(--ink-mute); max-width: 62ch; }
  .kit-source { margin-top: 6px; display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: var(--ink-faint); text-decoration: none; }
  .kit-source:hover { color: var(--accent-ink); }
  .status-pill { display: inline-flex; align-items: center; gap: 7px; border-radius: 999px; padding: 4px 11px 4px 9px; font-size: 12px; font-weight: 500; border: 1px solid var(--line); background: var(--surface); color: var(--ink-mute); white-space: nowrap; }
  .status-pill .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--ok); }

  .hero { margin-top: 22px; border: 1px solid var(--line-soft); border-radius: var(--radius); overflow: hidden; background: var(--line-soft); aspect-ratio: 16 / 5; box-shadow: 0 1px 2px rgba(0,0,0,.03); }
  .hero img { width: 100%; height: 100%; object-fit: cover; display: block; }

  .sec { margin-top: 40px; }
  .sec-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
  .sec-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.14em; color: var(--ink-faint); margin: 0 0 12px; }
  .sec-head .sec-title { margin: 0; }
  .sec-sub { margin: -4px 0 14px; color: var(--ink-faint); font-size: 13px; }
  .grid-2, .grid-top { display: grid; gap: 28px; grid-template-columns: 1fr; }
  @media (min-width: 860px) { .grid-2 { grid-template-columns: 1fr 1fr; } .grid-top { grid-template-columns: 1fr 2fr; } }
  .card { border: 1px solid var(--line-soft); background: var(--surface); border-radius: var(--radius); padding: 18px; box-shadow: 0 1px 2px rgba(0,0,0,.03); }

  /* Logo */
  .logo-stage { display: flex; min-height: 150px; align-items: center; justify-content: center; border: 1px solid var(--line-soft); border-radius: var(--radius); padding: 24px; }
  .logo-stage img { max-height: 88px; max-width: 100%; object-fit: contain; }
  .logo-stage.empty { flex-direction: column; gap: 8px; border-style: dashed; border-color: var(--line); color: var(--ink-faint); }
  .logo-initial { font-family: var(--font-display); font-weight: 800; font-size: 46px; line-height: 1; color: var(--accent-ink); }
  .logo-empty-note { font-size: 13px; }
  .logo-thumbs { margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap; }
  .logo-thumb { width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--line-soft); border-radius: 9px; padding: 6px; cursor: pointer; background: var(--surface); }
  .logo-thumb.active { border-color: var(--accent); }
  .logo-thumb img { max-width: 100%; max-height: 100%; object-fit: contain; }

  /* Typography */
  .fonts { display: grid; gap: 12px; grid-template-columns: repeat(2, 1fr); margin-bottom: 14px; }
  @media (min-width: 560px) { .fonts { grid-template-columns: repeat(3, 1fr); } }
  .font-tile { border: 1px solid var(--line-soft); border-radius: 12px; background: var(--surface); overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,.03); }
  .font-tile .ag { display: flex; align-items: center; justify-content: center; height: 100px; font-size: 54px; line-height: 1; color: var(--ink); background: var(--line-soft); }
  .font-tile .ft-meta { padding: 9px 11px 11px; }
  .font-tile .ft-name { font-size: 13px; font-weight: 600; line-height: 1.2; word-break: break-word; }
  .font-tile .ft-role { font-size: 11px; color: var(--ink-faint); margin-top: 1px; text-transform: uppercase; letter-spacing: .06em; }
  .type-row { border: 1px solid var(--line-soft); border-radius: 12px; background: var(--surface); padding: 16px 18px; }
  .type-row + .type-row { margin-top: 12px; }
  .type-meta { display: flex; align-items: baseline; justify-content: space-between; gap: 14px; }
  .type-label { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: var(--ink-faint); }
  .type-font { font-size: 12px; color: var(--ink-mute); text-align: right; word-break: break-word; }
  .type-sample { margin: 8px 0 0; line-height: 1.15; word-break: break-word; }

  /* Palette */
  .palette { display: grid; gap: 12px; grid-template-columns: repeat(2, 1fr); }
  @media (min-width: 560px) { .palette { grid-template-columns: repeat(4, 1fr); } }
  @media (min-width: 920px) { .palette { grid-template-columns: repeat(8, 1fr); } }
  .swatch { overflow: hidden; border: 1px solid var(--line-soft); border-radius: 12px; background: var(--surface); box-shadow: 0 1px 2px rgba(0,0,0,.03); }
  .swatch-chip { height: 84px; display: flex; align-items: flex-end; padding: 8px; }
  .swatch-chip .hex { font-family: var(--font-mono); font-size: 11px; }
  .swatch-body { padding: 9px 10px 11px; }
  .swatch-name { font-size: 13px; font-weight: 500; line-height: 1.2; }
  .swatch-role { font-size: 11px; color: var(--ink-faint); margin-top: 1px; }
  .swatch-usage { font-size: 11px; color: var(--ink-mute); margin-top: 5px; line-height: 1.35; }

  /* Voice */
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip { border-radius: 999px; padding: 3px 10px; font-size: 12px; font-weight: 500; background: color-mix(in srgb, var(--accent) 14%, transparent); color: var(--accent-ink); }
  .tone { margin: 12px 0 0; font-size: 14px; color: var(--ink-mute); line-height: 1.55; }
  .pillars { margin: 12px 0 0; padding: 0; list-style: none; font-size: 14px; }
  .pillars li { display: flex; gap: 8px; margin-top: 4px; }
  .pillars .dash { color: var(--accent-ink); }

  /* Imagery */
  .imagery p { margin: 0; font-size: 14px; }
  .imagery p + p { margin-top: 6px; color: var(--ink-mute); }
  .imagery .k { font-weight: 600; color: var(--ink); }
  .posture { margin-top: 12px; border-top: 1px solid var(--line-soft); padding-top: 12px; }
  .mini-label { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: var(--ink-faint); }
  .posture ul { margin: 6px 0 0; padding-left: 18px; font-size: 12px; color: var(--ink-mute); }
  .posture ul li { margin-top: 2px; }

  /* Gallery */
  .view-all { border: 1px solid var(--line); background: var(--surface); color: var(--ink-mute); border-radius: 999px; padding: 4px 12px; font-size: 12px; font-weight: 500; cursor: pointer; font-family: inherit; transition: border-color .2s cubic-bezier(.23,1,.32,1), color .2s cubic-bezier(.23,1,.32,1); }
  .view-all:hover { border-color: var(--accent); color: var(--accent-ink); }
  .gallery { display: grid; gap: 12px; grid-template-columns: repeat(2, 1fr); }
  @media (min-width: 560px) { .gallery { grid-template-columns: repeat(3, 1fr); } }
  @media (min-width: 920px) { .gallery { grid-template-columns: repeat(4, 1fr); } }
  .shot { display: block; text-align: left; padding: 0; border: 1px solid var(--line-soft); border-radius: 12px; background: var(--surface); overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,.03); cursor: pointer; font-family: inherit; transition: border-color .14s ease, transform .14s ease; }
  .shot:hover { border-color: var(--accent); transform: translateY(-1px); }
  .shot:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .shot-frame { display: block; aspect-ratio: 4 / 3; background: var(--line-soft); }
  .shot-frame img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .shot-cap { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; padding: 8px 10px 10px; font-size: 12px; font-weight: 500; line-height: 1.3; color: var(--ink); }

  /* Component kit */
  .kit { display: grid; gap: 22px; border: 1px solid var(--line-soft); background: var(--surface); border-radius: var(--radius); padding: 22px; box-shadow: 0 1px 2px rgba(0,0,0,.03); }
  .kit-group { display: grid; gap: 12px; }
  .kit-group.two { grid-template-columns: 1fr; }
  @media (min-width: 640px) { .kit-group.two { grid-template-columns: 1.3fr 1fr; align-items: stretch; gap: 14px; } }
  .kit-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .1em; color: var(--ink-faint); }
  .kit-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
  .kit-grid { display: grid; gap: 12px; grid-template-columns: 1fr; }
  @media (min-width: 560px) { .kit-grid { grid-template-columns: 1fr 1fr; } }
  .btn { display: inline-flex; align-items: center; justify-content: center; min-height: 38px; padding: 0 16px; border-radius: var(--ui-radius); border: 1px solid transparent; font: 600 13px/1 var(--font-body); cursor: pointer; }
  .btn.primary { background: var(--accent); color: var(--on-accent); border-color: var(--accent); }
  .btn.secondary { background: var(--surface); color: var(--ink); border-color: var(--line); }
  .btn.ghost { background: transparent; color: var(--accent-ink); }
  .btn.sm { min-height: 30px; padding: 0 12px; font-size: 12px; }
  .btn[disabled] { opacity: .45; cursor: not-allowed; }
  .field-label { display: grid; gap: 5px; font-size: 12px; font-weight: 600; color: var(--ink-mute); }
  .input { width: 100%; min-height: 40px; padding: 0 12px; border: 1px solid var(--line); border-radius: var(--ui-radius); background: var(--surface); color: var(--ink); font: 400 14px/1.4 var(--font-body); }
  .input:focus { outline: 2px solid color-mix(in srgb, var(--accent) 45%, transparent); outline-offset: 1px; border-color: var(--accent); }
  .input.textarea { padding: 10px 12px; min-height: 64px; resize: none; line-height: 1.5; }
  select.input { appearance: none; -webkit-appearance: none; }
  .toggles { gap: 16px; }
  .check { display: inline-flex; align-items: center; gap: 7px; font-size: 13px; color: var(--ink); cursor: pointer; }
  .check input { accent-color: var(--accent); width: 15px; height: 15px; }
  .switch { display: inline-flex; width: 38px; height: 22px; border-radius: 999px; background: var(--line); position: relative; }
  .switch.on { background: var(--accent); }
  .switch .knob { position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.3); }
  .switch.on .knob { left: 18px; }
  .switch-label { font-size: 13px; color: var(--ink-mute); }
  .badge { display: inline-flex; align-items: center; border-radius: 999px; padding: 3px 10px; font-size: 12px; font-weight: 600; }
  .badge.solid { background: var(--accent); color: var(--on-accent); }
  .badge.soft { background: color-mix(in srgb, var(--accent) 14%, transparent); color: var(--accent-ink); }
  .badge.outline { border: 1px solid var(--line); color: var(--ink-mute); }
  .dot-status { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--ink-mute); }
  .dot-status .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--ok); }
  .tabs { display: inline-flex; gap: 2px; border-bottom: 1px solid var(--line-soft); }
  .tab { border: 0; background: transparent; cursor: pointer; padding: 8px 12px; font: 500 13px/1 var(--font-body); color: var(--ink-mute); border-bottom: 2px solid transparent; margin-bottom: -1px; }
  .tab.active { color: var(--accent-ink); border-bottom-color: var(--accent); font-weight: 600; }
  .ui-card { border: 1px solid var(--line-soft); border-radius: var(--radius); background: var(--paper); padding: 16px; display: grid; gap: 8px; align-content: start; }
  .ui-card-title { font-weight: 600; font-size: 14px; }
  .ui-card-body { margin: 0; font-size: 13px; color: var(--ink-mute); line-height: 1.5; }
  .alert { display: flex; gap: 10px; align-items: flex-start; border: 1px solid color-mix(in srgb, var(--accent) 30%, var(--line)); background: color-mix(in srgb, var(--accent) 8%, var(--surface)); border-radius: var(--radius); padding: 14px 16px; font-size: 13px; color: var(--ink); }
  .alert-icon { color: var(--accent-ink); font-size: 14px; line-height: 1.4; }
  .ui-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .ui-table th, .ui-table td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--line-soft); }
  .ui-table th { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: var(--ink-faint); font-weight: 600; }
  .ui-table tbody tr:last-child td { border-bottom: 0; }
  .progress { height: 8px; border-radius: 999px; background: var(--line-soft); overflow: hidden; }
  .progress span { display: block; height: 100%; background: var(--accent); border-radius: 999px; }

  .data-note { margin-top: 40px; color: var(--ink-faint); font-size: 12px; }
  .data-note code { font-family: var(--font-mono); }

  /* Overlays (lightbox + masonry) */
  .ov { position: fixed; inset: 0; z-index: 60; display: none; }
  .ov.open { display: block; }
  .ov-back { position: absolute; inset: 0; background: rgba(20,19,17,.74); opacity: 0; transition: opacity .14s cubic-bezier(.23,1,.32,1); }
  .ov.in .ov-back { opacity: 1; transition-duration: .2s; }
  .ov-panel { position: absolute; opacity: 0; transform: scale(.92); transition: opacity .14s cubic-bezier(.23,1,.32,1), transform .14s cubic-bezier(.23,1,.32,1); }
  .ov.in .ov-panel { opacity: 1; transform: scale(1); transition-duration: .2s; }
  .ov-close { position: absolute; top: 14px; right: 16px; z-index: 2; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border: 0; border-radius: 999px; background: rgba(255,255,255,.92); color: #1a1a18; font-size: 22px; line-height: 1; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,.22); }
  #ov-light { z-index: 70; }
  #ov-light .ov-panel { top: 50%; left: 50%; transform: translate(-50%,-50%) scale(.92); display: flex; flex-direction: column; align-items: center; }
  #ov-light.in .ov-panel { transform: translate(-50%,-50%) scale(1); }
  #ov-light img { max-width: 92vw; max-height: 82vh; object-fit: contain; border-radius: 12px; box-shadow: 0 12px 48px rgba(0,0,0,.5); background: #fff; }
  .light-cap { margin-top: 12px; color: rgba(255,255,255,.92); font-size: 13px; text-align: center; max-width: 80vw; }
  .light-nav { position: absolute; top: 50%; transform: translateY(-50%); width: 44px; height: 44px; border: 0; border-radius: 999px; background: rgba(255,255,255,.88); color: #1a1a18; font-size: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 12px rgba(0,0,0,.28); }
  .light-prev { left: 3vw; } .light-next { right: 3vw; }
  #ov-grid .ov-panel { top: 4vh; left: 50%; transform: translate(-50%,0) scale(.96); width: min(980px, 92vw); height: 92vh; background: var(--paper); border-radius: var(--radius); overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 16px 60px rgba(0,0,0,.42); }
  #ov-grid.in .ov-panel { transform: translate(-50%,0) scale(1); }
  .grid-bar { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-bottom: 1px solid var(--line); }
  .grid-bar h3 { margin: 0; font-family: var(--font-display); font-size: 18px; }
  .grid-scroll { overflow-y: auto; padding: 16px 20px 28px; }
  .masonry { columns: 2; column-gap: 12px; }
  @media (min-width: 560px) { .masonry { columns: 3; } }
  @media (min-width: 860px) { .masonry { columns: 4; } }
  .masonry .m-item { break-inside: avoid; margin: 0 0 12px; border-radius: 10px; overflow: hidden; border: 1px solid var(--line-soft); background: var(--surface); cursor: pointer; transition: transform .2s cubic-bezier(.23,1,.32,1); }
  .masonry .m-item:hover { transform: translateY(-2px); }
  .masonry .m-item img { width: 100%; display: block; }
  .icon-x { border: 0; background: transparent; font-size: 22px; line-height: 1; cursor: pointer; color: var(--ink-mute); padding: 4px 9px; border-radius: 8px; }
  .icon-x:hover { background: var(--line-soft); color: var(--ink); }
  @media (max-width: 600px) { .wrap { padding: 28px 18px 72px; } .kit-title { font-size: 30px; } }
</style>
</head>
<body>
<div class="wrap">
  <header class="kit-head">
    <div class="kit-id">${headerMark}<div class="kit-id-text"><h1 class="kit-title">${escapeHtml(content.title)}</h1>${content.description ? `<p class="kit-tagline">${escapeHtml(content.description)}</p>` : ''}${content.url ? `<a class="kit-source" href="${escapeHtml(content.url)}" target="_blank" rel="noreferrer noopener">${escapeHtml(content.domain || content.url)} ↗</a>` : ''}</div></div>
    <span class="status-pill"><span class="dot"></span>${escapeHtml(tr('brandReady'))}</span>
  </header>
  ${heroHtml}
  <div class="sec grid-top">
    <section><h2 class="sec-title">${escapeHtml(tr('brandLogo'))}</h2>${logoBlock}</section>
    <section><h2 class="sec-title">${escapeHtml(tr('brandTypography'))}</h2>${fontTilesHtml}${typeRows}</section>
  </div>
  <section class="sec"><h2 class="sec-title">${escapeHtml(tr('brandPalette'))}</h2><div class="palette">${paletteHtml}</div></section>
  <div class="sec grid-2">
    <section><h2 class="sec-title">${escapeHtml(tr('brandVoiceTone'))}</h2>${voiceHtml}</section>
    <section><h2 class="sec-title">${escapeHtml(tr('brandImageryLayout'))}</h2>${imageryHtml}</section>
  </div>
  ${gallery}
  <section class="sec"><h2 class="sec-title">${escapeHtml(tr('brandComponentKit'))}</h2><p class="sec-sub">${escapeHtml(tr('brandComponentKitSub'))}</p>${kit}</section>
  <p class="data-note">${tr('brandDataNote')}</p>
</div>
<script type="application/json" id="od-design-system-data">${json}</script>
<script>
(function () {
  var dataEl = document.getElementById('od-design-system-data');
  var DATA = {};
  try { DATA = JSON.parse(dataEl && dataEl.textContent ? dataEl.textContent : '{}'); } catch (e) {}
  var LBL = ${lbl};
  var SAMPLES = ((DATA.assets && DATA.assets.images) || []).map(function (s) { return { file: s.src, caption: s.label || '' }; });

  var logoImg = document.getElementById('od-logo-img');
  Array.prototype.forEach.call(document.querySelectorAll('.logo-thumb'), function (b) {
    b.addEventListener('click', function () {
      if (logoImg) logoImg.src = b.getAttribute('data-src');
      Array.prototype.forEach.call(document.querySelectorAll('.logo-thumb'), function (x) { x.classList.remove('active'); });
      b.classList.add('active');
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('.tabs'), function (group) {
    Array.prototype.forEach.call(group.querySelectorAll('.tab'), function (tb) {
      tb.addEventListener('click', function () {
        Array.prototype.forEach.call(group.querySelectorAll('.tab'), function (x) { x.classList.remove('active'); });
        tb.classList.add('active');
      });
    });
  });

  var stack = [];
  function mk(id) { var ov = document.createElement('div'); ov.className = 'ov'; ov.id = id; var bk = document.createElement('div'); bk.className = 'ov-back'; ov.appendChild(bk); bk.addEventListener('click', function () { closeOv(ov); }); document.body.appendChild(ov); return ov; }
  function openOv(ov) { if (stack.indexOf(ov) === -1) stack.push(ov); ov.classList.add('open'); requestAnimationFrame(function () { requestAnimationFrame(function () { ov.classList.add('in'); }); }); }
  function closeOv(ov) { ov.classList.remove('in'); var i = stack.indexOf(ov); if (i !== -1) stack.splice(i, 1); setTimeout(function () { if (!ov.classList.contains('in')) ov.classList.remove('open'); }, 170); }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && stack.length) closeOv(stack[stack.length - 1]); });

  var lov = null, limg = null, lcap = null, lidx = 0;
  function buildL() {
    if (lov) return;
    lov = mk('ov-light');
    var p = document.createElement('div'); p.className = 'ov-panel';
    limg = document.createElement('img'); lcap = document.createElement('div'); lcap.className = 'light-cap';
    p.appendChild(limg); p.appendChild(lcap); lov.appendChild(p);
    var c = document.createElement('button'); c.className = 'ov-close'; c.type = 'button'; c.innerHTML = '&times;'; c.setAttribute('aria-label', LBL.close);
    c.addEventListener('click', function () { closeOv(lov); }); lov.appendChild(c);
    if (SAMPLES.length > 1) {
      var pv = document.createElement('button'); pv.className = 'light-nav light-prev'; pv.type = 'button'; pv.innerHTML = '&#8249;'; pv.setAttribute('aria-label', LBL.prev);
      pv.addEventListener('click', function (e) { e.stopPropagation(); showL(lidx - 1); });
      var nx = document.createElement('button'); nx.className = 'light-nav light-next'; nx.type = 'button'; nx.innerHTML = '&#8250;'; nx.setAttribute('aria-label', LBL.next);
      nx.addEventListener('click', function (e) { e.stopPropagation(); showL(lidx + 1); });
      lov.appendChild(pv); lov.appendChild(nx);
    }
  }
  function showL(i) { if (!SAMPLES.length) return; buildL(); lidx = (i % SAMPLES.length + SAMPLES.length) % SAMPLES.length; var s = SAMPLES[lidx]; limg.src = s.file; limg.alt = s.caption; lcap.textContent = s.caption; openOv(lov); }

  var gov = null;
  function buildG() {
    if (gov) return;
    gov = mk('ov-grid');
    var p = document.createElement('div'); p.className = 'ov-panel';
    var bar = document.createElement('div'); bar.className = 'grid-bar';
    var h = document.createElement('h3'); h.textContent = LBL.all;
    var x = document.createElement('button'); x.className = 'icon-x'; x.type = 'button'; x.innerHTML = '&times;'; x.setAttribute('aria-label', LBL.close);
    x.addEventListener('click', function () { closeOv(gov); });
    bar.appendChild(h); bar.appendChild(x);
    var sc = document.createElement('div'); sc.className = 'grid-scroll';
    var ms = document.createElement('div'); ms.className = 'masonry';
    SAMPLES.forEach(function (s, i) { var it = document.createElement('div'); it.className = 'm-item'; var im = document.createElement('img'); im.src = s.file; im.alt = s.caption; im.loading = 'lazy'; it.appendChild(im); it.addEventListener('click', function () { showL(i); }); ms.appendChild(it); });
    sc.appendChild(ms); p.appendChild(bar); p.appendChild(sc); gov.appendChild(p);
  }
  function openG() { buildG(); openOv(gov); }

  Array.prototype.forEach.call(document.querySelectorAll('.shot[data-idx]'), function (el) {
    var i = Number(el.getAttribute('data-idx')) || 0;
    el.addEventListener('click', function () { showL(i); });
  });
  var va = document.getElementById('od-view-all');
  if (va) va.addEventListener('click', openG);
})();
</script>
</body>
</html>`;
  }

  window.__odBrandCapture = function (opts) {
    setActiveLocale(opts && opts.locale);
    const resources = new Set();
    const elements = visibleElements();
    const content = collectContent();
    const palette = collectPalette(elements);
    const colors = deriveBrandColors(palette);
    const typography = collectTypography();
    const fontFaces = collectFontFaces(resources);
    const assets = collectImageAssets(elements, resources);
    const components = collectComponents();
    const layout = deriveLayout(components);
    const accent = (colors.find((c) => c.role === 'accent') || {}).hex || '#C96442';
    const data = {
      version: 2,
      kind: 'design-system',
      capturedAt: Date.now(),
      content,
      brand: { name: content.title, tagline: content.description, sourceUrl: content.url, accent, colors },
      palette,
      typography,
      assets,
      layout,
      components,
    };
    return {
      html: renderHtml(data, fontFaces),
      resources: Array.from(resources).filter(isHttp).slice(0, MAX_RESOURCES),
      title: tr('brandFileTitle', { title: content.title }),
      url: location.href,
      summary: {
        colors: colors.length,
        logos: assets.logos.length,
        images: assets.images.length,
        fonts: typography.families.length,
      },
    };
  };
})();
