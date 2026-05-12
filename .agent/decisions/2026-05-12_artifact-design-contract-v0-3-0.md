---
id: "2026-05-12_artifact-design-contract-v0-3-0"
type: decision
date: 2026-05-12
choice: "Add a fourth Reference tier to the Design Contract for CDN resource catalog; add HTTPS-only and no-blind-SRI as hard requirements"
scope: "artifact HTML generation"
status: active
---

## Context

The Design Contract v1 had no guidance on what external resources (fonts beyond Google Fonts, icon sets, JS libraries, CDN options) are available and safe to use in sandboxed artifacts. Agents were rediscovering this each session.

## Decision

Extend the Design Contract to v0.3.0 with:

1. A **Reference tier** (fourth tier) — non-prescriptive catalog of known-good fonts, icons, JS libraries, and CDN options. Nothing in it adds to the compliance checklist.
2. Two new **hard requirements** under requirement 10: HTTPS-only for all external URLs; no copy-pasted SRI integrity hashes.
3. A clarified **sandbox CORS bullet**: the iframe has a `null` origin; unauthenticated CDN fetches (`Access-Control-Allow-Origin: *`) work fine — contrasted with credentialed/non-`*` CORS which fails.

## Why

The tier framing was confirmed: folding catalog content into hard requirements over-constrains; putting it in design freedom buries operational gotchas. A separate Reference tier answers "what can I use?" without adding compliance burden.

The HTTPS-only and no-SRI rules were previously implied but not stated — silent failure modes (mixed-content blocking, wrong SRI hashes) warranted explicit promotion.

## Alternatives considered

- Add to strong recommendations: rejected — implies a default preference the skill doesn't want to push
- Document inline in design freedom: rejected — operational gotchas contradict the "be unconstrained" framing
