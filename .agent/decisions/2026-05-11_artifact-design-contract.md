---
id: "2026-05-11_artifact-design-contract"
type: decision
date: 2026-05-11
scope: "project"
choice: "Artifact HTML design contract v1 captured in web.artifact-portal skill (not in project rules or CLAUDE.md)"
---

## Choice

Established a two-tier Design Contract for all HTML artifacts published to the portal. Hard requirements (color-scheme, min-height, overflow-x, ultra-wide clamp, font-size floor, prefers-reduced-motion, target=_blank, no storage, single file, contract stamp) and strong recommendations (adaptive color scheme, OG tags, contrast, touch targets, semantic HTML) are documented in `web.artifact-portal` SKILL.md v0.2.0, not in this project's `.agent/rules/` or `CLAUDE.md`.

## Alternatives considered

- Add rules to `.agent/rules/` — rejected: existing rules govern the portal *codebase*; design contract governs artifact *content*. Mixing the two scopes would confuse future agents.
- Add rules to `CLAUDE.md` — rejected: CLAUDE.md would become a competing source of truth with the skill, which is cross-project and versioned.
- No formal contract — rejected: articles were already missing `color-scheme`, `prefers-reduced-motion`, ultra-wide clamps, and correct external link attributes.

## Rationale

The skill is the right home because (a) it's already the publication gateway — agents read it before publishing, (b) it's shared across projects so the contract applies everywhere artifacts are created, not just in this project's sessions, and (c) it can be versioned independently (`v1` stamp in HTML head lets future audits know which contract a given artifact was built against).
