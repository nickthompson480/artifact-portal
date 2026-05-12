---
choice: Recommendations accepted for all 5 Phase 5 open questions
scope: project-wide
date: 2026-05-11
---

Decisions locked for when Phase 5 work begins:

**Thumbnails**: Start with title-card fallback (category color + first heading). Add Puppeteer in ws-thumbnails only after real content exists. Avoids 50MB dependency with no ROI at low artifact counts.

**Why:** Puppeteer matters at 200+ artifacts; title-card is already in the prototype design.

**Version history trigger**: Re-publishing the same slug auto-creates a new version. No explicit endpoint.

**Why:** Agents naturally overwrite; silent versioning matches the publishing workflow.

**Collections**: `col/*` tag prefix only — no DB table until usage proves what "collection" means.

**Why:** Final Recommendation explicitly recommended this. Let real data drive the schema.

**Analytics**: Log views on `/share/:token` and `/p/:slug` only (not authenticated owner sessions). Store `artifact_id + timestamp + ip_hash + referrer`. Show count on share-linked cards only.

**Why:** The value is knowing if shared specs got read, not tracking self.

**Webhooks**: Single URL, HMAC-signed (`X-Webhook-Signature: sha256=...`). No event filtering until there's more than one consumer.

**Why:** Simple and secure. HMAC is two lines; you'll want it the first time you automate off it.
