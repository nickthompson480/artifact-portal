---
id: 2026-05-12_changelog-in-docs-dir
date: 2026-05-12
type: decision
choice: "Changelog source lives in docs/changelog.html (tracked in git); published to portal via scripts/publish-changelog.sh"
scope: project
---

## Decision

The project changelog is kept as a hand-edited HTML file at `docs/changelog.html` in the repo. It is published to the artifact portal (id: `b5298396-5e3d-463a-b4dd-ed1375baccd4`, slug: `artifact-portal-project-changelog`) via `scripts/publish-changelog.sh`, which overwrites the file on disk and sends a metadata PATCH to bump `updated_at`.

## Why

Keeping the source in git means: version history, diff-ability, easy editing in any session without re-downloading from the portal, and the portal is treated as a display layer rather than the source of truth. The publish script handles the one-way sync.

## Alternatives considered

- Portal-only (no repo copy): loses version history and makes editing harder — must download, edit, re-upload.
- DB-driven changelog (structured table): more queryable but overkill for a single-owner project; HTML is both display and source.
