---
id: "2026-05-12_iframe-location-replace-over-src"
type: decision
date: 2026-05-12
scope: "project"
choice: "Drive iframe navigation via contentWindow.location.replace() instead of declarative src attribute"
---

Setting `src` declaratively on the artifact viewer iframe pushed joint session history entries into the top-level browsing context, breaking `navigate(-1)` (Back button consumed invisible iframe entries). `location.replace()` navigates the iframe without creating any history entry. Single-file fix, no call-site changes, backward-compatible fallback to `src` assignment if `contentWindow` is unavailable.
