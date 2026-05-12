---
id: design-token-fidelity
statement: All colors, fonts, spacing, radii, and transitions in the React frontend must come from CSS custom properties defined in colors_and_type.css. Hardcoded hex values, pixel sizes, or font names in component code are forbidden.
severity: high
checkable: true
---

## Why

The design system is locked. The token values in `frontend/src/styles/colors_and_type.css` are the source of truth — every component references them by name. Allowing one-off hex literals in components silently fragments the design system; the next theme change breaks unevenly.

## How to check

```bash
# In the frontend source, the only places that should contain hex colors are:
#   - src/styles/colors_and_type.css (copy of the design tokens)
#   - utility helpers that map category → category color (which themselves return CSS var() refs)
rg -n '#[0-9A-Fa-f]{3,8}' frontend/src --glob '!styles/colors_and_type.css'
# Expect: zero matches in components/views/.
```

Permitted exceptions:
- The `colors_and_type.css` file itself.
- HTML strings that get rendered inside the artifact viewer iframe (those are user/agent content, not portal UI).
- Test fixtures.

## Remediation

If a hex value is needed for something not in the token set, add a new CSS variable to `colors_and_type.css` first, then reference it via `var(--name)`.
