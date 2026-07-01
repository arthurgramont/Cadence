#!/usr/bin/env bash
# Lance le double-gate qualité : tests + audit de dette technique.
# Exit 0 = tout est vert. Exit 1 = au moins une violation.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"

cd "$ROOT"

echo "=== npm test ==="
npm test

echo ""
echo "=== audit-dette ==="
npx tsx scripts/audit-dette.ts
