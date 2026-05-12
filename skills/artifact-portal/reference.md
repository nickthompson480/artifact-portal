# Reference: External Resources

> **Last spot-checked**: 2026-05-12. If a CDN or font URL fails silently, treat this catalog as potentially stale and verify before substituting.

The sandbox permits `allow-scripts` and unauthenticated HTTPS fetches. CDN static assets — JS, CSS, fonts, icon webfonts — are unauthenticated GETs, which is exactly what the sandbox allows. All four CDNs listed below return `Access-Control-Allow-Origin: *` and work with the iframe's `null` origin. What fails is anything requiring credentials, a specific `Allow-Origin` host, same-origin storage, popups, or top-navigation.

Pick one CDN per artifact and stick with it. Don't mix four CDNs in one file.

## Fonts

| Source | Load pattern | Notes |
|---|---|---|
| Google Fonts | `<link href="https://fonts.googleapis.com/css2?...&display=swap">` | Always add `&display=swap`. Variable font axes supported. |
| System stack | `font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif` | No network call, always available. |
| Google Material Symbols | `<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&display=swap">` | Icon font via same mechanism as Google Fonts. |
| Other hosted fonts | Any `https://` URL with `Access-Control-Allow-Origin: *` | Verify CORS before using; most self-hosted fonts fail. |

**Geist Sans and Geist Mono are not on Google Fonts.** They are Vercel fonts distributed via npm — no CDN-linkable URL exists. Do not attempt `unpkg.com/geist` or `fonts.vercel.com` — they will 404. Substitutes: **Inter** for Geist Sans, **JetBrains Mono** for Geist Mono. Both are on Google Fonts and visually close.

## Icons

| Set | Load mechanism | Notes |
|---|---|---|
| Lucide | ESM via `esm.sh` or `cdn.jsdelivr.net` | Modern, tree-shakeable, works in `<script type="module">` |
| Phosphor | ESM via `esm.sh` | Multiple weights; similar ESM API |
| Feather | UMD via `cdn.jsdelivr.net` | Lightweight, classic set |
| Tabler | ESM or sprite SVG via `cdn.jsdelivr.net` | 5000+ icons |
| Font Awesome Free | CSS+webfont via `cdnjs.cloudflare.com` | Load the CSS; icons render via `<i>` tags |
| Material Symbols | CSS icon font via Google Fonts (see above) | Variable font axes for fill/weight/grade |
| Inline SVG / data URIs | No external dependency | Always safest; zero network call |

Lucide ESM example (works in `allow-scripts` sandbox):

```html
<script type="module">
  import { createIcons, Zap, BarChart2, FileText } from 'https://esm.sh/lucide@latest';
  document.addEventListener('DOMContentLoaded', () => createIcons());
</script>
<!-- Usage: <i data-lucide="zap"></i> -->
```

## JavaScript libraries

| Library | CDN | Module pattern |
|---|---|---|
| Chart.js | `cdn.jsdelivr.net/npm/chart.js` | UMD global or ESM |
| D3 | `cdn.jsdelivr.net/npm/d3` | ESM via `import * as d3 from '...'` |
| Alpine.js | `cdn.jsdelivr.net/npm/alpinejs` | UMD, auto-initializes on load |
| Petite-vue | `cdn.jsdelivr.net/npm/petite-vue` | ESM, lightweight reactive templating |
| Preact | `esm.sh/preact` | ESM, full JSX-capable UI in ~4 KB |

ESM import map example (place in `<head>` before any module scripts):

```html
<script type="importmap">
{
  "imports": {
    "chart.js": "https://cdn.jsdelivr.net/npm/chart.js/+esm",
    "d3": "https://cdn.jsdelivr.net/npm/d3/+esm"
  }
}
</script>
<script type="module">
  import { Chart, registerables } from 'chart.js';
  Chart.register(...registerables);
  // use Chart normally
</script>
```

## CDN options

- **`esm.sh`** — best for arbitrary npm packages as ESM; rewrites CJS, resolves deps, returns `Access-Control-Allow-Origin: *`.
- **`cdn.jsdelivr.net`** — good for both npm and GitHub; supports versioned paths; `+esm` suffix for ESM output.
- **`unpkg.com`** — simplest npm mirror; occasional rate limits under heavy load.
- **`cdnjs.cloudflare.com`** — curated list (Chart.js, D3, Font Awesome, etc.); fast, but only what they host.

## Sandbox gotchas for external resources

- **Import maps must appear before any `<script type="module">` that uses them.** Place the `<script type="importmap">` block in `<head>`, before your module scripts, or bare specifier imports will throw.
- **The sandboxed iframe has a `null` origin.** Any CDN that gates on a specific `Access-Control-Allow-Origin` host will reject it. All four CDNs above return `*` — but less common CDNs may not. If a library silently fails to load, CORS is the first thing to check.
- **`document.fonts.ready` works; the `FontFace` constructor with a remote `url()` may not.** Google Fonts sends `Access-Control-Allow-Origin: *`. Self-hosted fonts on a random domain often don't — test before using.
- **Subresource Integrity (`integrity=`) blocks resources silently if the hash is wrong.** Hashes in old documentation rot as CDN files update. Don't use SRI unless you computed the hash yourself for a pinned version — it's a common silent-fail mode.
- **`navigator.clipboard.writeText` works from a user gesture. `clipboard.readText` and `clipboard.read` do not** — the sandbox doesn't grant clipboard-read permission. "Copy to clipboard" buttons are fine; "paste from clipboard" is not.

---
For Design Contract requirements, see `design-contract.md`. For API operations, see `SKILL.md`.
