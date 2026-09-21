#!/bin/bash
# Records the terminal sessions shown on the website by running the built CLI in throwaway
# repositories. Output lands in scripts/site/recordings/*.txt, one file per block, and
# scripts/site/check-transcripts.mjs verifies that every transcript line on the site appears
# verbatim in one of them.
#
# Re-run only when CLI output changes (a re-recording pass), then update the blocks on the site
# to match: commit hashes, test durations, and file counts differ between runs, so a fresh
# recording invalidates the site until the blocks are updated.
#
# Usage, from the repository root:   pnpm build && bash scripts/site/record-transcripts.sh
set -u
ROOT=$(git rev-parse --show-toplevel)
CLI="$ROOT/dist/cli.js"
[ -f "$CLI" ] || { echo "build first: pnpm build" >&2; exit 1; }
OUT="$ROOT/scripts/site/recordings"
WORK=$(mktemp -d)
mkdir -p "$OUT" "$WORK/bin"
rm -f "$OUT"/*.txt

# The generated hooks call `persist`, so put a shim on PATH for the duration of the run.
printf '#!/bin/sh\nexec node "%s" "$@"\n' "$CLI" > "$WORK/bin/persist"
chmod +x "$WORK/bin/persist"
export PATH="$WORK/bin:$PATH"

rec() { local name=$1; shift; { printf '$ %s\n' "$*"; "$@"; echo "[exit $?]"; } >> "$OUT/$name.txt" 2>&1; }
recsh() { local name=$1; shift; { printf '$ %s\n' "$*"; bash -c "$*"; echo "[exit $?]"; } >> "$OUT/$name.txt" 2>&1; }
gitsetup() { git init -q -b main && git config user.email dev@example.com && git config user.name "dev"; }

cart_ok() {
  cat > src/cart.js <<'EOF'
function total(items) {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}
module.exports = { total };
EOF
}
cart_broken() {
  cat > src/cart.js <<'EOF'
function total(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
module.exports = { total };
EOF
}

# ---------- orders-api: an empty repository ----------
mkdir -p "$WORK/orders-api" && cd "$WORK/orders-api" && gitsetup
rec init-empty persist init
rec doctor-fresh persist doctor
rec adr-create persist adr create "Use PostgreSQL for primary storage"
recsh adr-status-before "sed -n '1,5p' docs/adrs/ADR-0001-use-postgresql-for-primary-storage.md"
rec adr-accept persist adr accept use-postgresql-for-primary-storage
recsh adr-status-after "sed -n '1,5p' docs/adrs/ADR-0001-use-postgresql-for-primary-storage.md"
rec doctor-after-adr persist doctor
recsh doctor-json "persist doctor --json"
rec feature-2 persist feature create checkout
rec skill-list persist skill list
rec adr-supersede persist adr supersede use-postgresql-for-primary-storage "Use SQLite for primary storage"
rec module-create persist module create billing
rec doctor-with-module persist doctor
rec mcp-add-dry persist mcp add figma --dry-run
rec test-gate-skipped persist test-gate
mv .persist/hooks/pre-push "$WORK/pre-push.bak"
rec doctor-hookmissing persist doctor
mv "$WORK/pre-push.bak" .persist/hooks/pre-push

# ---------- orders-api-ts: a one-shot test script, the test gate, and pre-push ----------
mkdir -p "$WORK/orders-api-ts/src" "$WORK/orders-api-ts/tests" && cd "$WORK/orders-api-ts" && gitsetup
cat > package.json <<'EOF'
{
  "name": "orders-api",
  "version": "1.4.0",
  "private": true,
  "scripts": {
    "test": "node --test --watch",
    "test:run": "node --test"
  }
}
EOF
cart_ok
cat > tests/cart.test.js <<'EOF'
const test = require("node:test");
const assert = require("node:assert/strict");
const { total } = require("../src/cart.js");

test("totals a cart", () => {
  assert.equal(total([{ price: 19, qty: 1 }, { price: 5, qty: 2 }]), 29);
});
EOF
rec init-ts persist init --features
rec feature-3 persist feature create checkout
rec test-gate-pass persist test-gate
cart_broken
rec test-gate-fail persist test-gate
cart_ok
rm -rf docs/40-features/F-001-checkout
git config core.hooksPath .persist/hooks
git add -A >/dev/null && git commit -q -m "Add repository memory"
recsh hooks-files "cat .persist/hooks/pre-commit; echo ---; tail -3 .persist/hooks/pre-push"
git init -q --bare "$WORK/origin.git"
git remote add origin ../origin.git
cart_broken
git add -A >/dev/null && git -c core.hooksPath=/dev/null commit -q -m "Refactor cart total"
rec push-blocked git push -u origin main
cart_ok
git add -A >/dev/null && git -c core.hooksPath=/dev/null commit -q -m "Fix cart total"
rec push-ok git push -u origin main

# ---------- billing-service: the pre-commit hook firing ----------
mkdir -p "$WORK/billing-service" && cd "$WORK/billing-service" && gitsetup
persist init >/dev/null
rec hooks-enable-2 git config core.hooksPath .persist/hooks
git add -A >/dev/null
rec commit-ok git commit -m "Add repository memory"
rm docs/00-product/PRODUCT.md
git add -A >/dev/null
rec commit-blocked git commit -m "Remove the product file"
git reset -q --hard
persist feature create checkout >/dev/null
git add -A >/dev/null
rec commit-warnings git commit -m "Plan the checkout feature"
recsh commit-warnings-log "git log --oneline"

# ---------- notes-cli: fresh memory outside git ----------
mkdir -p "$WORK/notes-cli" && cd "$WORK/notes-cli"
persist init >/dev/null
rec doctor-nogit persist doctor

# ---------- scratch: dry run and help ----------
mkdir -p "$WORK/scratch-dry" && cd "$WORK/scratch-dry"
rec init-dry-run persist init --dry-run
rec help persist --help

# ---------- legacy-shop: an existing Next.js app, adopt ----------
mkdir -p "$WORK/legacy-shop/src/app" && cd "$WORK/legacy-shop" && gitsetup
cat > package.json <<'EOF'
{
  "name": "legacy-shop",
  "version": "3.2.1",
  "private": true,
  "scripts": { "dev": "next dev", "build": "next build", "test": "vitest" },
  "dependencies": { "next": "14.2.5", "react": "18.3.1", "react-dom": "18.3.1", "@prisma/client": "5.16.1" },
  "devDependencies": { "typescript": "5.5.3", "vitest": "2.0.3", "prisma": "5.16.1" }
}
EOF
echo '{ "compilerOptions": { "strict": true, "jsx": "preserve" } }' > tsconfig.json
echo "lockfileVersion: '9.0'" > pnpm-lock.yaml
echo 'export default function Page() { return null; }' > src/app/page.tsx
rec adopt persist adopt
recsh adopt-report "sed -n '1,40p' docs/adopt/ADOPTION_REPORT.md"
recsh adopt-proposed "ls docs/adrs/proposed"

# --- The Chesterton fence loop: a crossing, the recorded reason, and the reason coming back ---
mkdir -p "$WORK/fence" && cd "$WORK/fence" && gitsetup
persist init --yes > /dev/null 2>&1
mkdir -p src && printf 'export function writeOrder(order) {\n  // ledger and audit trail in one transaction\n}\n' > src/billing.js
git add -A > /dev/null && git commit -qm "Add billing" > /dev/null
printf 'export function writeOrder(order) {\n  // simplified\n}\n' > src/billing.js
git add src/billing.js
rec fence-crossing persist doctor
rec fence-add persist fence add src/billing.js --why "Writes four collections in one transaction so the ledger and the audit trail cannot diverge." --by "Priya"
rec fence-answered persist doctor
recsh fence-file "cat docs/60-engineering/FENCES.md"

echo "recorded $(ls "$OUT" | wc -l | tr -d ' ') blocks into $OUT (work dir: $WORK)"
