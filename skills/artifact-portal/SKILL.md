---
name: artifact-portal
description: Publishing, reading, updating, and deleting HTML artifacts on a self-hosted Artifact Portal instance. Load before any task that ends in submitting an HTML artifact to the portal API.
contract-version: v1
---

# Artifact Portal — Agent API

A self-hosted portal that stores and serves HTML artifacts. Agents publish via REST API using an `X-API-Key` header. The owner browses and manages everything through the SPA.

The portal accepts **one kind of payload: a single self-contained HTML file**. Each artifact you publish is rendered inside a locked-down `<iframe sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox">` and shown alongside other artifacts from other agents. Treat every artifact as a polished, standalone document — it will be opened, shared, and possibly archived. Load `design-contract.md` before generating HTML.

## Configuration

Two values are required: the portal URL and an API key.

- `ARTIFACT_PORTAL_URL` — `http://localhost:4567` if the portal runs on the same machine, or `http://<host>:4567` from another device on the same network.
- `ARTIFACT_PORTAL_KEY` — created by the portal owner in **Settings → API Keys**. The key is shown exactly once at creation (format: `pk_live_<32 chars>`).

Set them in your shell, in a local `.env` file you source before running curl, or however your environment manages secrets:

```bash
export ARTIFACT_PORTAL_URL="http://localhost:4567"
export ARTIFACT_PORTAL_KEY="pk_live_..."
```

The examples below use `$ARTIFACT_PORTAL_URL` and `$ARTIFACT_PORTAL_KEY`. Substitute literal values if your shell doesn't have them exported.

---

## Operations

Agents can: publish, list, get, update metadata, replace HTML in-place (`PUT /file`), soft-delete, read version history, generate share links, and interlink between artifacts.
Agents cannot: push new versions directly (snapshots are created automatically on file replacement) or read raw artifact HTML via the API (`GET /file` returns the SPA shell, not the artifact content — regenerate from source instead).

### Publish an artifact

The file must be HTML (`.html` or `.htm` extension). Max 10 MB.

**From a file:**
```bash
curl -X POST "$ARTIFACT_PORTAL_URL/api/artifacts" \
  -H "X-API-Key: $ARTIFACT_PORTAL_KEY" \
  -F "file=@/path/to/report.html" \
  -F "title=Q2 Growth Report" \
  -F "category=report" \
  -F "tags=q2,growth,revenue" \
  -F "visibility=private" \
  -F "description=Weekly revenue summary for Q2 2026"
```

**From a shell variable (pipe into curl):**
```bash
printf '%s' "$HTML" | curl -X POST "$ARTIFACT_PORTAL_URL/api/artifacts" \
  -H "X-API-Key: $ARTIFACT_PORTAL_KEY" \
  -F "file=@-;filename=artifact.html" \
  -F "title=My Artifact" \
  -F "category=other"
```

**Fields:**

| Field | Required | Values | Notes |
|---|---|---|---|
| `file` | yes | `.html` / `.htm` | Multipart file upload |
| `title` | yes | string, max 200 | Shown in portal grid |
| `category` | no | `spec` `report` `prototype` `review` `other` | Defaults to `other` |
| `visibility` | no | `private` `unlisted` `public` | Defaults to `private` |
| `description` | no | string, max 2000 | Shown in detail view |
| `tags` | no | comma-separated or JSON array, max 12 tags, max 32 chars each | e.g. `q2,revenue` |

**Response (201):**
```json
{
  "id": "uuid",
  "title": "Q2 Growth Report",
  "slug": "q2-growth-report",
  "category": "report",
  "visibility": "private",
  "tags": ["q2", "growth", "revenue"],
  "description": "...",
  "file_size": 42318,
  "published_by": "my-agent",
  "share_token": null,
  "has_share_password": false,
  "pinned": false,
  "file_url": "/artifacts/<id>/file",
  "created_at": "2026-05-11T...",
  "updated_at": "2026-05-11T..."
}
```

Save the returned `id` to update or delete the artifact later.

---

### Validate HTML before publishing

Run the Design Contract v1 linter before publishing to catch violations pre-submit. Returns a structured findings list.

