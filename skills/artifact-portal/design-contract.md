# Design Contract (v1)

Every artifact published to the portal must satisfy this contract. The portal renders artifacts inside a sandboxed iframe alongside many others — an artifact that ignores the contract will leak portal chrome through its background, scroll horizontally on mobile, break for users with reduced-motion preferences, or fail silently in the sandbox. **Read this entire section before writing the HTML.**

The contract has five tiers:

1. **Hard requirements** — every artifact, no exceptions. Violations cause visible or behavioural breakage.
2. **Strong recommendations** — should be present. Skip only with an explicit `<!-- design-contract: skip ... -->` comment giving a reason.
3. **Source provenance** — per-category guidance on documenting what generated the artifact. Requirement level varies by category; see the Source Provenance section.
4. **Design freedom** — explicitly unconstrained. Do not default to the portal's own aesthetic. Each artifact is its own world.
5. **Reference** — non-prescriptive catalog of fonts, icons, and JS libraries known to work in the sandbox, with loading patterns. Use anything here, skip anything here, bring your own — the section exists so agents don't waste a turn rediscovering what loads and what 404s. Nothing in this tier adds to the compliance checklist.

### Sandbox: why these rules exist

The viewer renders your file inside:

```html
<iframe sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" src="/artifacts/<id>/file"></iframe>
```

Token set: `allow-scripts allow-popups allow-popups-to-escape-sandbox`. Not present: `allow-same-origin`, `allow-top-navigation`, `allow-forms`. `allow-popups` is included so `target="_blank"` links work — without it, all link clicks are silently blocked. `allow-popups-to-escape-sandbox` ensures new tabs opened by those links load normally and do not inherit the sandbox restrictions. Consequences you must design around:

- `localStorage`, `sessionStorage`, `document.cookie`, and `indexedDB` throw `SecurityError` on access — wrap any use in `try/catch` or just skip them.
- Cross-origin `fetch`/XHR that requires credentials or a non-`*` CORS policy will fail — the sandboxed iframe has a `null` origin. Unauthenticated `fetch()` to a CDN that returns `Access-Control-Allow-Origin: *` works fine; that's how ESM imports and dynamic CDN loads succeed. See Reference: External Resources for known-good CDNs.
- `window.parent` and `window.top` exist as objects. The portal listens for one inbound message type from the artifact: `{ type: 'portal:theme:request' }`. When received, the Viewer responds with `{ type: 'portal:theme', theme: 'light'|'dark' }`. There are no other postMessage integrations — `window.parent` reads and other message types are ignored.
- Forms with an `action=` attribute that POST to a server will silently break. Use JS handlers (`onsubmit`) for interactive forms.
- The only working way to follow an external link is `target="_blank" rel="noopener noreferrer"` — clicks without `target="_blank"` are blocked because `allow-top-navigation` is absent. `allow-popups` is present so popup-style navigation (`target="_blank"`) does work; `allow-popups-to-escape-sandbox` ensures the newly opened tab doesn't inherit the sandbox.
- The iframe's own background is the portal's dark color. If your `<body>` background is transparent or doesn't fill the viewport, dark portal chrome bleeds through.

### Hard requirements

Every artifact must satisfy all of the following. Treat this as a checklist — verify each item before publishing.

#### 1. Valid HTML5 document shell

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <title>Q2 Growth Report</title>
  <!-- design-contract: v1 -->
  ...
</head>
<body>
  ...
