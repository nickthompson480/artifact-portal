---
id: "2026-05-11_zsh-glob-url-query-params"
type: lesson
date: 2026-05-11
tags: [zsh, cli, urls, glob]
workstream: ""
session: "2026-05-11T23-57"
---

URLs containing `?` query parameters must be quoted when passed as shell arguments in zsh. Unquoted, zsh interprets `?` as a single-character glob and throws "no matches found" before the script even runs.

Bad:  `twitter-api article https://x.com/user/status/123?s=46`
Good: `twitter-api article "https://x.com/user/status/123?s=46"`

Strip tracking params (`?s=46`) or quote — both work. The `?s=` suffix on X share URLs is a tracking parameter and can be dropped safely.
