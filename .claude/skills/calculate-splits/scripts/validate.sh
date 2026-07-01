#!/usr/bin/env bash
# Calcule les splits pour une session donnée.
# Usage : ./validate.sh <distance_km> <duree_min>
set -euo pipefail

DISTANCE=${1:-}
DUREE=${2:-}

if [[ -z "$DISTANCE" || -z "$DUREE" ]]; then
  echo "Usage: $0 <distance_km> <duree_min>" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"

cd "$ROOT"
npx tsx scripts/calculate-splits.ts "$DISTANCE" "$DUREE"