</body>
</html>
```

The `<title>` must match the published `title` field. The contract stamp `<!-- design-contract: v1 -->` must appear near the top of `<head>` so the portal can verify compliance at a glance.

If you intentionally skip a recommended item, document it with a skip comment near the contract stamp:

```html
<!-- design-contract: v1 -->
<!-- design-contract: skip og-tags reason=internal-not-shared -->
```

#### 2. Adaptive color scheme

The portal sends a `postMessage` into the iframe on load and whenever the user switches theme. Every artifact must listen for this message and apply the scheme via a `data-scheme` attribute — **do not rely on `prefers-color-scheme` media queries**, which reflect OS preference and are disconnected from the portal's theme toggle. Both light and dark palettes must be implemented; design freedom over the actual colors is unlimited, but neither mode may be absent.

**Required pattern:**

```html
<!-- In <head>, before <style> -->
<script>
  (function(){
    var d = document.documentElement;
    // Initialize from OS preference (standalone fallback for direct file opens)
    d.setAttribute('data-scheme', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    // Handshake: request the portal's current theme. The Viewer responds with portal:theme
    // immediately because this IIFE runs before the portal loads the artifact into the iframe,
    // so the Viewer's message listener is already registered when this fires.
    try { window.parent.postMessage({ type: 'portal:theme:request' }, '*'); } catch {}
    // Apply portal theme (response to handshake request, or live toggle from the UI)
    window.addEventListener('message', function(e){
      if (e.data && e.data.type === 'portal:theme' && (e.data.theme === 'light' || e.data.theme === 'dark'))
        d.setAttribute('data-scheme', e.data.theme);
    });
  })();
</script>
```

```css
/* In <style> — use [data-scheme] selectors, NOT @media (prefers-color-scheme) */
:root {
  color-scheme: light;
  --bg: #ffffff;
  --fg: #14110f;
}
[data-scheme="dark"] {
  color-scheme: dark;
  --bg: #0c0e14;
  --fg: #ede9e3;
}
body { background: var(--bg); color: var(--fg); }
```

The `color-scheme` property in CSS keeps UA-rendered elements (scrollbars, form controls) consistent with the chosen scheme. Set it on `:root` (light default) and override in `[data-scheme="dark"]`.

The `<meta name="color-scheme" content="light dark">` declaration is still required (the `color-scheme` meta requirement) — it tells the browser that both schemes are supported, which matters before the script runs.

#### 3. `<meta name="color-scheme">` declared

Without this, the browser bleeds OS-theme scrollbars and form-control colors into the iframe. Required even when the aesthetic is fixed to one scheme:

```html
<!-- Dark-only artifact -->
<meta name="color-scheme" content="dark">

<!-- Light-only artifact -->
<meta name="color-scheme" content="light">

<!-- Adaptive artifact that responds to user preference -->
<meta name="color-scheme" content="light dark">
```

#### 4. Opaque body background that covers the full viewport

```css
html, body {
  min-height: 100%;
}
body {
  background: #0c0e14; /* or whatever your design uses — must be opaque */
}
```

Use `min-height: 100%` (not `100vh`) on both `html` and `body` so a short artifact still covers the viewport without producing extra scroll height. The background colour must be opaque — no `rgba(...,0)` or `transparent`. If you want a gradient or texture, layer it over an opaque base.

#### 5. No horizontal scroll at 360px viewport width

```css
body {
  overflow-x: hidden;
}
pre, code, table, .scroll-x {
  overflow-x: auto;       /* code/tables scroll inside their own block */
  max-width: 100%;
}
img, svg, video, iframe {
  max-width: 100%;
  height: auto;
}
```

Verify by mentally walking through every wide element: long unbroken strings, code blocks, tables, images, fixed-pixel containers. Anything wider than 360px must scroll inside its own block, not push the page wider.

#### 6. Ultra-wide clamp

Top-level layout must cap at ≤ 1600px. Prose text must cap at ≤ 72ch.

```css
body {
  max-width: 1600px;
  margin: 0 auto;
}
.prose, article, main p, main li {
  max-width: 72ch;
}
```

Without this, body text becomes 200-character lines on 4K monitors.

#### 7. Body text ≥ 16px at every breakpoint

```css
body { font-size: 16px; }
/* OR */
body { font-size: 18px; }

/* Never drop body text below 16px in media queries */
@media (max-width: 480px) {
  body { font-size: 16px; }  /* still ≥ 16px */
}
```

Smaller is fine for captions, footnotes, code annotations — never for body prose.

#### 8. `prefers-reduced-motion` guard

All keyframe animations and CSS transitions must be disabled when the user has reduced-motion enabled. Put this block once, near the end of your `<style>`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

If you have any JS-driven animation (`requestAnimationFrame` loops, IntersectionObserver-triggered animations), gate them on:

```js
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduceMotion) { /* start animation */ }
```

#### 9. Outbound links use `target="_blank" rel="noopener noreferrer"`

```html
<a href="https://example.com" target="_blank" rel="noopener noreferrer">External link</a>
```

The sandbox includes `allow-popups-to-escape-sandbox`, which makes `target="_blank"` the correct pattern for external navigation — clicked links open in a new tab that loads normally, without inheriting the sandbox. Without `target="_blank"`, the click is silently blocked because `allow-top-navigation` is absent.

#### 10. No storage, cookies, or parent-frame reads

Do not call:

- `localStorage.*`, `sessionStorage.*`, `document.cookie`, `indexedDB.*`
- `window.parent.*`, `window.top.*` (the portal does not listen)
- `navigator.clipboard.read*` (requires user gesture in a less-restricted context)

If you need persistence within the page lifetime, use plain JS variables. The artifact is stateless across reloads — that's the design.

#### 11. Single self-contained file

```html
<!-- ALL CSS inline -->
<style> /* ... */ </style>

