---
id: mac-localhost-target
choice: The portal runs on the owner's MacBook at localhost. No VPS, no public hostname, no SSL. Sharing happens via local network or temporary tunnels (out of scope for this project).
scope: deployment, lifecycle, infrastructure
date: 2026-05-11
---

## Rationale

The portal is a personal tool. The data — internal specs, code reviews, work-in-progress prototypes — is owner-only by default. The few artifacts that need to be shared (visibility=unlisted / public) can be shared on the LAN, or via a temporary tunnel (cloudflared, ngrok, tailscale funnel) that the owner spins up out-of-band when needed.

Running on the MacBook gets us:
- Zero VPS cost / maintenance for what is primarily a single-user app
- Files stored under `~/.artifact-portal/` — naturally backed up by Time Machine
- No HTTPS plumbing for `127.0.0.1`
- Lifecycle that matches the owner's work hours (the laptop is open when they want the portal, closed otherwise)

It also matches the broader principle in `~/code/CLAUDE.md`: most projects run on a dev server or VPS; this one is an explicit exception, declared via `runs on MacBook` in the project's `CLAUDE.md`.

## Alternatives considered

- **Deploy to the VPS playground**: requires public hostname + SSL + auth hardening + log management. Disproportionate to the value for a single-user tool.
- **Run on the dev server**: better than VPS (still internal) but the latency over Tailscale adds friction for a tool that should feel instant. Files would also live on the dev server's disk instead of the MacBook's, breaking the Time Machine assumption.
- **Make it Docker-deployable everywhere**: solves no real problem, adds rebuild overhead, and conflicts with the iteration speed advantage of running locally.

## Consequence

- No `ecosystem.config.js`, `nginx.conf`, `Dockerfile`, `docker-compose.yml`.
- `server.js` listens on `process.env.PORT || 3000` and binds to `127.0.0.1` (not 0.0.0.0).
- The data directory is `~/.artifact-portal/` (created on first run).
- Owner runs `node server.js` (or sets up a `launchd` plist if they want auto-start — not part of this project).
- Share URLs in the UI display `localhost:3000/share/...` by default; the owner overrides via `PUBLIC_BASE_URL` env var if they tunnel.
- See related: rule `mac-localhost-only`, decision `no-pm2-no-nginx`.
