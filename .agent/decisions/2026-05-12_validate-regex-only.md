---
id: "2026-05-12_validate-regex-only"
type: decision
date: 2026-05-12
scope: "project"
choice: "contract-linter uses regex only — no DOM parser, no new npm dependencies"
---

## Choice

`lib/contract-linter.js` performs all HTML analysis via regex and string matching. No jsdom, cheerio, parse5, or any other HTML parser was added.

## Alternatives considered

- Add `cheerio` as a lightweight DOM query library for cleaner selector-based checks.
- Add `jsdom` for full DOM fidelity (would make heading-order, `<h1>` count, and link checks more accurate).

## Rationale

The linter's purpose is pre-publish signal, not rendering-fidelity validation. Regex is sufficient for all 22 hard requirement checks and fast (pure synchronous, no parse tree). Adding a parser would introduce a new transitive dependency and a headless-DOM process cost. Documented as a known limitation in the skill: "best-effort static analysis, not a rendering guarantee." Revisit only if false-positive rate proves unacceptable in practice.
