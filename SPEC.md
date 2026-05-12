# SPEC — Artifact Portal

## 1. What this is

A self-hosted web portal where AI agents publish HTML artifacts (specs, reports, prototypes, code reviews, dashboards) via a REST API. The owner — a single human user — browses, tags, shares, and manages these artifacts through a dark-themed React SPA served by the same Express server.

Single user. Single machine. No managed cloud services, no PM2, no Nginx, no SSL — this is a localhost product. Sharing happens via the local network or via temporary tunnels (out of scope for this project — the share URLs are written as `portal.local` placeholders).

The visual design is locked: dark-first, DM Serif Display + DM Sans + DM Mono, with five category accent colors. Token values are defined in `frontend/src/styles/colors_and_type.css` and must be used exactly.

## 2. Stack & target

| | |
|---|---|
| Runtime | Node.js 20 LTS |
| Server | Express 5 |
| DB | SQLite via `better-sqlite3`, FTS5 enabled |
| Auth | `bcryptjs` + `jsonwebtoken`, httpOnly cookie, 7-day expiry |
| Agent auth | `X-API-Key` header, bcrypt-hashed in DB |
| File store | Local filesystem at `~/.artifact-portal/files/<uuid>.html` |
| Frontend | React 18 + React Router 6 + Vite |
| Build output | `public/` (Express serves it as static) |
| Target | Localhost — no VPS, no PM2, no Nginx |

## 3. Project structure

```
artifact-portal/
├── server.js                       # Express entry, mounts routes, serves /public
├── package.json
├── .env.example
├── .gitignore
├── CLAUDE.md
├── SPEC.md
├── README.md
├── .agent/                         # workstream + decision state
│
├── db/
│   ├── schema.sql                  # full DDL (run on first start)
│   └── migrate.js                  # idempotent migration runner
│
├── lib/
│   ├── db.js                       # better-sqlite3 singleton + helpers
│   ├── files.js                    # read/write/delete artifact files
│   ├── slug.js                     # title -> slug, collision handling
│   ├── ids.js                      # UUID v4
│   └── config.js                   # env + ~/.artifact-portal/ resolution
│
├── middleware/
│   ├── auth.js                     # cookie/JWT verification
│   ├── apiKey.js                   # X-API-Key verification + bcrypt compare
│   ├── upload.js                   # multer config for multipart
│   └── error.js                    # unified error envelope
│
├── routes/
│   ├── auth.js                     # POST /login, POST /logout
│   ├── artifacts.js                # owner CRUD + share-token + file streaming
│   ├── api.js                      # agent endpoints (/api/artifacts/*)
│   ├── share.js                    # public /share/:token, /p/:slug, /public
│   └── settings.js                 # /settings + /settings/api-keys
│
├── public/                         # built React SPA (Vite output) - generated
│
└── frontend/
    ├── package.json
    ├── vite.config.js              # proxy /artifacts, /api, /settings, /login to :4567
    └── src/
        ├── main.jsx
        ├── App.jsx                 # Router + shell
        ├── styles/
        │   └── colors_and_type.css # design token source of truth
        ├── data/
        │   └── api.js              # fetch wrappers
        ├── state/
        │   └── store.js            # Zustand store + localStorage persistence
        ├── components/
        │   ├── CategoryBadge.jsx
        │   ├── TagChip.jsx
        │   ├── AgentBadge.jsx
        │   ├── VisibilityDot.jsx
        │   ├── IconBtn.jsx
        │   ├── FeedCardRich.jsx
        │   ├── FeedCardCompact.jsx
        │   ├── BrowseCard.jsx
        │   ├── Sidebar.jsx
        │   ├── MobileTabBar.jsx
        │   └── SectionLabel.jsx
        ├── views/
        │   ├── Feed.jsx            # /
        │   ├── Browse.jsx          # /browse
        │   ├── Viewer.jsx          # /a/:id
        │   ├── Settings.jsx        # /settings
        │   ├── Login.jsx           # /login
        │   ├── SearchOverlay.jsx   # ⌘K
        │   ├── ShareModal.jsx
        │   └── PublicIndex.jsx     # /public (no auth, optional)
        └── utils/
            ├── format.js           # formatSize, timeLabel, dayKey
            └── groupBy.js
```

