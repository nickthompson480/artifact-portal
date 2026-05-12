---
id: ws-settings-view
title: Settings view — API keys, portal title, public index, appearance
state: pending
depends_on: [ws-design-system, ws-owner-api]
summary: `<SettingsView />` at `/settings`. Three sections: Portal (title + public index toggle), API Keys (list, create, revoke), Appearance (theme/density/rightPane).
phase: 3
---

## What done looks like

### Layout
- Single scrollable column, max-width 760, padding 24.
- Section headers: DM Serif Display italic 22px, color `var(--text2)`. Below: `var(--border)` divider.

### Portal section
- `Portal title` text input → `PATCH /settings` on blur (debounced 500ms while typing).
- `Public index` toggle switch → `PATCH /settings { key:'public_index_enabled', value:'true'|'false' }`.
  - Visual: 36×20 track, 14×14 knob. Off: `bg var(--bg3)`, knob `var(--text3)`. On: `bg var(--cat-teal-bg)`, border `var(--cat-teal-bd)`, knob `var(--cat-teal)`.
  - Caption beneath: "Anyone can list public artifacts at /public" / "/public is disabled".

### API Keys section
- List rows: `name` (DM Sans 13px / 500) · `pk_live_XXXXXXXX••••••••` (mono 11px var(--text3)) · `Last used 3h ago` (mono 10px var(--text3)) · `[Revoke]` IconBtn (or `Revoked` badge if revoked_at set).
- Create row at bottom: name input + `[+ Create key]` IconBtn.
- On create success:
  - Amber callout above the list: `bg var(--cat-amber-bg)`, border `var(--cat-amber-bd)`, padding 14/18, radius 8.
  - Contains the plaintext `pk_live_…` in mono + `[Copy]` button + caption "Save this now — it won't be shown again."
  - Auto-dismiss after 20s (or on Copy + 2s).
- Revoke: optimistic UI (grey out + Revoked badge) + `DELETE /settings/api-keys/:id`. On error, restore.

### Appearance section
- `Theme`: Dark / Light radio (segmented). Updates store + `data-theme` attr.
- `Density`: Comfortable / Compact radio (segmented). Updates store.
- `QUHD right pane`: toggle. Disabled with caption "Available at ≥1920px" if `window.innerWidth < 1920`.

## Key files

- `src/views/Settings.jsx`
- Sub-components: `Section`, `Toggle`, `Segmented`, `KeyRow`.

## Acceptance

1. Create a key → callout shows plaintext; reload page → callout gone, key listed with prefix.
2. Revoke → row shows "Revoked" badge; row stays for audit (not removed).
3. Toggle public index → /public route enabled/disabled live.
4. Switch theme → entire UI re-themes instantly.
5. Switch density → cards across Feed/Browse re-render with tighter padding.

## Out of scope

- Trash view (deferred — can show under Settings later)
- Multi-user / role mgmt
