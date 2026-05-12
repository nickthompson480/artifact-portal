---
id: slug-immutable
title: Slugs are immutable after creation
choice: "PATCH /artifacts/:id does not re-derive the slug when title changes"
scope: routes/api.js, routes/artifacts.js
date: 2026-05-11
---

## Decision

Slug is computed once at artifact creation (`uniqueSlug(title)`) and never updated on subsequent PATCH operations, even if the title changes.

## Why

`/p/<slug>` is a public shareable URL. Re-deriving the slug on title change silently breaks any shared link or bookmark. The workstream docs originally implied re-derivation — this decision overrides them.

Slug uniqueness is enforced across **all** artifacts including soft-deleted ones (the UNIQUE constraint in schema.sql), so restore operations never create slug conflicts.

## Tradeoff

A typo in the original title is permanently baked into the slug. Acceptable for a single-user portal — the owner knows their artifacts and can set a clean title before the first publish.
