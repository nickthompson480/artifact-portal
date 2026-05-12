---
id: localhost-only
statement: This project runs on localhost only. Do not add PM2, Nginx, Docker, SSL/Let's Encrypt, systemd, ecosystem.config.js, or any VPS-deployment plumbing.
severity: high
checkable: true
---

## Why

This is intentionally a localhost product. There's no need for HTTPS (it's `127.0.0.1`), no need for a process manager (start it manually or via a `launchd` plist), and no need for a reverse proxy.

Adding these creates maintenance burden disproportionate to the value:
- Nginx solves SSL termination + static-file serving — neither needed at localhost.
- Docker adds an opaque layer with no payoff for a Node + SQLite stack.
- PM2 is overkill; `node --watch` or a `launchd` plist covers auto-start on macOS.

## How to check

```bash
# These files should NOT exist in this repo
ls ecosystem.config.js nginx.conf Dockerfile docker-compose.yml 2>/dev/null
# expect: all "No such file"
```

If a feature genuinely needs background work (e.g. thumbnail generation), use a Node child_process or worker_thread from `server.js` — not an external process manager.

## Remediation

If you find yourself reaching for PM2 or Nginx, stop and ask: "Does this need to survive a reboot? Does it need HTTPS?" If the answer is "no" / "the owner starts it when they want it," that's the whole story. If the answer is genuinely "yes," document the new constraint in `.agent/decisions/` first.
