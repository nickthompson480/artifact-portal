---
id: "2026-05-11_key-prefix-12-chars"
type: decision
date: 2026-05-11
scope: "ws-owner-api"
choice: "API key prefix stored as key.slice(0, 12), not slice(0, 8) as SPEC stated"
---

## Choice

`key_prefix` stored in `api_keys` table and used in `requireApiKey` middleware is the first **12** characters of the key (`pk_live_` + 4 random chars), not 8.

## Alternatives considered

- `slice(0, 8)` — matches SPEC literally, but this equals `'pk_live_'` for every key: identical prefix for all keys, UI shows `pk_live_••••••••` for every entry with no distinguishing info.
- `slice(0, 16)` — more unique, but reveals more of the random portion than necessary.

## Rationale

`slice(0, 8)` is entirely the constant prefix `pk_live_` — it provides no information about which key is which (neither for the middleware short-circuit nor for the UI display). 12 chars includes 4 random chars that make keys visually distinguishable in Settings and allow the middleware to short-circuit on a meaningful prefix. SPEC is updated accordingly.