**Explicitly absent (vs. the original design handoff):**
- No `ecosystem.config.js` (no PM2)
- No `nginx.conf` (no reverse proxy)
- No `Dockerfile`, no `docker-compose.yml`
- No CI deploy workflow targeting a VPS

## 4. Database schema

```sql
-- ── artifacts ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS artifacts (
  id            TEXT PRIMARY KEY,        -- UUID v4
  title         TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,    -- derived from title; suffix on collision
  description   TEXT,
  tags          TEXT NOT NULL DEFAULT '[]',  -- JSON array of strings
  category      TEXT NOT NULL DEFAULT 'other'
                 CHECK (category IN ('spec','report','prototype','review','other')),
  visibility    TEXT NOT NULL DEFAULT 'private'
                 CHECK (visibility IN ('private','unlisted','public')),
  share_token   TEXT,                    -- UUID, for /share/:token URLs (NULL if not shared)
  share_expires_at TEXT,                 -- ISO 8601 or NULL (v2)
  share_password_hash TEXT,              -- bcrypt or NULL (v2)
  pinned        INTEGER NOT NULL DEFAULT 0 CHECK (pinned IN (0,1)),
  file_path     TEXT NOT NULL,           -- relative: files/<id>.html
  file_size     INTEGER NOT NULL DEFAULT 0,
  published_by  TEXT NOT NULL DEFAULT 'manual',
  created_at    TEXT NOT NULL,           -- ISO 8601
  updated_at    TEXT NOT NULL,
  deleted_at    TEXT                     -- soft delete; NULL = active
);

CREATE INDEX IF NOT EXISTS idx_artifacts_created ON artifacts(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_artifacts_share   ON artifacts(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_artifacts_slug    ON artifacts(slug);
CREATE INDEX IF NOT EXISTS idx_artifacts_pinned  ON artifacts(pinned, created_at DESC) WHERE deleted_at IS NULL;

-- ── full-text search (title + description + tags) ───────────────────────
CREATE VIRTUAL TABLE IF NOT EXISTS artifacts_fts USING fts5(
  title, description, tags,
  content=artifacts,
  content_rowid=rowid
);

-- triggers keep FTS in sync
CREATE TRIGGER IF NOT EXISTS artifacts_ai AFTER INSERT ON artifacts BEGIN
  INSERT INTO artifacts_fts(rowid, title, description, tags)
  VALUES (new.rowid, new.title, new.description, new.tags);
END;
CREATE TRIGGER IF NOT EXISTS artifacts_ad AFTER DELETE ON artifacts BEGIN
  INSERT INTO artifacts_fts(artifacts_fts, rowid, title, description, tags)
  VALUES('delete', old.rowid, old.title, old.description, old.tags);
END;
CREATE TRIGGER IF NOT EXISTS artifacts_au AFTER UPDATE ON artifacts BEGIN
  INSERT INTO artifacts_fts(artifacts_fts, rowid, title, description, tags)
  VALUES('delete', old.rowid, old.title, old.description, old.tags);
  INSERT INTO artifacts_fts(rowid, title, description, tags)
  VALUES (new.rowid, new.title, new.description, new.tags);
END;

-- ── api_keys ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_keys (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  key_hash      TEXT NOT NULL,           -- bcrypt(plaintext)
  key_prefix    TEXT NOT NULL,           -- first 8 chars for display
  created_at    TEXT NOT NULL,
  last_used_at  TEXT,
  revoked_at    TEXT                     -- NULL = active
);

-- ── settings ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO settings VALUES ('portal_title', 'Artifact Portal');
INSERT OR IGNORE INTO settings VALUES ('public_index_enabled', 'false');
INSERT OR IGNORE INTO settings VALUES ('password_hash', '');  -- set on first /login
```

## 5. Authentication

### Owner — single password, JWT cookie

- One password. `settings.password_hash` holds bcrypt. On first start, if `password_hash` is empty, the server exposes a one-shot `POST /setup` route (gated behind `password_hash = ''`) that accepts a password and bcrypts it. After that the route is inert.
- `POST /login` body `{ password }` — verifies bcrypt, signs JWT `{ role: 'owner', iat, exp }` (7-day TTL) with `JWT_SECRET`, sets cookie `auth_token` (HttpOnly, SameSite=Lax, Secure=false because localhost-only).
- `POST /logout` clears the cookie.
- Middleware `requireAuth` reads cookie, verifies JWT, attaches `req.user`; on failure returns `401 { code: 'UNAUTHORIZED' }`.