> **Note:** All checks are regex-based static analysis — best-effort, not rendering-based. A `valid: true` result is strongly indicative but not a rendering guarantee.

**Severity levels:** `error` = hard requirement failed (would produce visible breakage); `warning` = strong recommendation missing (non-blocking).

```bash
printf '%s' "$HTML" | curl -s -X POST "$ARTIFACT_PORTAL_URL/api/validate" \
  -H "X-API-Key: $ARTIFACT_PORTAL_KEY" \
  -F "file=@-;filename=artifact.html" \
  -F "title=My Artifact"
```

**Optional fields:** `title` (string) — validates that `<title>` matches; `category` (string) — reserved for future provenance checks.

**Response (200):**
```json
{
  "valid": false,
  "findings": [
    { "severity": "error",   "rule": "design-contract-stamp", "message": "<!-- design-contract: v1 --> comment missing" },
    { "severity": "error",   "rule": "adaptive-color-css",    "message": "[data-scheme= CSS selector not found" },
    { "severity": "warning", "rule": "og-tags",               "message": "No og:title meta tag and no skip comment" }
  ]
}
```

**Rules checked:** `html5-doctype`, `html5-lang`, `html5-charset`, `html5-viewport`, `html5-title`, `design-contract-stamp`, `color-scheme-meta`, `opaque-background`, `opaque-background-transparent`, `body-min-height`, `overflow-x-hidden`, `ultra-wide-clamp-layout`, `ultra-wide-clamp-prose`, `prefers-reduced-motion`, `external-links`, `no-localstorage`, `no-sessionstorage`, `no-cookies`, `no-window-parent`, `no-indexeddb`, `no-clipboard-read`, `single-file`, `https-only`, `adaptive-color-listener`, `adaptive-color-css`, `title-match` (if title provided), `form-action-attribute`, `og-tags`, `google-fonts-display-swap`, `one-h1`, `heading-order`, `no-sri-hashes`.

---

### List your artifacts

```bash
# Live artifacts (default)
curl "$ARTIFACT_PORTAL_URL/api/artifacts?limit=20&offset=0" \
  -H "X-API-Key: $ARTIFACT_PORTAL_KEY"

# Include soft-deleted artifacts in results
curl "$ARTIFACT_PORTAL_URL/api/artifacts?include_trashed=true" \
  -H "X-API-Key: $ARTIFACT_PORTAL_KEY"

# Only soft-deleted artifacts (e.g. to recover a lost ID)
curl "$ARTIFACT_PORTAL_URL/api/artifacts?trashed_only=true" \
  -H "X-API-Key: $ARTIFACT_PORTAL_KEY"
```

Returns an array. Scoped to the key's `published_by` name — only sees artifacts this key published. Params: `limit` (max 500, default 100), `offset`, `include_trashed` (bool), `trashed_only` (bool). Deleted items include a non-null `deleted_at` field.

---

### Get a single artifact

```bash
curl "$ARTIFACT_PORTAL_URL/api/artifacts/<id>" \
  -H "X-API-Key: $ARTIFACT_PORTAL_KEY"
```

404 if not found, deleted, or owned by a different key.

---

### Update metadata

Slug is **immutable** — never changes even if title changes.

> **Note:** A `file=` field in a PATCH request is silently ignored — only JSON metadata fields are updated. The response returns a valid artifact object regardless, giving a false success signal. To replace the file, use `PUT /api/artifacts/:id/file` (see Replace artifact file below).

```bash
curl -X PATCH "$ARTIFACT_PORTAL_URL/api/artifacts/<id>" \
  -H "X-API-Key: $ARTIFACT_PORTAL_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "description": "New description",
    "tags": ["new", "tags"],
    "category": "spec",
    "visibility": "unlisted",
    "pinned": true
  }'
```

Send only the fields you want to change. All fields optional.

---

### Soft delete

```bash
curl -X DELETE "$ARTIFACT_PORTAL_URL/api/artifacts/<id>" \
  -H "X-API-Key: $ARTIFACT_PORTAL_KEY"
```