<!-- ALL JS inline -->
<script> /* ... */ </script>

<!-- Images: inline data: URIs OR HTTPS CDN URLs -->
<img src="data:image/svg+xml;utf8,<svg ...>"   alt="...">
<img src="https://cdn.example.com/logo.png"    alt="...">

<!-- Fonts: Google Fonts is fine (HTTPS, ?display=swap) -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">

<!-- Scripts/icons: ESM from a public CDN is fine -->
<script type="module">
  import { createIcons, Home } from 'https://esm.sh/lucide@latest';
</script>

<!-- DO NOT use relative paths -->
<link rel="stylesheet" href="./styles.css">    <!-- BROKEN -->
<script src="./app.js"></script>               <!-- BROKEN -->
<img src="/images/hero.png">                   <!-- BROKEN -->
```

Two additional rules for external URLs:

- **HTTPS only.** Every external `<link>`, `<script src>`, `<img src>`, and font URL must use `https://`. Mixed-content blocking is silent in some browsers — `http://` CDN references will silently fail.
- **No copy-pasted SRI hashes.** See Reference → Sandbox gotchas for why `integrity=` attributes silently break when hashes rot.

There is no companion asset bucket — anything not inline or on a public HTTPS URL is a broken reference.

### Strong recommendations

Should be present in every artifact. Skip only with a documented `<!-- design-contract: skip ... reason=... -->` comment.

#### OpenGraph meta tags

Makes shared URLs produce rich previews in Slack, iMessage, Discord, etc.

```html
<meta property="og:title"       content="Q2 Growth Report">
<meta property="og:description" content="Weekly revenue summary for Q2 2026.">
<meta property="og:type"        content="article">
<meta property="og:image"       content="https://cdn.example.com/preview.png">
```

Skip pattern:

```html
<!-- design-contract: skip og-tags reason=internal-not-shared -->
```

#### Contrast ≥ 4.5:1 for body text (WCAG AA)

Use a contrast checker. Secondary/decorative text (captions, footers, watermarks) may fall below if clearly non-essential to comprehension.

#### Touch targets ≥ 36px

Interactive elements (`<a>`, `<button>`, custom controls) should be at least 36×36px on touch viewports. A common pattern:

```css
button, a.button, .clickable {
  min-height: 36px;
  min-width: 36px;
  padding: 8px 16px;
}
```

#### Semantic HTML

- Exactly one `<h1>` per artifact.
- Headings in order: `h1 → h2 → h3`, no skipping levels.
- Real `<a>` for navigation, real `<button>` for actions. Don't use `<div onclick>`.
- Use `<main>`, `<article>`, `<section>`, `<nav>`, `<header>`, `<footer>` where they fit.

