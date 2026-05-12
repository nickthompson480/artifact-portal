#!/usr/bin/env bash
# Phase 1 smoke test — runs against a fresh local server.
# WARNING: Wipes ~/.artifact-portal before starting. Run manually.
set -euo pipefail

BASE="http://127.0.0.1:3000"
COOKIE=$(mktemp)
PASS=0; FAIL=0

ok() { echo "  ✓ $1"; PASS=$((PASS + 1)); }
fail() { echo "  ✗ $1"; FAIL=$((FAIL + 1)); }
check() { local label="$1"; local body="$2"; local want="$3"
  echo "$body" | grep -q "$want" && ok "$label" || fail "$label: expected '$want' in: $body"; }

echo "=== Resetting data dir ==="
rm -rf ~/.artifact-portal
echo ""

echo "=== Starting server ==="
node server.js &
SERVER_PID=$!
trap "kill $SERVER_PID 2>/dev/null; rm -f $COOKIE" EXIT

for i in $(seq 1 20); do
  curl -sf "$BASE/healthz" > /dev/null && break
  sleep 0.3
done
echo "Server ready (pid $SERVER_PID)"
echo ""

echo "=== Auth ==="
R=$(curl -sf -X POST -H 'Content-Type: application/json' -d '{"password":"hunter2"}' "$BASE/setup")
check "POST /setup ok" "$R" '"ok":true'
R=$(curl -s -X POST -H 'Content-Type: application/json' -d '{"password":"hunter2"}' "$BASE/setup" -o /dev/null -w "%{http_code}")
[ "$R" = "410" ] && ok "POST /setup 410 on repeat" || fail "POST /setup repeat expected 410 got $R"

R=$(curl -sf -X POST -H 'Content-Type: application/json' -d '{"password":"hunter2"}' -c "$COOKIE" "$BASE/login")
check "POST /login ok" "$R" '"ok":true'

R=$(curl -sf -b "$COOKIE" "$BASE/me")
check "GET /me with cookie" "$R" '"ok":true'
R=$(curl -sf "$BASE/me")
check "GET /me without cookie" "$R" '"ok":false'
echo ""

echo "=== API keys ==="
R=$(curl -sf -X POST -H 'Content-Type: application/json' -b "$COOKIE" -d '{"name":"test-agent"}' "$BASE/settings/api-keys")
check "POST /settings/api-keys" "$R" '"key":"pk_live_'
API_KEY=$(echo "$R" | grep -o '"key":"[^"]*"' | cut -d'"' -f4)
echo "  API key: ${API_KEY:0:16}..."

R=$(curl -sf -b "$COOKIE" "$BASE/settings/api-keys")
echo "$R" | grep -q '"key":"pk_live_' && fail "GET /settings/api-keys leaks plaintext key" || ok "GET /settings/api-keys no plaintext key"
echo "$R" | grep -q '"key_hash"' && fail "GET /settings/api-keys leaks key_hash" || ok "GET /settings/api-keys no key_hash"
echo ""

echo "=== Agent artifact upload ==="
ARTIFACT_HTML='<html><body><h1>Test Artifact</h1><p>payment gateway integration spec</p></body></html>'
for i in $(seq 1 5); do
  curl -sf -X POST -H "X-API-Key: $API_KEY" \
    -F "file=@-;filename=artifact-${i}.html" \
    -F "title=Test Artifact $i" \
    -F "tags=q2,payment" \
    "$BASE/api/artifacts" <<< "$ARTIFACT_HTML" > /dev/null
done
ok "Posted 5 artifacts via X-API-Key"

R=$(curl -sf -H "X-API-Key: $API_KEY" "$BASE/api/artifacts?limit=5")
COUNT=$(echo "$R" | grep -o '"id"' | wc -l | tr -d ' ')
[ "$COUNT" = "5" ] && ok "GET /api/artifacts returns 5" || fail "GET /api/artifacts expected 5 got $COUNT"

