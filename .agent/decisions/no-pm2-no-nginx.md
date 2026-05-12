---
id: no-pm2-no-nginx
choice: The portal does not use PM2, Nginx, or any external process / proxy manager. Express serves both the API and the built React SPA on a single port.
scope: deployment, infrastructure
date: 2026-05-11
---

## Rationale

The original design handoff was written assuming a VPS deploy (PM2 + Nginx + Let's Encrypt). On a single-user MacBook localhost target, none of those buy anything:

- **PM2** exists to keep processes alive across crashes, restart on file change, and manage logs. On the MacBook: `node --watch server.js` handles file-change restart; crashes are rare and the owner sees them immediately; logs go to stdout / a single file in `~/.artifact-portal/logs/`.
- **Nginx** terminates SSL (not needed for localhost), serves static files (Express does this natively for one user), and reverse-proxies (nothing to proxy to). Pure overhead.

A single Node process bound to `127.0.0.1` doing both the API and serving `public/` (Vite build output) is the correct shape.

## Alternatives considered

- **PM2 only, no Nginx**: still pulls in PM2 daemon + its config file + its restart semantics. Not worth it.
- **systemd / launchd plist**: the owner can write their own `launchd` plist if they want auto-start — that's outside this repo and outside this project's scope.
- **Embed everything in a Tauri / Electron app**: massively increases scope and breaks the "agents POST artifacts over HTTP" contract.

## Consequence

- `package.json` scripts:
  - `dev`: `node --watch server.js` (backend) — frontend uses Vite dev server separately
  - `build`: `cd frontend && npm run build`
  - `start`: `node server.js` (production-style; serves built SPA from `public/`)
- The frontend Vite dev server (port 5173) proxies API routes to `:3000` during development; in production there's only `:3000`.
- No background workers, queues, or cron jobs. If thumbnails (future) need backgrounding, use a Node `worker_thread` invoked from the publish handler.
- See related: rule `mac-localhost-only`, decision `mac-localhost-target`.