#### Google Fonts with `&display=swap`

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
```

Without `display=swap`, text is invisible until the font loads. See Reference: External Resources → Fonts for the full font catalog including the Geist substitution note.

### Source Provenance

Source material — the input(s) that generated the artifact — belongs in the HTML, not in the database. The artifact should be self-contained enough that you can read it in isolation and know where it came from. Whether and how prominently to include provenance depends on the artifact's category.

#### Per-category guidance

| Category | Placement | Requirement |
|---|---|---|
| **review** | Top, immediately after title/abstract | **Mandatory.** A code review without a commit SHA or PR reference is uninterpretable at 6 months. Minimum: one `<code>` element with a commit SHA or PR URL. |
| **report** | Top, as a "Sources" or "Based on" note before the first section | **Expected.** The claim of a report is only as good as its inputs — what was analyzed, when, and from where. |
| **spec** | Bottom, as a "Context" or "Background" section, or omitted | **Optional.** Specs are forward-looking; their sources are often conversations or problem statements. Prose context is more honest than a structured list. |
| **prototype** | Inline or omitted | **Situational.** If the prototype implements a spec in the portal, link it. Otherwise, let the prototype speak for itself. |
| **other** | Author's discretion | — |

#### Markup convention

Use a `<section>` with a descriptive label. Keep it visually subordinate to the artifact's main content — smaller text, muted color, monospace for refs:

```html
<section aria-labelledby="sources-heading">
  <h2 id="sources-heading">Sources</h2>
  <ul>
    <li>
      <a href="https://github.com/org/repo/commit/abc1234" target="_blank" rel="noopener noreferrer">
        <code>abc1234</code>
      </a> — auth refactor, 2026-05-10
    </li>
    <li>
      <a href="https://github.com/org/repo/pull/42" target="_blank" rel="noopener noreferrer">PR #42</a>
      — session token storage compliance
    </li>
  </ul>
</section>
```

For a review or report at the top, a compact metadata line before the first `<h2>` works well:

```html
<p class="provenance">
  Based on
  <a href="https://github.com/..." target="_blank" rel="noopener noreferrer"><code>abc1234</code></a>
  (<code>feature/auth-refactor</code> → <code>main</code>), reviewed 2026-05-11.
</p>
```

#### Source quality rules

- **Git refs: prefer commit SHAs over branch names.** Branches move; SHAs are permanent. On GitHub use `/blob/<sha>/path` over `/blob/main/path`.
- **URLs rot.** If a source URL is load-bearing, quote the relevant content inline — title, key passage, date accessed — rather than relying on the link surviving.
- **Do not use session or conversation IDs as provenance.** A Claude session ID points to something unretrievable. Embed the relevant context (brief, decision, key constraint) inside the document itself.
- **Syndicated content requires visible in-HTML attribution.** If an artifact adapts or derives from someone else's work, the attribution must appear in the HTML document — not only in portal metadata, tags, or session notes.

---

### Design freedom (do NOT default to portal aesthetic)

The portal's own UI is dark, but **that does not mean your artifacts should be dark**. The portal aesthetic is for the portal chrome only; each artifact is its own world. Choose freely:

- **Color palette** — any palette. Light, dark, pastel, neon, monochrome, brutalist black-on-white.
- **Typography** — any font from the Reference catalog or a system stack. Serif essays, monospace dashboards, display-faced posters.
- **Layout** — single column, magazine grid, full-bleed hero, split-screen, scroll-jacked narrative. Whatever serves the content.
- **Motion and animation** — use freely, subject to the `prefers-reduced-motion` guard above.
- **Information density** — a sparse one-quote essay or a data-dense dashboard are both fine.
- **Visual language** — be opinionated. A Q2 finance report does not have to look like a code review which does not have to look like a poem.

Resist the temptation to copy the portal's tokens. The reader can already see the portal — your artifact should feel like something different opened it.

---

### Compliance checklist (verify before publishing)

Hard requirements — all must be true:

- [ ] `<!DOCTYPE html>`, `<html lang="en">`, `<meta charset>`, `<meta viewport>`, `<title>` matches publish title
- [ ] `<meta name="color-scheme" content="...">` declared
- [ ] `<!-- design-contract: v1 -->` near top of `<head>`
- [ ] `html, body { min-height: 100%; }` and body has opaque background
- [ ] `body { overflow-x: hidden; }`; wide blocks (`pre`, tables, etc.) scroll inside themselves
- [ ] Top-level layout ≤ 1600px; prose ≤ 72ch
- [ ] Body font-size ≥ 16px at every breakpoint
- [ ] `@media (prefers-reduced-motion: reduce)` block disables animations/transitions
- [ ] All external `<a>` use `target="_blank" rel="noopener noreferrer"`
- [ ] No `localStorage` / `sessionStorage` / cookies / `window.parent` reads
- [ ] Single file: all CSS inline, all JS inline, no relative paths, images inline or HTTPS
- [ ] All external URLs use `https://` (no `http://` CDN references)
- [ ] No copy-pasted `integrity=` SRI hashes (omit unless you computed it for a pinned version)
- [ ] Adaptive: `portal:theme` postMessage listener + `[data-scheme]` CSS with both light and dark palettes

