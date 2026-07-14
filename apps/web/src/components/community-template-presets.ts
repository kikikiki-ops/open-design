import type { ProjectMetadata } from '../types';

export type CommunityTemplatePreset = {
  id: string;
  projectName: string;
  prompt: string;
  metadata: ProjectMetadata & { demoPresetId: string };
  html: string;
};

const ELECTRIC_STUDIO_TEMPLATE_METADATA: ProjectMetadata & { demoPresetId: string } = {
  kind: 'deck',
  entryFile: 'index.html',
  slideCount: '7',
  nameSource: 'user',
  demoPresetId: 'electric-studio',
};

const ELECTRIC_STUDIO_TEMPLATE_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Electric Studio 2</title>
  <style>
    :root { color-scheme: light; --blue:#4864f4; --ink:#111; --muted:#6d6d6d; }
    body { margin:0; min-height:100vh; display:grid; place-items:center; background:#090909; font-family:"Albert Sans","PingFang SC","Microsoft YaHei",sans-serif; }
    .slide { width:min(1120px,90vw); aspect-ratio:16/9; background:#fff; position:relative; overflow:hidden; box-shadow:0 24px 80px rgba(0,0,0,.34); }
    .top { padding:80px 72px 0; color:var(--blue); font-size:12px; font-weight:800; letter-spacing:.42em; text-transform:uppercase; }
    h1 { margin:34px 0 0; padding-left:72px; max-width:520px; color:var(--ink); font-size:86px; line-height:.92; letter-spacing:-.07em; }
    .blue { position:absolute; left:0; right:0; bottom:0; height:31%; background:var(--blue); color:#fff; }
    .copy { position:absolute; left:72px; top:48px; max-width:450px; font-size:20px; line-height:1.35; }
    .year { position:absolute; left:72px; bottom:28px; opacity:.62; font-size:12px; letter-spacing:.2em; }
    .count { position:absolute; right:44px; bottom:28px; font-size:12px; font-weight:700; letter-spacing:.18em; }
  </style>
</head>
<body>
  <main class="slide" aria-label="Electric Studio cover">
    <div class="top">Electric Studio<br/>Studio Capabilities</div>
    <h1>Electric<br/>Studio<span style="color:var(--blue)">.</span></h1>
    <section class="blue">
      <div class="copy">Bold design. Clean systems.<br/>Work that commands attention — and endures.</div>
      <div class="year">2025</div>
      <div class="count">01 / 07</div>
    </section>
  </main>
</body>
</html>`;

const LANDING_TEMPLATE_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Product Launch Landing</title>
  <style>
    :root { --ink:#15110f; --muted:#756d66; --line:#eadfd7; --accent:#d46342; --paper:#fffaf5; }
    body { margin:0; background:var(--paper); color:var(--ink); font-family:"Albert Sans","PingFang SC","Microsoft YaHei",sans-serif; }
    main { width:min(1080px,88vw); margin:0 auto; padding:76px 0; }
    nav { display:flex; justify-content:space-between; align-items:center; color:var(--muted); font-size:14px; }
    .brand { color:var(--ink); font-weight:800; letter-spacing:-.04em; }
    .hero { display:grid; grid-template-columns:1.05fr .95fr; gap:56px; align-items:center; padding:86px 0 64px; }
    h1 { margin:0; font-size:72px; line-height:.94; letter-spacing:-.07em; }
    p { color:var(--muted); font-size:18px; line-height:1.55; }
    .cta { display:inline-flex; margin-top:18px; padding:14px 18px; border-radius:999px; background:var(--accent); color:white; text-decoration:none; font-weight:700; }
    .card { min-height:380px; border:1px solid var(--line); border-radius:32px; background:white; box-shadow:0 24px 70px rgb(92 53 31 / .12); padding:24px; }
    .bars { display:grid; gap:16px; margin-top:70px; }
    .bar { height:54px; border-radius:18px; background:linear-gradient(90deg,var(--accent),#f3c7ad); opacity:.9; }
    .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-top:28px; }
    .tile { padding:22px; border:1px solid var(--line); border-radius:24px; background:white; }
    .tile strong { display:block; margin-bottom:8px; }
  </style>
</head>
<body>
  <main>
    <nav><span class="brand">LaunchKit</span><span>Product • Proof • Pricing</span></nav>
    <section class="hero">
      <div>
        <h1>Ship the product page before the product meeting.</h1>
        <p>A polished launch-page starter with hero messaging, proof blocks, pricing, and FAQ sections ready to edit.</p>
        <a class="cta" href="#features">Start editing</a>
      </div>
      <div class="card" aria-label="Launch visual">
        <div class="bars"><div class="bar"></div><div class="bar" style="width:74%"></div><div class="bar" style="width:48%"></div></div>
      </div>
    </section>
    <section id="features" class="grid">
      <div class="tile"><strong>Positioning</strong><span>Audience, category, and promise.</span></div>
      <div class="tile"><strong>Social proof</strong><span>Metrics, logos, and quotes.</span></div>
      <div class="tile"><strong>Conversion</strong><span>CTA, pricing, and FAQ.</span></div>
    </section>
  </main>
</body>
</html>`;

const MEMO_TEMPLATE_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Founder Memo</title>
  <style>
    body { margin:0; background:#f7f3ec; color:#161616; font-family:Georgia,"Times New Roman",serif; }
    article { width:min(760px,84vw); margin:0 auto; padding:84px 0 110px; }
    .eyebrow { color:#9a6a35; font:700 12px/1.2 "Albert Sans","PingFang SC","Microsoft YaHei",sans-serif; letter-spacing:.18em; text-transform:uppercase; }
    h1 { margin:18px 0 26px; font-size:64px; line-height:1; letter-spacing:-.045em; }
    .lead { color:#59524b; font-size:24px; line-height:1.45; }
    hr { margin:46px 0; border:0; border-top:1px solid #ded4c5; }
    h2 { margin:34px 0 12px; font:700 22px/1.2 "Albert Sans","PingFang SC","Microsoft YaHei",sans-serif; }
    p { color:#403b36; font-size:19px; line-height:1.7; }
    .note { padding:22px 24px; border-left:4px solid #111; background:#fffaf2; font-family:"Albert Sans","PingFang SC","Microsoft YaHei",sans-serif; }
  </style>
</head>
<body>
  <article>
    <div class="eyebrow">Founder Memo</div>
    <h1>The case for a sharper wedge.</h1>
    <p class="lead">A narrative memo template for market insight, product thesis, traction, and the ask.</p>
    <hr />
    <h2>1. Market shift</h2>
    <p>Describe the behavior change you are seeing, why it matters now, and who feels the pain most acutely.</p>
    <h2>2. Product wedge</h2>
    <p>Explain the smallest lovable workflow that wins trust before expanding into a broader platform.</p>
    <div class="note">Replace this block with evidence: customer quotes, usage signals, or revenue proof.</div>
    <h2>3. The ask</h2>
    <p>Close with the decision you need from the reader and the next concrete milestone.</p>
  </article>
</body>
</html>`;

const DASHBOARD_TEMPLATE_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Growth Dashboard</title>
  <style>
    :root { --bg:#f5f7f4; --card:#fff; --ink:#15201a; --muted:#718075; --green:#0f9f6e; --line:#dfe7df; }
    body { margin:0; min-height:100vh; background:var(--bg); color:var(--ink); font-family:"Albert Sans","PingFang SC","Microsoft YaHei",sans-serif; }
    main { width:min(1120px,90vw); margin:0 auto; padding:56px 0; }
    header { display:flex; justify-content:space-between; align-items:end; margin-bottom:26px; }
    h1 { margin:0; font-size:42px; letter-spacing:-.05em; }
    header p { margin:8px 0 0; color:var(--muted); }
    .grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
    .card { padding:20px; border:1px solid var(--line); border-radius:24px; background:var(--card); box-shadow:0 14px 36px rgb(34 61 45 / .08); }
    .label { color:var(--muted); font-size:13px; }
    .value { margin-top:16px; font-size:38px; font-weight:800; letter-spacing:-.05em; }
    .delta { display:inline-flex; margin-top:12px; padding:5px 9px; border-radius:999px; background:#dcf7eb; color:#08734e; font-size:12px; font-weight:700; }
    .wide { grid-column:span 2; min-height:260px; }
    .bars { display:flex; align-items:end; gap:10px; height:180px; margin-top:20px; }
    .bars span { flex:1; border-radius:12px 12px 0 0; background:linear-gradient(#18b77f,var(--green)); }
  </style>
</head>
<body>
  <main>
    <header><div><h1>Growth Dashboard</h1><p>Acquisition, activation, usage, and revenue review.</p></div><strong>Last 30 days</strong></header>
    <section class="grid">
      <div class="card"><div class="label">New designs</div><div class="value">128</div><span class="delta">+18 this week</span></div>
      <div class="card"><div class="label">Active members</div><div class="value">5</div><span class="delta">+2</span></div>
      <div class="card"><div class="label">Design systems</div><div class="value">12</div><span class="delta">+3</span></div>
      <div class="card"><div class="label">Token use</div><div class="value">1.42M</div><span class="delta">Top user</span></div>
      <div class="card wide"><div class="label">Weekly output</div><div class="bars"><span style="height:42%"></span><span style="height:68%"></span><span style="height:54%"></span><span style="height:86%"></span><span style="height:74%"></span></div></div>
      <div class="card wide"><div class="label">Collaboration mix</div><div class="bars"><span style="height:72%"></span><span style="height:48%"></span><span style="height:88%"></span><span style="height:36%"></span><span style="height:61%"></span></div></div>
    </section>
  </main>
</body>
</html>`;

export const COMMUNITY_TEMPLATE_PRESETS: Record<string, CommunityTemplatePreset> = {
  'electric-studio': {
    id: 'electric-studio',
    projectName: 'Electric Studio 2',
    prompt: 'Template remix: open Electric Studio 2 as editable project files, without starting a chat.',
    metadata: ELECTRIC_STUDIO_TEMPLATE_METADATA,
    html: ELECTRIC_STUDIO_TEMPLATE_HTML,
  },
  'launch-landing': {
    id: 'launch-landing',
    projectName: 'Product Launch Landing',
    prompt: 'Template remix: open Product Launch Landing as editable project files, without starting a chat.',
    metadata: {
      kind: 'prototype',
      entryFile: 'index.html',
      nameSource: 'user',
      demoPresetId: 'launch-landing',
    },
    html: LANDING_TEMPLATE_HTML,
  },
  'founder-memo': {
    id: 'founder-memo',
    projectName: 'Founder Memo',
    prompt: 'Template remix: open Founder Memo as editable project files, without starting a chat.',
    metadata: {
      kind: 'prototype',
      entryFile: 'index.html',
      nameSource: 'user',
      demoPresetId: 'founder-memo',
    },
    html: MEMO_TEMPLATE_HTML,
  },
  'growth-dashboard': {
    id: 'growth-dashboard',
    projectName: 'Growth Dashboard',
    prompt: 'Template remix: open Growth Dashboard as editable project files, without starting a chat.',
    metadata: {
      kind: 'prototype',
      entryFile: 'index.html',
      nameSource: 'user',
      demoPresetId: 'growth-dashboard',
    },
    html: DASHBOARD_TEMPLATE_HTML,
  },
};

export function resolveCommunityTemplatePreset(templateId: string): CommunityTemplatePreset {
  const fallback = COMMUNITY_TEMPLATE_PRESETS['electric-studio'];
  if (!fallback) {
    throw new Error('Missing required electric-studio community template preset.');
  }
  return COMMUNITY_TEMPLATE_PRESETS[templateId] ?? fallback;
}
