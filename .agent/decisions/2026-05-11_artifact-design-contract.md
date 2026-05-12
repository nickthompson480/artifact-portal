---
id: "2026-05-11_artifact-design-contract"
type: decision
date: 2026-05-11
scope: "project"
choice: "Artifact HTML design contract v1 lives in CLAUDE.md and docs — not in .agent/rules (which governs the codebase, not artifact content)"
---

## Choice

Established a Design Contract for all HTML artifacts published to the portal. Hard requirements (color-scheme meta tag, min-height, overflow-x hidden, ultra-wide clamp, font-size floor, prefers-reduced-motion, target=_blank on external links, no storage APIs, single self-contained file, contract stamp) and strong recommendations (adaptive color scheme via `[data-scheme]`, OG tags, contrast, touch targets, semantic HTML) are documented in `CLAUDE.md`.

## Alternatives considered

- Add rules to `.agent/rules/` — rejected: existing rules govern the portal *codebase*; design contract governs artifact *content*. Mixing the two scopes confuses future agents.
- No formal contract — rejected: without a contract, artifacts were missing `color-scheme`, `prefers-reduced-motion`, ultra-wide clamps, and correct external link attributes.

## Rationale

CLAUDE.md is the right home because it's already where agents look for publishing guidance, and it can be versioned alongside the codebase. A `v1` contract stamp in HTML head lets future audits know which contract a given artifact was built against.