Moves to trash. The slug stays reserved — a new artifact with the same title will get a `-2` suffix. Use `PUT /api/artifacts/:id/file` to update content in-place instead of delete + republish. Returns `{ "ok": true }`.

---

### Restore from trash

Restores a soft-deleted artifact. Idempotent — safe to call even if the artifact is already live.

```bash
curl -X POST "$ARTIFACT_PORTAL_URL/api/artifacts/<id>/restore" \
  -H "X-API-Key: $ARTIFACT_PORTAL_KEY"
```

Returns `{ "id": "...", "slug": "...", "deleted_at": null }`. If you've lost the ID, use `GET /api/artifacts?trashed_only=true` to find it first.

---

### Replace artifact file (in-place)

Replaces the HTML content of an existing artifact without changing its slug, id, or metadata. Use this instead of delete + republish — the slug and all existing links are preserved.

By default a version snapshot is taken before overwriting. Pass `?snapshot=false` to skip it.

```bash
printf '%s' "$NEW_HTML" | curl -s -X PUT "$ARTIFACT_PORTAL_URL/api/artifacts/<id>/file" \
  -H "X-API-Key: $ARTIFACT_PORTAL_KEY" \
  -F "file=@-;filename=artifact.html"

# Skip snapshot (e.g. trivial re-render):
printf '%s' "$NEW_HTML" | curl -s -X PUT "$ARTIFACT_PORTAL_URL/api/artifacts/<id>/file?snapshot=false" \
  -H "X-API-Key: $ARTIFACT_PORTAL_KEY" \
  -F "file=@-;filename=artifact.html"
```

Returns the updated artifact object (same shape as POST). Triggers thumbnail regen and webhooks.

---

### List version history

Each time the HTML file is replaced (by the owner via the SPA or by an agent via `PUT /file`), the previous version is snapshotted automatically. Agents can read the version list:

```bash
curl "$ARTIFACT_PORTAL_URL/api/artifacts/<id>/versions" \
  -H "X-API-Key: $ARTIFACT_PORTAL_KEY"
```

**Response:**
```json
{
  "versions": [
    { "id": "uuid", "version_num": 2, "created_at": "2026-05-11T..." },
    { "id": "uuid", "version_num": 1, "created_at": "2026-05-10T..." }
  ]
}
```

---

### Generate a share link

Produces a public URL that doesn't require login. Sets visibility to `unlisted`. Clears any owner-set expiry or password.

```bash
curl -X POST "$ARTIFACT_PORTAL_URL/api/artifacts/<id>/share" \
  -H "X-API-Key: $ARTIFACT_PORTAL_KEY"
```

**Response:**
```json
{
  "token": "abc123...",
  "url": "http://<host>:4567/share/abc123..."
}
```

Share the `url` directly. Regenerating replaces the previous token — old links stop working.

---

### Interlink to another artifact

Artifacts can link to each other using standard `<a>` tags. The sandbox includes `allow-popups` and `allow-popups-to-escape-sandbox`, which is what makes `target="_blank"` links work — clicked links open in a new tab, and the tab loads normally without inheriting the sandbox restrictions. `allow-top-navigation` is not present, so links without `target="_blank"` are blocked silently. `target="_blank" rel="noopener noreferrer"` is required (already mandated by the `target="_blank"` requirement).

The target artifact's visibility determines whether the link resolves for the reader:

| Target visibility | URL to use | Who can open it |
|---|---|---|
| `public` | `/p/{slug}` | Anyone |
| `unlisted` (share link) | `/share/{token}` | Anyone with the link |
| `private` | `/a/{slug}` | Owner only (requires login cookie) |

**Always use root-relative paths** (`/a/slug`, `/p/slug`, `/share/token`) — never `http://localhost:4567/...` or `http://<host>:4567/...`. Hardcoded hosts break when the portal is accessed from another device on the network. Root-relative paths inherit the host from the current request.

Prefer `/p/:slug` or `/share/:token` for any link intended to work for a reader other than the owner.

Two additional constraints:
- Artifacts cannot embed each other inline — the portal does not relay iframes.
- Artifacts cannot `postMessage` each other — the portal only sends `portal:theme` inbound; there is no inter-artifact bridge.

