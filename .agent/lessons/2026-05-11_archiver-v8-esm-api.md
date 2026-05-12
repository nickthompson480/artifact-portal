---
id: 2026-05-11_archiver-v8-esm-api
date: 2026-05-11
tags: [esm, dependencies, archiver, breaking-change]
workstream: ws-export
---

## Lesson

`archiver` v8 dropped the default export and the `archiver('zip', opts)` factory function entirely. It is now a pure ESM package with named class exports.

**Old (v7 and below):**
```js
import archiver from 'archiver';
const archive = archiver('zip', { zlib: { level: 6 } });
```

**New (v8+):**
```js
import { ZipArchive } from 'archiver';
const archive = new ZipArchive({ zlib: { level: 6 } });
```

The `"type": "module"` in archiver's package.json combined with no `default` export causes a hard boot crash: `SyntaxError: The requested module 'archiver' does not provide an export named 'default'`.

Check `node_modules/archiver/index.js` for the current named exports when upgrading.