### Agent — X-API-Key header

- `POST /settings/api-keys` generates a 40-char random key (`pk_live_` + 32 url-safe chars), bcrypts it, stores hash + first-8-char prefix, returns plaintext to caller **once** with a `key` field. Subsequent reads only return `key_prefix`.
- Middleware `requireApiKey` reads `X-API-Key` header, iterates active rows (small N), `bcrypt.compare` against each, and on match updates `last_used_at` and attaches `req.apiKey`.
- Revocation sets `revoked_at` — revoked keys never match.

### Public — no auth

`/share/:token`, `/p/:slug` (if visibility=public), `/public` (only if `public_index_enabled='true'`).

## 6. API routes

### 6.1 Owner (cookie auth, `requireAuth`)

| Method | Route | Description |
|---|---|---|
| POST | `/setup` | One-shot: set password if none exists (returns 410 after) |
| POST | `/login` | `{ password }` → set cookie |
| POST | `/logout` | clear cookie |
| GET | `/me` | `{ ok: true }` if logged in (used by SPA for boot check) |
| GET | `/artifacts` | List; query: `tag`, `category`, `q`, `sort=newest\|oldest\|alpha\|size`, `pinned=0\|1`, `visibility`, `trash=1`, `limit`, `offset` |
| POST | `/artifacts` | multipart: `file` (HTML) + JSON metadata fields; returns full artifact |
| GET | `/artifacts/:id` | Single metadata row |
| PATCH | `/artifacts/:id` | Partial update: title, description, tags, category, visibility, pinned |
| DELETE | `/artifacts/:id` | Soft delete (sets `deleted_at`) |
| POST | `/artifacts/:id/restore` | Clears `deleted_at` |
| DELETE | `/artifacts/:id/permanent` | Hard delete: removes row + file (requires `?confirm=1`) |
| POST | `/artifacts/:id/share-token` | Generate/regenerate UUID token, optional `{ expires, password }` |
| DELETE | `/artifacts/:id/share-token` | Clear token, set visibility to private |
| GET | `/artifacts/:id/file` | Stream raw HTML (Content-Type: text/html) |
| GET | `/settings` | All key/value rows except `password_hash` |
| PATCH | `/settings` | `{ key, value }` (whitelist of editable keys) |
| GET | `/settings/api-keys` | List (never returns hash); shows prefix + last_used + revoked |
| POST | `/settings/api-keys` | `{ name }` → returns `{ id, name, key: 'pk_live_...' }` once |
| DELETE | `/settings/api-keys/:id` | Set revoked_at |

### 6.2 Agent (`requireApiKey`)

