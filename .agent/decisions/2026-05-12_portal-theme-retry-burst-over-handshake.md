---
id: "2026-05-12_portal-theme-retry-burst-over-handshake"
type: decision
date: 2026-05-12
scope: "project"
choice: "Use 50ms/250ms retry burst for portal:theme delivery; defer portal:theme:request handshake to future design contract revision"
---

Two options for Race B (parent posts portal:theme before artifact's message listener registers): (a) retry burst in Viewer — simple, no artifact changes; (b) add `portal:theme:request` postMessage handshake to the design contract — correct long-term but requires updating all existing artifacts. Chose (a) for now: zero blast radius, invisible to users, forward-compatible. Design contract can adopt the handshake in a future revision at which point the retries become vestigial and can be removed.