Strong recommendations — present or explicitly skipped with comment:

- [ ] OpenGraph tags OR skip comment
- [ ] Body text contrast ≥ 4.5:1
- [ ] Interactive elements ≥ 36px touch target
- [ ] One `<h1>`, ordered headings, semantic elements
- [ ] Google Fonts URLs include `&display=swap`

Source provenance — per-category:

- [ ] **review**: commit SHA or PR ref present, at top
- [ ] **report**: sources/inputs noted at top
- [ ] **spec**: context section at bottom (or explicitly omitted)
- [ ] **syndicated content**: visible in-HTML attribution to original author/source

### Minimal compliant template

A copy-paste starting point that satisfies every hard requirement:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <title>Artifact Title</title>
  <!-- design-contract: v1 -->
  <meta property="og:title" content="Artifact Title">
  <meta property="og:description" content="One-sentence summary.">
  <meta property="og:type" content="article">
  <script>
    (function(){
      var d = document.documentElement;
      d.setAttribute('data-scheme', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      try { window.parent.postMessage({ type: 'portal:theme:request' }, '*'); } catch {}
      window.addEventListener('message', function(e){
        if (e.data && e.data.type === 'portal:theme' && (e.data.theme === 'light' || e.data.theme === 'dark'))
          d.setAttribute('data-scheme', e.data.theme);
      });
    })();
  </script>
  <style>
    :root {
      color-scheme: light;
      --bg: #ffffff;
      --fg: #14110f;
      --muted: #5c5a55;
      --accent: #d8421b;
    }
    [data-scheme="dark"] {
      color-scheme: dark;
      --bg: #0c0e14;
      --fg: #ede9e3;
      --muted: #9a968f;
    }
    *, *::before, *::after { box-sizing: border-box; }
    html, body { min-height: 100%; margin: 0; }
    body {
      background: var(--bg);
      color: var(--fg);
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
      font-size: 16px;
      line-height: 1.6;
      overflow-x: hidden;
      max-width: 1600px;
      margin: 0 auto;
      padding: 48px 24px;
    }
    main { max-width: 72ch; margin: 0 auto; }
    pre, code { overflow-x: auto; max-width: 100%; }
    img, svg, video, iframe { max-width: 100%; height: auto; }
    a { color: var(--accent); }
    button, a.button {
      min-height: 36px;
      padding: 8px 16px;
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }
  </style>
</head>
<body>
  <main>
    <h1>Artifact Title</h1>
    <p>Body content goes here.</p>
    <p>External links use
      <a href="https://example.com" target="_blank" rel="noopener noreferrer">target=_blank</a>.
    </p>
  </main>
</body>
</html>
```

---

## Gotchas

- **Iframe background bleeds through transparent artifact bodies** — always set an opaque `body { background }` plus `html, body { min-height: 100%; }`. This is a hard requirement in the Design Contract.
- **`prefers-color-scheme` does not propagate into sandboxed iframes.** Setting `color-scheme` on the portal's `:root` or on the `<iframe>` element has no effect on `prefers-color-scheme` media queries inside artifacts. Sandboxed iframes without `allow-same-origin` are treated as opaque-origin documents by all major browsers. Use the `portal:theme` postMessage protocol instead — see Adaptive color scheme above.
- **`@media (prefers-color-scheme)` is retired as the primary adaptive mechanism.** Use `[data-scheme]` attribute selectors driven by the postMessage listener. The media query may be kept as a standalone fallback (for direct file opens), but must not be the only mechanism — the portal cannot override it.
- **Adaptive color is a hard requirement — `design-contract: skip adaptive-color` is no longer valid.** Agents have full design freedom over the light and dark palettes, but both modes must exist. A fixed-scheme artifact that skips adaptive-color will need to be retroactively updated.
- **Theme handshake: artifact posts `portal:theme:request`, Viewer responds with `portal:theme`.** The required pattern fires `window.parent.postMessage({ type: 'portal:theme:request' }, '*')` inside the IIFE in `<head>`. The Viewer registers its inbound listener before loading the artifact into the iframe, so the request is always caught and answered immediately — no timed retry burst needed. Older artifacts that omit the request still receive the theme via the Viewer's `load`-event fallback, but may see a brief flash of the OS-preference default on fast cached loads.

- **`portal:theme` payload property is `e.data.theme`, not `e.data.scheme`.** The portal sends `{ type: 'portal:theme', theme: 'light'|'dark' }`. An artifact checking `e.data.scheme` always gets `undefined`, so the condition is never true and the artifact stays in its default scheme regardless of the portal's toggle. When debugging an artifact that ignores theme switching, check the message listener property name first.
- **Interlink URLs must be root-relative, never absolute.** Use `/a/slug`, `/p/slug`, or `/share/token` — never `http://localhost:3000/...` or a hardcoded LAN IP. Absolute URLs break when the portal is accessed from another device. Root-relative paths inherit the host automatically. Observed: stock-research brief linked to `http://localhost:3000/a/rddt-...` which resolved correctly on the Mac but went to localhost when accessed from another device at `10.0.5.10:3000`.
- **Long inline `code` elements overflow mobile layout.** Inline `<code>` containing long identifiers or paths (>~39 chars on a 360px viewport with card padding) pushes the layout wider than the viewport. Fix: add `overflow-wrap: anywhere; word-break: break-all` to `:not(pre) > code`. Also add `overflow-wrap: break-word` to `body` as a global fallback, and `min-width: 0` to any `pre` inside a grid or flex container. Table cells need `overflow-wrap: break-word; word-break: break-word` too. `body { overflow-x: hidden }` does not prevent this — it clips visually but the layout is still broken.

- **When linting CSS with regex, always use whitespace-tolerant patterns.** CSS minifiers strip spaces around colons: `overflow-x:hidden`, `min-height:100%`. All property checks must use `/property-name\s*:\s*value/i`, never literal string includes.
- **`background` declaration present ≠ opaque background.** `background: transparent` or `background-color: rgba(0,0,0,0)` both contain the word "background" but violate the opaque-background rule. Static analysis must explicitly detect `transparent` and `rgba(...,0)` patterns.
- **`href="#anchor"` is not a relative path.** Fragment links, `mailto:`, `tel:`, and `blob:` URIs are valid in the sandbox. Exclude them from relative-path checks. Anchor the match to `\s(src|href)=` to avoid false positives on `xlink:href` in SVG.
- **HTML attribute regex must match single and double quotes.** Some template engines and agent output use single-quoted attributes (`href='https://...'`). Always use `["']` in attribute value captures.

---
For API operations (publish, update, delete, share, validate), see `SKILL.md` in this directory.
