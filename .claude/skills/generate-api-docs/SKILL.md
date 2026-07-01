# Skill : generate-api-docs

## Objectif

Génère ou met à jour le fichier `API_REFERENCE.md` en documentant tous les endpoints (Server Actions et routes Next.js) de l'application Cadence dans un format standardisé et lisible.

## Quand l'utiliser

Invoquer ce skill lorsque l'utilisateur demande :
- La documentation des endpoints ou Server Actions de l'application
- La génération ou mise à jour de `API_REFERENCE.md`
- Un inventaire des routes disponibles dans l'app
- "Documente l'API", "liste les endpoints", "génère la référence API"

## Comment l'invoquer

1. Lancer le scan des routes disponibles :
   ```bash
   .claude/skills/generate-api-docs/scripts/validate.sh
   ```
2. Lire les fichiers Server Actions dans `src/lib/actions/` :
   - `sessions.ts` → CRUD des sessions d'entraînement
   - `gear.ts` → CRUD du matériel
   - `notifications.ts` → alertes d'usure
   - `shared.ts` → utilitaires partagés
3. Pour chaque action exportée, remplir un bloc du modèle `template.md`.
4. Écrire le résultat dans `API_REFERENCE.md` à la racine du projet.

## Structure de documentation attendue par endpoint

Pour chaque Server Action ou route :

| Champ       | Description                                              |
|-------------|----------------------------------------------------------|
| Nom         | Nom de la fonction exportée                              |
| Fichier     | Chemin relatif depuis `src/`                             |
| Paramètres  | Types stricts (jamais `any`) avec description            |
| Retour      | Type de retour — `{ success: true, data }` ou `{ success: false, error }` |
| Effet DB    | Opération Drizzle effectuée (insert / update / delete / select) |
| Règle métier| Invariant critique respecté (ex. atomicité des km)       |

## Règles de qualité

- Ne jamais documenter un type `any` — si présent, signaler comme dette technique
- Chaque Server Action retourne `{ success: boolean }` — le documenter explicitement
- Les calculs de charge (`duration * RPE`) et les mises à jour atomiques de km doivent apparaître dans "Règle métier"
- Ne pas inventer de routes : scanner uniquement les fichiers réels

## Sortie attendue

Voir `template.md` pour le squelette et `examples/sample.md` pour un exemple complet d'endpoint documenté.
