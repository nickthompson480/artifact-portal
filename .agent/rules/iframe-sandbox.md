---
id: iframe-sandbox
statement: The artifact viewer iframe must use sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" and must NOT include allow-same-origin. Artifact HTML is never injected into the portal DOM.
severity: critical
checkable: true
---

## Why

Artifacts are HTML uploaded by agents — they execute arbitrary scripts. They must not be able to:

- Read the parent document's cookies (which carry `auth_token`)
- Touch `localStorage` / `sessionStorage` of the portal origin
- Make same-origin XHRs against `/artifacts/...` and exfiltrate data

`sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"` (without `allow-same-origin`) puts the iframe in a unique opaque origin. Scripts run, but they have no access to anything that matters. Adding `allow-same-origin` defeats this.

`allow-popups` is required for `target="_blank"` links to work — without it the browser silently blocks all link clicks. `allow-popups-to-escape-sandbox` lets the new tab load normally (without it, the opened tab would also be sandboxed, breaking most sites).

Equally, the artifact HTML must reach the iframe as `srcDoc` (or via the `/artifacts/:id/file` endpoint loaded as `src`). It must never be rendered via `dangerouslySetInnerHTML` in a portal React component.

## How to check

```bash
# Should appear with allow-scripts allow-popups allow-popups-to-escape-sandbox, no allow-same-origin
rg -n 'sandbox=' frontend/src

# Forbidden in the portal UI (artifact content must not be injected into portal DOM):
rg -n 'dangerouslySetInnerHTML' frontend/src
# expect: zero matches (or only inside a tightly scoped test/preview)
```

## Remediation

If an artifact appears blank because of missing capabilities, do NOT add `allow-same-origin`. Acceptable additions if absolutely needed: `allow-forms`, `allow-popups`, `allow-popups-to-escape-sandbox`. Discuss before changing.
