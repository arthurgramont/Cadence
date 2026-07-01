# Rapport d'Audit de Dette Technique — {{DATE}}

## Score global : {{SCORE}}%

## Fichiers analysés

| Fichier | Lignes | Violations | Statut |
|---------|--------|------------|--------|
{{FILES_ROWS}}

## Violations détectées

{{VIOLATIONS_LIST}}

## Résultat du double-gate

- `npm test`               : {{TEST_STATUS}}
- `npx tsx scripts/audit-dette.ts` : {{AUDIT_STATUS}}

## Conclusion

{{CONCLUSION}}