---

## Visual content in artifacts

The portal's native medium is HTML/CSS/SVG — dark, type-driven, structured. Follow this decision ladder before reaching for a generated image:

1. **CSS** — gradients, layout, typography, color, shapes. Always first. Zero cost, instant, theme-aware.
2. **Inline SVG** — charts, diagrams, icons, geometric illustrations. Vector-precise and tiny.
3. **A generated raster image** — photographic content, textured illustrations, or decorative art that CSS/SVG genuinely can't produce. Only after 1 and 2 are ruled out.

Generated images must be embedded as inline base64 data URIs (`data:image/jpeg;base64,...`) to satisfy the single-file constraint. Keep total artifact size under 10 MB.

Externally hosted images must use a stable `https://` CDN. Never use `http://` image sources.

---

## Workflow: generate and publish

```bash
# 1. Build the HTML artifact (however fits the task)
HTML=$(generate_report_html)   # your generation step

# 2. Publish
RESPONSE=$(printf '%s' "$HTML" | curl -s -X POST "$ARTIFACT_PORTAL_URL/api/artifacts" \
  -H "X-API-Key: $ARTIFACT_PORTAL_KEY" \
  -F "file=@-;filename=report.html" \
  -F "title=My Report" \
  -F "category=report" \
  -F "tags=auto-generated")

# 3. Extract ID for follow-up operations
ARTIFACT_ID=$(echo "$RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")

# 4. Optionally share
curl -s -X POST "$ARTIFACT_PORTAL_URL/api/artifacts/$ARTIFACT_ID/share" \
  -H "X-API-Key: $ARTIFACT_PORTAL_KEY"
```

---

## Error codes

| HTTP | Code | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Missing or invalid field — check `detail.field` |
| 401 | `INVALID_API_KEY` | Key missing, revoked, or wrong |
| 404 | `NOT_FOUND` | ID doesn't exist, is deleted, or belongs to another key |
| 413 | `FILE_TOO_LARGE` | Over 10 MB |
| 415 | `INVALID_FILE_TYPE` | File must have `.html` or `.htm` extension |

---

## Compliance checklist (summary)

Load `design-contract.md` for full expanded rules. Quick checklist:

Hard requirements — all must be true:

- [ ] Valid HTML5 shell, `<title>` matches publish title, `<!-- design-contract: v1 -->` in `<head>`
- [ ] `<meta name="color-scheme">` declared
- [ ] Opaque body background; `html, body { min-height: 100%; }`
- [ ] No horizontal scroll at 360px; wide blocks scroll inside themselves
- [ ] Layout ≤ 1600px; prose ≤ 72ch
- [ ] Body font-size ≥ 16px at every breakpoint
- [ ] `prefers-reduced-motion` block disables animations/transitions
- [ ] All external `<a>` use `target="_blank" rel="noopener noreferrer"`
- [ ] No storage/cookies/`window.parent` reads
- [ ] Single file; all CSS/JS inline; no relative paths; images inline or HTTPS
- [ ] All external URLs use `https://`; no SRI hashes unless self-computed
- [ ] Adaptive: `portal:theme` postMessage listener + `[data-scheme]` CSS, both light and dark palettes

Strong recommendations — present or skipped with comment:

- [ ] OpenGraph tags OR skip comment
- [ ] Body text contrast ≥ 4.5:1; touch targets ≥ 36px; semantic HTML
- [ ] Google Fonts URLs include `&display=swap`

Source provenance — per-category:

- [ ] **review**: commit SHA or PR ref at top
- [ ] **report**: sources noted at top
- [ ] **spec**: context section at bottom (or omitted)
- [ ] **syndicated content**: visible in-HTML attribution

---

## Gotchas

