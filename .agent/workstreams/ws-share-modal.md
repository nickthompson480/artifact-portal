---
id: ws-share-modal
title: Share modal — visibility radio, expiry, password, copy link
state: pending
depends_on: [ws-design-system]
summary: ShareModal component, mounted at App level, opened via `openShare(artifact)`. Live URL preview, copy-to-clipboard with state.
phase: 2
---

## What done looks like

### Mounting

- Mounted in `App.jsx` (so it can be opened from feed, viewer, browse anywhere).
- `useStore(s => s.shareOpen, s.shareTarget)` controls visibility.
- Backdrop click or Esc → `closeShare()`.

### Layout
- Backdrop: `rgba(0,0,0,.55) + blur(4px)`, z 300.
- Modal: centered 460px (max calc(100vw - 32px)), `bg var(--bg2)`, border `var(--border2)`, radius 14, shadow `0 24px 80px rgba(0,0,0,.6)`, z 400.
- Header: `SHARE ARTIFACT` mono uppercase eyebrow + artifact title + `×` close button.
- Body sections:
  1. **Visibility** (radio): private / unlisted / public. Each row a clickable label with radio + name + caption. Selected row → `bg var(--bg3)`, `border var(--border2)`.
  2. **Link expiry** (only when unlisted): button tabs `never / 24h / 7d / 30d`.
  3. **▸ More options** (only when unlisted): expands to password input.
  4. **URL preview**: a code-style row showing the live URL. Color teal when copyable, text3 when private.
  5. **Copy button**: full-width, disabled when private. On click → `navigator.clipboard.writeText(url)`, swap label to `✓ Copied!` for 2s.

### Server effects

- Visibility change: `PATCH /artifacts/:id { visibility }` immediately.
- Selecting `unlisted` without existing token: `POST /artifacts/:id/share-token` → use returned `token` in URL preview.
- Changing away from `unlisted`: `DELETE /artifacts/:id/share-token` (best-effort, ignore 404).
- Password and expiry are passed as body to `POST /artifacts/:id/share-token` when present. Server enforcement is v2 — UI still saves them.
- All mutations debounced 250ms to avoid thrashing on quick radio clicks.

### URL preview values

- `private` → "Not accessible via URL (private)"
- `unlisted` → `<base>/share/<token>`
- `public` → `<base>/p/<slug>`

`<base>` is `window.location.origin` by default; overridden by `PUBLIC_BASE_URL` if set (exposed by server at `GET /me` response).

## Key files

- `src/views/ShareModal.jsx`

## Acceptance

1. Open share modal from a feed card's Share button → modal animates in.
2. Toggle to unlisted → backend POSTs to share-token → URL preview shows real token.
3. Copy button copies the URL; pasting in a new tab loads the artifact via the public route.
4. Toggle back to private → token is revoked; URL preview reverts.
5. Esc and backdrop click both close.

## Out of scope

- Server-side enforcement of password / expiry (v2)
- Sharing analytics (ws-analytics)
