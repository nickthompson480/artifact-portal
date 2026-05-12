---
id: "2026-05-12_macos-base64-requires-i-flag"
type: lesson
date: 2026-05-12
tags: [macos, bash, base64, images]
workstream: ""
session: "2026-05-12T05-19"
routed_to: ["create.gemini-imagen"]
---

On macOS, `base64 /path/to/file` exits with an error ("invalid argument"). The correct form is `base64 -i /path/to/file -o /tmp/output-b64.txt`. Linux base64 takes positional args; macOS base64 requires `-i`/`-o` flags. Any script or skill doc that shows `base64 /tmp/file.png` will fail silently on Mac.
