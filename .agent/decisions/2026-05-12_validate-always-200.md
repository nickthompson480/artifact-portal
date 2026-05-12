---
id: "2026-05-12_validate-always-200"
type: decision
date: 2026-05-12
scope: "project"
choice: "POST /api/validate always returns HTTP 200; valid:false signals HTML failures"
---

## Choice

`POST /api/validate` returns HTTP 200 when linting runs successfully, regardless of whether the HTML passes or fails. The `valid` boolean in the response body conveys pass/fail. HTTP 4xx/5xx are reserved for upload errors (413, 415, 400) and auth failures (401).

## Alternatives considered

- Return HTTP 422 when `valid: false` — would let callers check the HTTP status without parsing JSON.

## Rationale

Linting is not a validation gate on the server — it's a diagnostic tool. "I linted it" and "it passed" are semantically different operations. HTTP 200 means the linting service ran successfully; the response body communicates the findings. This matches ESLint, Stylelint, and GitHub Actions conventions for lint-report endpoints. A 422 would confuse callers expecting 422 to mean "your request was malformed."
