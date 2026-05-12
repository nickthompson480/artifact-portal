---
id: "2026-05-12_portal-sandbox-allow-scripts-already-active"
type: lesson
date: 2026-05-12
tags: [sandbox, iframe, javascript, portal]
workstream: ""
session: "2026-05-12T05-19"
routed_to: ["web.artifact-portal"]
---

The portal iframe sandbox is `allow-scripts allow-popups allow-popups-to-escape-sandbox`. `allow-scripts` is present — JavaScript is fully supported in artifacts. Agents should not constrain artifact design assuming a no-JS environment. External CDN libraries (Chart.js, D3, Three.js, etc.) via HTTPS work. What doesn't work is `allow-same-origin` — the iframe has null origin, so fetch() to the portal API and storage APIs are blocked, but that is intentional and already documented in the design contract.