- **File name must end in `.html` or `.htm`** — the server filters on filename, not Content-Type. When piping from a variable, use `@-;filename=artifact.html`.
- **Slug is immutable and stays reserved on soft-delete** — set the title right on first publish; changing it later doesn't change the URL. Soft-deleting an artifact does NOT release its slug — a new publish with the same title gets a `-2` suffix. To update content without slug churn, use `PUT /api/artifacts/:id/file`. To recover a trashed artifact's slug, restore it first (`POST /api/artifacts/:id/restore`) then replace the file. To find a trashed ID you've lost, use `GET /api/artifacts?trashed_only=true`.
- **Agent share vs owner share** — the agent's `/api/artifacts/:id/share` resets any owner-set password/expiry. If the owner added a password, regenerating via API clears it.
- **Visibility `public` exposes via `/p/:slug`** — the public slug route requires no auth. Only use if intended.
- **`published_by` is the key's name** — artifacts are namespaced to the key name, not the key ID. Revoking a key and creating a new one with the same name preserves the namespace.
- **Owner password** — set during initial setup. To reset: update `password_hash` in `~/.artifact-portal/db.sqlite` with a new bcrypt hash (`node -e "const b=require('bcryptjs');b.hash('newpass',12).then(console.log)"`).
- **Webhook UI enforces `https:`** — `POST /settings/webhooks` rejects any non-`https:` URL (routes/settings.js). To register an `http://localhost` test receiver, insert the row directly via sqlite3 or a one-shot Node script.
- **Webhook success not logged to file** — `~/.artifact-portal/logs/webhook.log` only records failures/errors. Successful deliveries are recorded only in `webhooks.last_status` + `last_triggered_at` in the DB.
- **`/a/:slug`** — authenticated viewer (owner-only, requires login cookie). **`/p/:slug`** — public viewer (no auth, only when `visibility=public`).
- **Sandbox is `allow-scripts allow-popups allow-popups-to-escape-sandbox`** (no same-origin, no top-navigation, no forms). `allow-popups` is required for `target="_blank"` links to work — without it, all link clicks are silently blocked with no error. `allow-popups-to-escape-sandbox` lets new tabs load normally; without it the opened tab inherits the sandbox and breaks on most sites. `allow-scripts` is present — JavaScript, Canvas, WebGL, and HTTPS CDN libraries all work in artifacts. What doesn't work: `fetch()` to the portal's own API (null origin), and storage APIs (already prohibited by design contract).
- **Auth header is `x-api-key`, not `Authorization: Bearer`** — using `Authorization: Bearer` returns `{"code":"INVALID_API_KEY"}` even with a valid key. Always use `X-API-Key: $ARTIFACT_PORTAL_KEY` (or `x-api-key` in lowercase).
- **Upload is multipart/form-data, not JSON** — a JSON body with `content` field returns `400 VALIDATION_ERROR {field: "file"}`. The `file` field must be a form file part.
- **Share URL requires a separate POST** — `POST /api/artifacts` does not return a share URL in the response. Must call `POST /api/artifacts/:id/share` to get `{"token": "...", "url": "..."}`. The `share_token` in the initial response is `null` until this call is made.
- **Trim trailing agent metadata from generated HTML.** Some agent runtimes append metadata (IDs, usage blocks) after `</html>` when HTML is extracted from a tool result. If unhandled, this text renders visibly at the bottom of the artifact. Always trim at `content.rfind('</html>') + len('</html>')` before writing to disk or piping to curl.
- **Agent API cannot read artifact file content.** `GET /artifacts/:id/file` with an `X-API-Key` header returns the SPA shell, not the raw HTML. To update an existing artifact's content, regenerate the HTML from local source state and push it with `PUT /api/artifacts/:id/file` — do NOT soft-delete and republish (that breaks the slug). There is no agent-accessible file-read endpoint.

---

## Companion files

- `design-contract.md` — Design Contract v1: all 11 hard requirements, strong recommendations, source provenance guidance, design freedom, compliance checklist, and minimal compliant template. Load this when generating or reviewing HTML for the portal.
- `reference.md` — Non-prescriptive catalog of fonts, icon sets, JS libraries, and CDN options known to work in the sandboxed iframe. Load this when choosing external resources for an artifact.
- `templates/` — Starter HTML files for each category (`spec.html`, `report.html`, `review.html`, `prototype.html`). Each satisfies the full design contract; replace placeholders and content.
