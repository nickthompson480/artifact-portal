---
id: ws-skill-artifact-portal
title: web.artifact-portal skill — correctness fixes, structural cleanup, multi-file split
state: active
depends_on: []
summary: Three-phase improvement of the web.artifact-portal skill driven by a structural Opus review and the published SWOT article (bfc20f3b, 2026-05-12). Fix two correctness bugs, restructure the single file, then split into a thin entry + lazy-load companions and add skeletal per-category provenance scaffolds.
---

## Background

The skill was independently reviewed twice on 2026-05-12:
- **Structural Opus review** (conversation): identified a factual contradiction about `allow-popups`, a frontmatter name mismatch, duplication, wrong requirement ordering, and a Reference section too large for its tier.
- **SWOT article** (`bfc20f3b`): identified that the skill is already doing too much in one file, agents are skimming and missing things, the Reference tier has no freshness signal, and a multi-file split is the right architecture.

All work is in `$AEK_ROOT/skills/web.artifact-portal/`. No portal server or frontend changes.

## What done looks like

**Phase 1**: `allow-popups` contradiction resolved across all affected locations; frontmatter name matches directory and all CLAUDE.md references; AEK file-index registry refreshed.

**Phase 2**: Single-file skill has no contradictions, no triple-stated rules, no buried footguns, no numbered cross-references. Adaptive color is HR #2. PATCH footgun appears inline in the Update metadata section. Skill has `skill-version` and `contract-version` in frontmatter. Reference tier has a single freshness annotation (not per-row). Opus review checkpoint passed.

**Phase 3**: SKILL.md is ≤ 320 lines (operational core only). `design-contract.md` and `reference.md` exist and are cross-linked from SKILL.md. `templates/` contains four design-neutral per-category provenance scaffolds. Final Opus review passed.

## Acceptance

Phase 1:
```bash
grep "^name:" $AEK_ROOT/skills/web.artifact-portal/SKILL.md
# → name: web.artifact-portal

grep -nE 'allow-(popups|top-navigation|forms|same-origin)' $AEK_ROOT/skills/web.artifact-portal/SKILL.md
# → all occurrences consistent with Gotchas (allow-scripts allow-popups allow-popups-to-escape-sandbox)
```

Phase 2:
```bash
grep -n "Adaptive color\|adaptive color" $AEK_ROOT/skills/web.artifact-portal/SKILL.md | head -3
# → requirement appears at position #2
grep -n "silently ignored" $AEK_ROOT/skills/web.artifact-portal/SKILL.md
# → appears in Update metadata section
grep "skill-version\|contract-version" $AEK_ROOT/skills/web.artifact-portal/SKILL.md
# → both present
grep -n 'hard requirement #' $AEK_ROOT/skills/web.artifact-portal/SKILL.md
# → zero matches (replaced with stable names)
```

Phase 3:
```bash
wc -l $AEK_ROOT/skills/web.artifact-portal/SKILL.md    # → ≤ 320
ls $AEK_ROOT/skills/web.artifact-portal/templates/     # → 4 files
grep "design-contract.md" $AEK_ROOT/skills/web.artifact-portal/SKILL.md  # → ≥ 1 match
grep "reference.md" $AEK_ROOT/skills/web.artifact-portal/SKILL.md        # → ≥ 1 match
```

## Out of scope

- Portal server or frontend code changes
- Automated contract linter (`POST /api/validate`) — separate workstream
- MCP connector work
- Backup / observability improvements
- Revising the Design Contract rules themselves (reorganizing and deduplicating only)
