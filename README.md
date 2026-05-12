# Artifact Portal

A self-hosted web portal for publishing and browsing AI-generated HTML artifacts — specs, reports, prototypes, code reviews, dashboards. AI agents publish via a REST API; the owner browses, tags, shares, and manages through a dark-themed React SPA.

**Single user. Single machine. No cloud services required.**

![Dark-themed portal feed](https://placeholder.invalid/screenshot)

## Features

- **Agent API** — publish HTML artifacts via `POST /api/artifacts` with an API key
- **Feed & Browse** — reverse-chronological feed and filterable grid view
- **Full-text search** — SQLite FTS5 across titles, tags, and content
- **Version history** — track and restore previous versions of any artifact
- **Share links** — generate password-protected or open share URLs
- **Dark/light theme** — portal theme propagated to sandboxed artifacts via `postMessage`
- **Export** — download artifacts as zip
- **Webhooks** — HTTP callbacks on artifact events
- **HTML design contract** — built-in linter (`POST /api/validate`) checks artifacts before publish
- **Soft deletes** — artifacts are recoverable; hard delete is explicit

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 LTS |
| Server | Express 5 |
| Database | SQLite via `better-sqlite3`, FTS5 |
| Auth | bcryptjs + jsonwebtoken (httpOnly cookie, 7-day expiry) |
| Agent auth | `X-API-Key` header (bcrypt-hashed in DB) |
| File store | Local filesystem at `~/.artifact-portal/files/` |
| Frontend | React 18 + React Router 6 + Vite |

## Quick start

**Requirements:** Node.js 20+

```bash
git clone https://github.com/your-username/artifact-portal
cd artifact-portal

# Install server deps
npm install

# Install and build frontend
cd frontend && npm install && npm run build && cd ..

# Start
node server.js
```

Visit `http://localhost:3000`. On first run you'll be prompted to set a password.

> **Note on `better-sqlite3`:** This package uses a native addon. If the install fails, you may need Python 3 available: `npm_config_python=$(which python3) npm install`

## Development

```bash
# Terminal 1 — backend with auto-restart
node --watch server.js

# Terminal 2 — frontend with HMR
cd frontend && npm run dev
```

Frontend dev server runs at `http://localhost:5173` and proxies API requests to `:3000`.

## Configuration

Copy `.env.example` to `~/.artifact-portal/.env` (the data directory, not the repo root) and set values:

```bash
mkdir -p ~/.artifact-portal
cp .env.example ~/.artifact-portal/.env
```

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `JWT_SECRET` | auto-generated | JWT signing secret — set explicitly in production |
| `DB_PATH` | `~/.artifact-portal/db.sqlite` | SQLite database path |
| `FILES_DIR` | `~/.artifact-portal/files` | Artifact HTML file storage |

## Auto-start on macOS (launchd)

Create `~/Library/LaunchAgents/com.artifact-portal.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.artifact-portal</string>
  <key>ProgramArguments</key>
  <array>
    <string>/path/to/node</string>
    <string>/path/to/artifact-portal/server.js</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/tmp/artifact-portal.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/artifact-portal.err</string>
</dict>
</plist>
```

```bash
launchctl load ~/Library/LaunchAgents/com.artifact-portal.plist
```

## Publishing artifacts (Agent API)

Create an API key in Settings, then:

```bash
curl -X POST http://localhost:3000/api/artifacts \
  -H "X-API-Key: ap_<your-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Report",
    "html": "<!DOCTYPE html><html>...</html>",
    "tags": ["report", "q1"],
    "visibility": "private"
  }'
```

**Validate before publishing:**

```bash
curl -X POST http://localhost:3000/api/validate \
  -H "X-API-Key: ap_<your-key>" \
  -H "Content-Type: application/json" \
  -d '{"html": "..."}'
```

**Replace an artifact's HTML** (preserves slug and metadata):

```bash
curl -X PUT http://localhost:3000/api/artifacts/<id>/file \
  -H "X-API-Key: ap_<your-key>" \
  -H "Content-Type: application/json" \
  -d '{"html": "..."}'
```

### Theme-adaptive artifacts

Artifacts are sandboxed (`sandbox="allow-scripts"`). The portal sends the current theme via `postMessage`. To make your artifact respond:

```html
<script>
(function () {
  // Request theme from parent immediately
  window.parent.postMessage({ type: 'portal:theme:request' }, '*');
  window.addEventListener('message', (e) => {
    if (e.data?.type === 'portal:theme') {
      document.documentElement.setAttribute('data-scheme', e.data.theme);
    }
  });
})();
</script>
```

Use `[data-scheme="dark"]` / `[data-scheme="light"]` CSS selectors. Do not use `@media (prefers-color-scheme)` — it is blocked in sandboxed iframes.

## Project structure

```
artifact-portal/
├── server.js              # Express entry point
├── db/
│   ├── schema.sql         # Full DDL
│   └── migrate.js         # Idempotent migration runner
├── routes/
│   ├── api.js             # Agent API (publish, update, delete artifacts)
│   ├── artifacts.js       # Owner artifact management
│   ├── auth.js            # Login / logout
│   ├── export.js          # Zip export
│   ├── settings.js        # API keys, webhooks, password change
│   └── share.js           # Share link generation and access
├── middleware/
│   ├── auth.js            # JWT cookie auth
│   ├── apiKey.js          # X-API-Key auth
│   ├── upload.js          # Multipart handling
│   └── error.js           # Central error handler
├── lib/
│   ├── db.js              # SQLite singleton + helpers
│   ├── files.js           # Artifact file read/write/delete
│   ├── slug.js            # Title → slug with collision handling
│   ├── versions.js        # Version history
│   ├── webhooks.js        # Outbound webhook delivery
│   ├── contract-linter.js # HTML design contract linter
│   └── config.js          # Env + data dir resolution
├── scripts/
│   ├── reindex.js         # Backfill FTS index
│   └── smoke-phase1.sh    # API smoke tests
└── frontend/
    └── src/
        ├── styles/colors_and_type.css  # Design tokens
        ├── views/          # Feed, Browse, Viewer, Settings, ...
        └── components/     # Shell, Sidebar, cards, badges, ...
```

## License

MIT
