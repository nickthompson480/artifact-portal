---
id: api-keys-never-plain
statement: API keys are stored as bcrypt hashes only. The plaintext key value exists exactly once — in the response body of POST /settings/api-keys — and is never written to the DB, logged, or returned by any subsequent request.
severity: critical
checkable: true
---

## Why

This is the agent authentication surface. If keys leaked from the DB (file copy, backup, accidental git push of `~/.artifact-portal/db.sqlite`), every key is still safe because the column stores only `bcrypt(plaintext)`. The owner displays the plaintext once in the Settings UI inside an amber callout that auto-dismisses after 20 seconds.

`key_prefix` (first 8 chars) is fine to store and display — it lets the owner recognize keys (`pk_live_a3f9···`) without exposing the secret.

## How to check

```bash
# DB column is named key_hash, never key or plaintext
rg -n 'key_hash|key_prefix' db/ routes/ middleware/

# Generation site: ensure we hash BEFORE insert
rg -n 'bcrypt.hash' routes/settings.js
# expect: hash called before any INSERT INTO api_keys

# Logging: ensure plaintext key never logged
rg -n 'console\.(log|info|debug).*key' routes/
# expect: zero matches that include the plaintext variable
```

## Remediation

If a code path needs to "look up a key by value", the only correct approach is: read all active key rows, `bcrypt.compare(incoming, row.key_hash)` until one matches. Do not add a separate "plaintext index" column.