ARTIFACT_ID=$(echo "$R" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
ARTIFACT_SLUG=$(echo "$R" | grep -o '"slug":"[^"]*"' | head -1 | cut -d'"' -f4)
echo ""

echo "=== Owner list + filters ==="
R=$(curl -sf -b "$COOKIE" "$BASE/artifacts?sort=newest&limit=5")
check "GET /artifacts sort=newest" "$R" '"artifacts":'

R=$(curl -sf -b "$COOKIE" "$BASE/artifacts?tag=q2")
check "GET /artifacts ?tag=q2" "$R" '"artifacts":'
echo "$R" | grep -q '"rapid-q2-api"' && fail "?tag=q2 matched substring" || ok "?tag=q2 no substring match"

R=$(curl -sf -b "$COOKIE" "$BASE/artifacts?q=payment")
check "GET /artifacts ?q=payment FTS" "$R" '"artifacts":'

R=$(curl -s -b "$COOKIE" -o /dev/null -w "%{http_code}" "$BASE/artifacts?q=foo:bar")
[ "$R" = "200" ] && ok "GET /artifacts ?q=foo:bar no crash" || fail "GET /artifacts FTS operator input crashed: $R"
echo ""

echo "=== Soft delete + restore + permanent delete ==="
curl -sf -X DELETE -b "$COOKIE" "$BASE/artifacts/$ARTIFACT_ID" > /dev/null
R=$(curl -sf -b "$COOKIE" "$BASE/artifacts?trash=1")
check "?trash=1 shows deleted" "$R" "$ARTIFACT_ID"

R=$(curl -sf -b "$COOKIE" -X POST "$BASE/artifacts/$ARTIFACT_ID/restore")
check "POST /restore" "$R" '"ok":true'

R=$(curl -s -b "$COOKIE" -o /dev/null -w "%{http_code}" -X DELETE "$BASE/artifacts/$ARTIFACT_ID/permanent")
[ "$R" = "400" ] && ok "DELETE /permanent without ?confirm=1 → 400" || fail "expected 400 got $R"

R=$(curl -sf -b "$COOKIE" -X DELETE "$BASE/artifacts/$ARTIFACT_ID/permanent?confirm=1")
check "DELETE /permanent?confirm=1" "$R" '"ok":true'
echo ""

echo "=== Share token + public routes ==="
ARTIFACT2_ID=$(curl -sf -b "$COOKIE" "$BASE/artifacts?limit=1" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
ARTIFACT2_SLUG=$(curl -sf -b "$COOKIE" "$BASE/artifacts/$ARTIFACT2_ID" | grep -o '"slug":"[^"]*"' | cut -d'"' -f4)

R=$(curl -sf -b "$COOKIE" -X POST "$BASE/artifacts/$ARTIFACT2_ID/share-token")
check "POST /share-token" "$R" '"token":'
TOKEN=$(echo "$R" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

R=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/share/$TOKEN")
[ "$R" = "200" ] && ok "GET /share/:token returns 200" || fail "GET /share/:token expected 200 got $R"

curl -sf -b "$COOKIE" -X DELETE "$BASE/artifacts/$ARTIFACT2_ID/share-token" > /dev/null
R=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/share/$TOKEN")
[ "$R" = "404" ] && ok "GET /share/:token after revoke → 404" || fail "expected 404 got $R"

# Make artifact public for /p/ and /public tests
curl -sf -b "$COOKIE" -X PATCH -H 'Content-Type: application/json' \
  -d '{"visibility":"public"}' "$BASE/artifacts/$ARTIFACT2_ID" > /dev/null

R=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/p/$ARTIFACT2_SLUG")
[ "$R" = "200" ] && ok "GET /p/:slug public → 200" || fail "GET /p/:slug expected 200 got $R"

curl -sf -b "$COOKIE" -X PATCH -H 'Content-Type: application/json' \
  -d '{"visibility":"private"}' "$BASE/artifacts/$ARTIFACT2_ID" > /dev/null
R=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/p/$ARTIFACT2_SLUG")
[ "$R" = "404" ] && ok "GET /p/:slug private → 404" || fail "GET /p/:slug private expected 404 got $R"

curl -sf -b "$COOKIE" -X PATCH -H 'Content-Type: application/json' \
  -d '{"key":"public_index_enabled","value":"true"}' "$BASE/settings" > /dev/null
curl -sf -b "$COOKIE" -X PATCH -H 'Content-Type: application/json' \
  -d '{"visibility":"public"}' "$BASE/artifacts/$ARTIFACT2_ID" > /dev/null
R=$(curl -sf "$BASE/public")
check "GET /public enabled" "$R" '"artifacts":'

curl -sf -b "$COOKIE" -X PATCH -H 'Content-Type: application/json' \
  -d '{"key":"public_index_enabled","value":"false"}' "$BASE/settings" > /dev/null
R=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/public")
[ "$R" = "404" ] && ok "GET /public disabled → 404" || fail "GET /public disabled expected 404 got $R"
echo ""

echo "=== Results ==="
echo "  Passed: $PASS"
echo "  Failed: $FAIL"
echo ""
[ "$FAIL" -eq 0 ] && echo "ALL CHECKS PASSED" && exit 0 || echo "SOME CHECKS FAILED" && exit 1
