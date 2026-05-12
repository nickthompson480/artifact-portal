---
id: ws-frontend-shell
title: Vite + React Router + App shell, sidebar, login, state store
state: pending
depends_on: [ws-owner-api]
summary: The structural frontend — Vite config, routing, global layout (sidebar + content area), mobile bottom-tab bar, Zustand store, login page, api.js fetch wrappers.
phase: 2
---

## What done looks like

### Frontend bootstrap

- `frontend/package.json` with deps: `react`, `react-dom`, `react-router-dom@6`, `zustand`, `vite`, `@vitejs/plugin-react`.
- `frontend/vite.config.js`:
  - React plugin
  - Build outDir = `../public`
  - Dev proxy: `/login`, `/logout`, `/me`, `/setup`, `/artifacts`, `/api`, `/settings`, `/share`, `/p`, `/public`, `/healthz` → `http://127.0.0.1:3000`
- `frontend/index.html` with `<link>` for DM Serif Display + DM Sans + DM Mono (or imported via CSS).
- `src/main.jsx` mounts `<App />` with `<BrowserRouter>`.
- `src/styles/colors_and_type.css` — **exact copy** of `IMPORTS/personal-web/project/colors_and_type.css`. No edits.

### Routing (App.jsx)

```
/                     → <FeedView /> (inside <Shell />)
/browse               → <BrowseView /> (inside <Shell />)
/settings             → <SettingsView /> (inside <Shell />)
/a/:id                → <Viewer />        (full-screen, no Shell)
/login                → <Login />         (full-screen, no Shell)
*                     → <NotFound />
```

A `<RequireAuth>` wrapper checks `GET /me`; if 401 → `<Navigate to="/login" />` (preserving `?from=`).

### Shell layout (desktop ≥ 768px)

Two-column flex:
- **Sidebar** (var(--nav-w)): brand wordmark · `⌕ Search…  ⌘K` button · `◈ Feed` nav · `⊞ Browse` nav · TAGS section (top 20 by count from `/artifacts` aggregate) · `⚙ Settings` pinned bottom.
- **Main**: `<Outlet />`.
- Active nav item: `bg var(--bg3)`, `color var(--text)`, font-weight 500.
- The Search… button opens the ⌘K overlay (mounted at App level — see ws-search-overlay).
- Sidebar tag click sets `tagFilter` in store.

### Shell layout (mobile < 768px)

- Top bar 52px: brand + 🔍 button.
- Bottom tab bar 60px fixed: Feed / Browse / Search (opens overlay) / Settings.
- Active tab: amber accent dot above icon.

### Zustand store (`src/state/store.js`)

```ts
{
  authed: null,                        // null until /me checks; then true|false
  tagFilter: null,
  searchOpen: false,
  shareOpen: false,
  shareTarget: null,
  density: 'comfortable',              // persisted
  theme: 'dark',                       // persisted
  rightPane: false,                    // persisted
  collapsedDays: {},                   // persisted
  // actions:
  setTagFilter, openSearch, closeSearch,
  openShare(artifact), closeShare,
  setDensity, setTheme, setRightPane,
  toggleDay(key),
}
```

A `subscribe` hook writes `density`, `theme`, `rightPane`, `collapsedDays` to `localStorage['artifact-portal:ui']` (single JSON blob).

On mount, App.jsx reads localStorage, hydrates store, and applies `document.documentElement.setAttribute('data-theme', store.theme)`.

### Global ⌘K keybinding

In App.jsx: `useEffect` registers `keydown` listener; if `(e.metaKey||e.ctrlKey) && e.key === 'k'` and we're not in the Viewer, preventDefault and `openSearch()`.

### `src/data/api.js`

Thin fetch wrappers with credentials: 'include'. Functions:
- `me()`, `login(pw)`, `logout()`, `setup(pw)`
- `listArtifacts(params)`, `getArtifact(id)`, `patchArtifact(id, body)`, `softDelete(id)`, `restore(id)`, `permanentDelete(id)`
- `createShareToken(id, opts)`, `revokeShareToken(id)`
- `getSettings()`, `patchSetting(key, value)`
- `listApiKeys()`, `createApiKey(name)`, `revokeApiKey(id)`
- `fileUrl(id)` — string only

Errors throw `ApiError(code, message, status, detail)`.

### Login page

- Centered card on `var(--bg)`. Brand wordmark on top. Password input. `[Sign in]` button.
- On success → `useNavigate()` to `searchParams.get('from') || '/'`.
- On wrong pw → shake keyframes (translateX -6/6/-6/0), error caption beneath.
- If `GET /me` reveals `password_hash` is empty (need an extra endpoint or `/me` returns `{ setup: true }`), the page swaps to a setup form that posts to `/setup` first, then `/login`.

## Key files

- `frontend/vite.config.js`, `frontend/index.html`, `frontend/package.json`
- `src/main.jsx`, `src/App.jsx`
- `src/components/Shell.jsx`, `Sidebar.jsx`, `MobileTabBar.jsx`
- `src/views/Login.jsx`
- `src/state/store.js`
- `src/data/api.js`
- `src/styles/colors_and_type.css` (copied)

## Acceptance

1. `cd frontend && npm install && npm run dev` boots Vite at `:5173`.
2. Visiting `/` while logged out → redirects to `/login`.
3. Login → `/`. Sidebar visible. (Feed is empty placeholder for this workstream.)
4. Tags from `/artifacts` aggregate appear in the sidebar TAGS section.
5. `⌘K` opens the search overlay (overlay can be a placeholder for this workstream — full work in ws-search-overlay).
6. Resize to <768px → sidebar disappears, bottom tab bar appears.
7. `npm run build` produces `public/` consumable by Express.

## Out of scope

- Feed/Browse/Viewer/Settings *content* (separate workstreams)
- Real search results (ws-search-overlay)
- Right detail pane (ws-quhd-layout)
