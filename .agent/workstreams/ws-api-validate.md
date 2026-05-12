---
id: ws-api-validate
title: POST /api/validate — Design Contract linter endpoint
state: active
depends_on: []
summary: Server endpoint that accepts an HTML file, runs it through the Design Contract v1 checklist, and returns structured findings (errors, warnings). Enables agents to pre-validate before publishing.
phase: 5
---

## What done looks like

`POST /api/validate` is live on the server, protected by `requireApiKey`, accepting the same multipart payload as `POST /api/artifacts`. Returns a JSON findings report — `valid` bool + array of findings with `severity`, `rule`, `message`. Documented in CLAUDE.md.

```bash
printf '%s' "$HTML" | curl -X POST "$PORTAL_URL/api/validate" \
  -H "X-API-Key: $PORTAL_KEY" \
  -F "file=@-;filename=artifact.html" \
  -F "title=My Report"
# → { "valid": false, "findings": [...] }
```

## Checks implemented

### Hard requirements → `error`
1. `html5-shell` — DOCTYPE, `<html lang`, `<meta charset`, `<meta viewport`, `<title>`
2. `design-contract-stamp` — `<!-- design-contract: v1 -->` in head
3. `color-scheme-meta` — `<meta name="color-scheme"` present
4. `opaque-background` — body has a `background` or `background-color` property
5. `body-min-height` — `min-height: 100%` in html/body CSS
6. `overflow-x-hidden` — `overflow-x: hidden` present
7. `ultra-wide-clamp` — 1600px max-width + 72ch prose cap
8. `min-font-size` — body font-size ≥ 16px
9. `prefers-reduced-motion` — `@media (prefers-reduced-motion: reduce)` block
10. `external-links` — external `<a>` have `target="_blank"` and `rel="noopener noreferrer"`
11. `no-storage-access` — no `localStorage`, `sessionStorage`, `document.cookie`, `window.parent` in inline scripts
12. `single-file` — no relative `src`/`href` paths (`./`, `../`, `/` without leading `/`)
13. `https-only` — no `http://` external resource URLs
14. `adaptive-color` — `portal:theme` listener + `[data-scheme=` CSS both present

### Strong recommendations → `warning`
1. `og-tags` — `<meta property="og:title"` or skip comment
2. `google-fonts-display-swap` — Google Fonts URLs include `&display=swap`
3. `one-h1` — exactly one `<h1>` element
4. `heading-order` — h2/h3 not appearing before their parent level
5. `no-sri-hashes` — `integrity=` attributes (copy-paste hashes silently break)

### Optional title check → `error`
- `title-match` — `<title>` content matches provided `title` field (if supplied)

## Scope constraints

- **Regex-based static analysis only.** No headless browser, no CSS parser. All CSS checks are best-effort approximations; note this in API docs.
- **No DB writes.** Validate is stateless — no artifact row created.
- **Same auth as publish** — `requireApiKey` required.
- **Always returns HTTP 200** — status reflects linting success, not HTML validity. `valid: false` means hard requirements failed.
- **Skill update only** — no frontend UI for this in Phase 5 scope.
