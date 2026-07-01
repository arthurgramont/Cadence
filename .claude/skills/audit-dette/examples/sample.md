# Exemple — Audit réussi (score 100%)

## Score global : 100%

## Fichiers analysés

| Fichier                        | Lignes | Violations | Statut |
|-------------------------------|--------|------------|--------|
| src/lib/actions/gear.ts       | 187    | 0          | ✅ OK  |
| src/lib/actions/sessions.ts   | 203    | 0          | ✅ OK  |
| src/app/dashboard/page.tsx    | 94     | 0          | ✅ OK  |
| src/db/schema.ts              | 68     | 0          | ✅ OK  |
| scripts/calculate-splits.ts   | 41     | 0          | ✅ OK  |

## Violations détectées

Aucune violation détectée.

## Résultat du double-gate

- `npm test`                        : ✅ PASS (12 tests, 0 échecs)
- `npx tsx scripts/audit-dette.ts`  : ✅ PASS (score 100%)

## Conclusion

Le codebase respecte l'intégralité du contrat de qualité. Commit autorisé.