| Method | Route | Description |
|---|---|---|
| POST | `/api/artifacts` | multipart: `file`, `title`, `tags` (JSON or CSV), `category`, `visibility`, `description`, `published_by` |
| GET | `/api/artifacts` | List own-published (filtered by `published_by` matching this key's name) |
| GET | `/api/artifacts/:id` | Single artifact (own only) |
| PATCH | `/api/artifacts/:id` | Update (own only) |
| DELETE | `/api/artifacts/:id` | Soft delete (own only) |
| POST | `/api/artifacts/:id/share` | Convenience: set visibility=unlisted + generate share token, returns full URL |

### 6.3 Public (no auth)

| Method | Route | Description |
|---|---|---|
| GET | `/share/:token` | Serve artifact HTML (404 if revoked/expired); 401 if password required and not provided |
| GET | `/p/:slug` | Serve public artifact (404 if visibility != public) |
| GET | `/public` | JSON index of public artifacts if enabled, else 404 |
| GET | `/public/index.html` | Optional rendered HTML index using the same theme |

### Error envelope

```json
{ "code": "VALIDATION_ERROR", "message": "Title is required", "detail": { "field": "title" } }
```

## 7. Frontend — screens & layouts

### 7.1 Global shell (authenticated)

```
┌─────────────────────────────────────────────────────────────┐
│ Sidebar (240px / 280px QUHD) │  Main content area           │
│                              │                               │
│ Brand wordmark               │ Content header (44px)         │
│ ⌕  Search… (⌘K)              │ ─────────────────────────     │
│ ─────────                    │                               │
│ ◈ Feed                       │ <Outlet />                    │
│ ⊞ Browse                     │                               │
│ ─────────                    │                               │
│ TAGS                         │                               │
│ (scroll, top 20 by count)    │                               │
│ ─────────                    │                               │
│ ⚙ Settings                   │                               │
└──────────────────────────────────────────────────────────────┘
```

Mobile (<768px): sidebar hidden, top bar 52px + bottom tab bar 60px (Feed / Browse / ⌕ / Settings).
QUHD (≥1920px): sidebar 280px; Browse view may show a 280px right detail pane.

### 7.2 Feed view — `/`

Day-grouped river:
- **Pinned strip** (only if pinned exist): compact title rows at the very top under a section label `📌 PINNED`.
- **Day groups** in order: `Today`, `Yesterday`, named weekday+date (3–6 days ago), `Last week`, `Two weeks ago`, `Month Year`.
- **Today** group uses `FeedCardRich`. Header `28px italic DM Serif Display var(--cat-amber)`.
- **Yesterday** group header `22px italic DM Serif Display var(--text2)`, compact rows in a single bordered container.
- **Older** group headers `18px italic DM Serif Display var(--text2)`, compact rows.
- Day header is a button; clicking toggles collapse (local React state, not URL).
- Max-width main column 760px, centered, padding-bottom 80px.
- Empty state: italic "No artifacts" + mono caption.

### 7.3 Browse view — `/browse`

```
┌─ filter sidebar 180px ─┬─ sort bar 44px (top) ──────────────┐
│                        │                                     │
│ CATEGORY               │ N artifacts            [newest][…]  │
│  All (25)              │ ──────────────────────────────────  │
│  ● Spec (10)           │                                     │
│  ● Report (7)          │  grid: auto-fill minmax(220px,1fr)  │
│  ● Proto (5)           │  gap 12px (8px in compact density)  │
│                        │                                     │
│ TAGS  (top 16)         │  <BrowseCard /> × N                 │
│  api 12 / payments 8…  │                                     │
│                        │                                     │
└────────────────────────┴─────────────────────────────────────┘
                                      ▲
                                      └── QUHD-only right pane 280px
                                          (when rightPane=true)
```

Sort modes: `newest`, `oldest`, `alpha`, `size`. Pinned always first within sort.

Card click:
- If QUHD + `rightPane=true`: selects card, shows in right detail pane (no viewer).
- Otherwise: navigates to `/a/:id` (viewer).

### 7.4 Viewer — `/a/:id`

Full-screen overlay (fixed inset 0, z-index 200), replaces the shell layout.

**Top bar** — 44px, `var(--bg2)`, bottom border `var(--border)`:
```
[← Back]  ●cat-dot  Title……………  [tag1] [tag2] [tag3]   [i] [Share] [↗]
```
- Back: `history.back()` (or to `/` if no history)
- Cat dot: 7px circle in category color
- Title: DM Sans 13.5px / 500, ellipsis on overflow
- `[i]` toggles metadata drawer (width transitions 0 → 280px over .25s ease)
- `[↗]` opens srcdoc in a new tab

**Body**:
- `<iframe srcDoc={html} sandbox="allow-scripts">` — full width minus drawer width.
- HTML is fetched from `GET /artifacts/:id/file` (text), set as `srcdoc`. The frontend never injects the artifact HTML into its own DOM.

**Metadata drawer** (280px, slides in from right):
- `METADATA` label
- Title / Category badge / Agent badge / Size / Published timestamp / Visibility dot + label
- Tags chip list
- Description
- `Share this artifact…` button (teal action)

### 7.5 ⌘K Search overlay

- Triggered from any non-viewer view via `Cmd+K` / `Ctrl+K`.
- Fixed, centered horizontally, top 18% of viewport. Width 560 (max calc(100vw - 32px)).
- Backdrop: `rgba(0,0,0,.55)` + `backdrop-filter: blur(4px)`.
- Input at top, `esc` chip on right, debounced 200ms.
- Empty query: shows `PINNED · RECENT` header + pinned (up to 4) + recent (up to 4) = 8 max.
- Typing: `GET /artifacts?q=…` → 8 max results.
- Each row: category accent dot · title (with `<mark>` highlighting on the matched substring) · tags · relative time.
- Keyboard: ↑/↓ move focus, Enter opens (navigates to `/a/:id`), Esc closes.
- Footer hint row: `↵ open  ↑↓ navigate  esc close       N results`

### 7.6 Share modal

- Triggered from viewer top bar, viewer metadata drawer, feed card Share button, or browse detail pane.
- Centered modal, 460px wide, backdrop blur.
- Sections: `Visibility` (radio: private / unlisted / public) → `Link expiry` (only when unlisted, tabs: never / 24h / 7d / 30d) → `▸ More options` (collapsed: password field).
- Live URL preview shows `<host>/p/<slug>`, `<host>/share/<token>`, or `Not accessible via URL (private)`.
- Save behavior:
  - Visibility change → `PATCH /artifacts/:id { visibility }` immediately.
  - When visibility=unlisted and no token exists → `POST /artifacts/:id/share-token`.
  - When changing away from unlisted → `DELETE /artifacts/:id/share-token`.
- `Copy link` button: navigator.clipboard.writeText → swap to `✓ Copied!` for 2s.

### 7.7 Settings — `/settings`

Three sections in a single scrollable page:

1. **Portal**
   - `Portal title` text input → `PATCH /settings`
   - `Public index` toggle → `PATCH /settings { key:'public_index_enabled', value }`
2. **API Keys**
   - List: `name` · `pk_live_XXXXXXXX••••••••` · `Last used 3h ago` · `[Revoke]` (or revoked badge)
   - Create form: `name` input + `[+ Create key]` button → POST → amber callout shows plaintext key for 20s with `Copy` button.
3. **Appearance** (local-only, not server-persisted beyond localStorage)
   - Theme: Dark / Light
   - Density: Comfortable / Compact
   - QUHD right pane: on / off (only relevant at ≥1920px)

### 7.8 Login — `/login`

- Full-screen centered card on `var(--bg)`.
- Wordmark, `Password` input, `[Sign in]` button.
- On success → redirect to `/`. On failure → shake animation (`translateX` keyframes), error caption.
- If `password_hash` is empty in the DB, this screen runs the one-time setup flow: prompts to create a password, posts to `/setup`.

## 8. Component specs

All sizes/colors come from `colors_and_type.css` tokens.

### CategoryBadge
- `var(--font-mono)` 10px / 500
- Padding `2px 8px`, radius 20px (pill)
- Colors driven by category → varName map (`spec→amber`, `report→teal`, `prototype→purple`, `review→coral`, `other→blue`)
- `background: var(--cat-<v>-bg)`, `color: var(--cat-<v>)`, `border: 1px solid var(--cat-<v>-bd)`

### TagChip
- DM Mono 10px, padding 2px 8px, radius 12px
- Default: `color var(--text3)`, `border var(--border)`, transparent bg
- Active: `color var(--text2)`, `border var(--border2)`, `bg var(--bg3)`
- Hover (when interactive): `color var(--text2)`, `border var(--border2)`
- Transition `all .12s`

### AgentBadge
- DM Mono 10px, letter-spacing .03em
- AI (any `publishedBy !== 'manual'`): `color var(--cat-teal)`, prefix `⟡` opacity .7
- Manual: `color var(--text3)`, prefix `✎` opacity .7

### VisibilityDot
- 5×5 circle
- `public → var(--cat-teal)`, `unlisted → var(--cat-amber)`, `private → var(--text3)`
- `title` attribute set to capitalized label

### IconBtn
- Border 1px, radius 6, padding 4px 9px
- Mono 11px, `var(--text3)` (active/hover → `var(--text)`)
- Transition `all .12s`

### FeedCardRich
- `bg var(--bg2)`, border `var(--border)`, radius 10
- Padding `18px 20px 18px 24px` (comfortable) / `14px 16px 14px 20px` (compact)
- Hover: `border-color → var(--border2)`, `bg → var(--bg2h)`
- 3px left accent bar (`getCategoryColor(category)`), radius `10px 0 0 10px`
- Top row: CategoryBadge + VisibilityDot + 📌 (if pinned) + timestamp (ml:auto, DM Mono 10px var(--text3))
- Title: DM Serif Display 19px (16px compact) / 400, color var(--text), letter-spacing -.01em, line-height 1.25
- Description: 13px var(--text2), line-height 1.65, hidden in compact density
- Tags: up to 5
- Footer: AgentBadge + size + Share IconBtn (ml:auto)
- Card click bubbles to onClick(artifact); Share click stops propagation

### FeedCardCompact
- flex row, padding `9px 12px` (`7px 10px` compact), radius 7
- bottom border `var(--border)`
- Hover: `bg var(--bg2)`
- Content: CategoryBadge | title (flex:1, DM Sans 13.5px var(--text), ellipsis) | up to 2 TagChips | timestamp (DM Mono 10px var(--text3))

### BrowseCard
- `bg var(--bg2)`, border `var(--border)`, radius 10, padding `16px 18px` (`12px 14px` compact)
- Selected: `bg var(--bg3)`, border `var(--border2)`
- Hover (when not selected): `border-color var(--border2)`, `bg var(--bg2h)`
- Top: CategoryBadge + VisibilityDot
- Title: DM Sans 13.5px (12.5px compact) / 500, var(--text), line-height 1.35
- Tags: up to 3
- Footer: AgentBadge / size (space-between)
- 📌 absolute top-right when pinned

### Sidebar
- Width `var(--nav-w)` (240/280)
- Sections: brand, search button (acts like ⌘K trigger), nav items (Feed/Browse), TAGS, settings (bottom)
- Active nav item: `bg var(--bg3)`, font-weight 500, color var(--text)
- Hover nav: `bg var(--bg3)`

### MobileTabBar
- Fixed bottom, height 60px
- 4 cells: Feed / Browse / Search / Settings — icon + 10px mono label
- Active cell: color var(--text), accent dot above icon in category amber

## 9. Design tokens — quick reference

```
Fonts:    DM Serif Display (head, italic), DM Sans (body), DM Mono (labels/code)
Surfaces: --bg #0C0E14   --bg2 #131620   --bg2h #161928   --bg3 #1A1E2A
Borders:  --border #252B3A   --border2 #313849
Text:     --text #EDE9E3   --text2 #9A968F   --text3 #5C5A55
Cats:     --cat-amber #E8A042 (spec)   --cat-teal #2BB5A0 (report)
          --cat-purple #8B7CF8 (prototype)   --cat-coral #E06055 (review)
          --cat-blue #4A9FE0 (other)
          each has -bg and -bd companions
Layout:   --nav-w 240/280   --topbar-h 44   --mobile-topbar 52   --mobile-nav-h 60
Radii:    sm 6  md 8  lg 10  xl 14  pill 20
Transitions:  --t-fast .10s   --t-normal .15s   --t-drawer .25s
```

Light theme tokens live in the same CSS file under `[data-theme="light"]`. Toggle via `document.documentElement.setAttribute('data-theme', 'light'|'dark')`.

## 10. State management

Zustand (lighter than Redux, simpler than Context+reducer for this scale). Single store:

```ts
{
  // session
  authed: boolean,
  loading: boolean,
  artifacts: Artifact[],         // current list for current view
  tagFilter: string | null,
  query: string,                  // ⌘K search

  // UI
  searchOpen: boolean,
  shareOpen: boolean,
  shareTarget: Artifact | null,

  // persisted to localStorage
  density: 'comfortable' | 'compact',
  theme: 'dark' | 'light',
  rightPane: boolean,
  collapsedDays: Record<string, boolean>,
}
```

Persistence: a `subscribe` hook writes `density`, `theme`, `rightPane`, `collapsedDays` to `localStorage` under `artifact-portal:ui`.

## 11. Utility functions

```js
// utils/format.js
export function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' b';
  if (bytes < 1024 ** 2) return Math.round(bytes / 1024) + ' kb';
  return (bytes / 1024 ** 2).toFixed(1) + ' mb';
}

export function timeLabel(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const H = 3_600_000, D = 86_400_000;
  if (diff < 60_000) return 'just now';
  if (diff < H)      return Math.round(diff / 60_000) + 'm ago';
  if (diff < D)      return Math.round(diff / H) + 'h ago';
  if (diff < 2 * D)  return 'yesterday';
  return Math.floor(diff / D) + 'd ago';
}

export function dayKey(iso) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const D = 86_400_000;
  if (diff < D)    return 'Today';
  if (diff < 2*D)  return 'Yesterday';
  const days = Math.floor(diff / D);
  if (days < 7)    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  if (days < 14)   return 'Last week';
  if (days < 21)   return 'Two weeks ago';
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
```

## 12. Interactions

| Trigger | Behavior |
|---|---|
| Click feed/browse card | Navigate to `/a/:id` (viewer) |
| Click browse card (QUHD + rightPane on) | Select; show in right detail pane; no navigation |
| `Cmd+K` / `Ctrl+K` | Open search overlay (no-op in viewer) |
| `Escape` | Close search overlay or share modal or viewer drawer |
| Click day header | Toggle collapse for that day (persisted in localStorage) |
| Click tag (sidebar or card) | Set `tagFilter`; affects Feed and Browse |
| Click `×` on tag filter pill | Clear `tagFilter` |
| Viewer `← Back` | `history.back()` or `/` if none |
| Viewer `[i]` | Toggle metadata drawer (width transition .25s) |
| Viewer `[↗]` | Open srcdoc in new tab |
| Share modal: change visibility | `PATCH /artifacts/:id`; update URL preview live |
| Share modal: copy | `navigator.clipboard.writeText`; flip button to "✓ Copied!" for 2s |
| Settings: revoke key | Optimistic UI; `DELETE /settings/api-keys/:id` |
| Settings: create key | `POST /settings/api-keys` → amber callout with plaintext; auto-dismiss after 20s |
| Login submit (wrong pw) | Shake animation 400ms; error caption |

### Hover states
- All interactive: `transition: all .12s ease`
- Cards: `border-color → var(--border2)`, `background → var(--bg2h)`
- Buttons: `color → var(--text)`, `border-color → var(--border2)`
- Sidebar nav: `background → var(--bg3)`

### Animations
- Metadata drawer: `width 0 → 280px`, `.25s ease`
- Modal: instant open, backdrop blur 4px
- Toggle switches: knob `left .2s`, bg `.2s`
- No page transitions (instant view changes)

## 13. Open questions / gaps

These were called out in the source spec as not-yet-decided. Decide before building the phase that needs them — most aren't blockers for phase 1–4.

1. **Thumbnails** — Puppeteer-rendered 800×600 JPEG on publish? Or always-fallback title-card SVG? (Phase 5: `ws-thumbnails`)
2. **Version history** — Keep last 5 versions when artifact re-published with same slug? (Phase 5: `ws-version-history`)
3. **Collections** — Reserve tag prefix `col/*` for collections (e.g. `col/auth-work`)? Or first-class table? Decision impacts agent API contract. (Phase 5: `ws-collections`)
4. **View analytics** — Log views to `artifact_views(artifact_id, ts, source, ip)`? Show count on cards? (Phase 5: `ws-analytics`)
5. **Webhooks** — Outbound POST on publish? (Phase 5: `ws-webhooks`)
6. **Export/backup** — `GET /export.zip` for full archive? (Phase 5: `ws-export`)
7. **Max artifact size** — 5MB? 10MB? Currently no enforced limit. Recommend 10MB matching original Nginx config.
8. **Public index page** — JSON only, or also a rendered HTML index using the portal theme? (Spec includes both, but defaults to JSON only in phase 1.)
9. **Share password protect & expiry** — UI is in place but server enforcement (password gate, expiry check) is v2.
10. **Slug collision strategy** — append `-2`, `-3`, … vs. random suffix vs. include short id. Default: append numeric suffix on collision.

## 14. Build phases (Mac-local edition)

Each phase is shippable / demoable on its own.

### Phase 1 — Server foundation
Smoke test target: a Node script can publish 50 artifacts via the agent API and `curl /artifacts` returns them paginated.

- `ws-server-core`
- `ws-auth`
- `ws-agent-api`
- `ws-owner-api`
- `ws-public-routes`

### Phase 2 — Frontend core
Smoke test: open `http://localhost:5173`, log in, see real seeded artifacts in the feed, open one in the viewer, share it.

- `ws-frontend-shell`
- `ws-design-system`
- `ws-feed-view`
- `ws-viewer`
- `ws-share-modal`
- `ws-browse-view`

### Phase 3 — Search + settings

- `ws-search-overlay` (FTS5 from day one)
- `ws-settings-view`

### Phase 4 — Polish + breakpoints

- `ws-quhd-layout`
- `ws-mobile-layout`

### Phase 5 — Power features (later, behind decisions in §13)

- `ws-thumbnails`
- `ws-fts-content`
- `ws-version-history`
- `ws-collections`
- `ws-analytics`
- `ws-webhooks`
- `ws-export`
