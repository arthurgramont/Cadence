#!/usr/bin/env bash
# Scan des routes et Server Actions disponibles dans l'application Cadence.
# Usage : .claude/skills/generate-api-docs/scripts/validate.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
ACTIONS_DIR="$ROOT/src/lib/actions"
ROUTES_DIR="$ROOT/src/app"

echo "============================================="
echo "  Cadence — Scan des endpoints disponibles"
echo "============================================="
echo ""

# --- Server Actions ---
echo "## Server Actions (src/lib/actions/)"
echo ""

if [ ! -d "$ACTIONS_DIR" ]; then
  echo "  [ERREUR] Dossier $ACTIONS_DIR introuvable."
  exit 1
fi

for file in "$ACTIONS_DIR"/*.ts; do
  filename=$(basename "$file")
  echo "### $filename"
  # Extraire les fonctions exportées (async ou non)
  grep -n "^export async function\|^export function" "$file" | \
    sed "s/^/  /" || echo "  (aucune fonction exportée détectée)"
  echo ""
done

# --- Routes Next.js App Router ---
echo "## Routes Next.js (src/app/)"
echo ""

find "$ROUTES_DIR" -name "page.tsx" | sort | while read -r page; do
  # Chemin relatif depuis src/app
  rel="${page#$ROUTES_DIR}"
  # Construire la route URL (supprimer /page.tsx, garder les segments dynamiques)
  route=$(echo "$rel" | sed 's|/page\.tsx$||')
  [ -z "$route" ] && route="/"
  echo "  $route  →  src/app${rel}"
done

echo ""
echo "============================================="
echo "  Scan terminé. Remplir template.md avec"
echo "  les signatures ci-dessus."
echo "============================================="
