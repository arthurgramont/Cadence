# SKILL.md — Skills déterministes Cadence

> Un skill est un script autonome, sans effet de bord non documenté, dont le résultat est reproductible à partir des mêmes entrées.
> Chaque skill est soit un wrapper CLI, soit un script de service interne.

---

## Skill 1 — `audit-dette` (gate de qualité)

**Script** : `scripts/audit-dette.ts`  
**Invocation** :

```bash
npx tsx scripts/audit-dette.ts
```

**Ce que ça fait** : Scanne tous les fichiers `.ts` et `.tsx` du projet sur 5 axes de dette technique :

| Axe | Seuil de blocage |
|---|---|
| Taille de fichier | > 250 lignes |
| Typage | `any` explicite |
| Marqueurs oubliés | `TODO` / `FIXME` |
| Stubs vides | Corps de fonction vide |
| Logs de debug | `console.log` dans le code source |

**Sortie** : Score global en pourcentage. `exit 0` si 100 %, `exit 1` sinon.

**Contrat** : Doit être lancé après **chaque** modification de fichier TypeScript avant tout commit.  
Score actuel : **100 %** (vérifié en fin de J3).

---

## Skill 2 — `calculate-splits` (calculateur d'allures)

**Script** : `scripts/calculate-splits.ts`  
**Invocation** :

```bash
# Usage : npx tsx scripts/calculate-splits.ts <distanceKm> <tempsSecondes>
npx tsx scripts/calculate-splits.ts 10 2340        # 10 km en 39:00
npx tsx scripts/calculate-splits.ts 21.0975 6300   # Semi en 1h45
npx tsx scripts/calculate-splits.ts 42.195 12600   # Marathon en 3h30
```

**Ce que ça fait** : Wrapper CLI autour de `src/lib/utils/splits.ts`. Calcule l'allure cible et le tableau de passage kilomètre par kilomètre pour une distance et un temps cible donnés.

**Source de vérité partagée** : La logique pure réside dans `src/lib/utils/splits.ts`, importé à la fois par ce script CLI et par `src/app/tools/` (interface web). Garantit la cohérence CLI ↔ UI.

**Format de sortie** :

```
Distance : 10.00 km
Temps cible : 39:00
Allure : 3:54 /km

Split  1 km : passage  3:54
Split  2 km : passage  7:48
...
```

---

## Skill 3 — `export-logs` (export des logs système)

**Script** : `scripts/export-logs.mjs`  
**Invocation** :

```bash
# Export CSV (défaut)
node scripts/export-logs.mjs > logs_export.csv

# Export Markdown
node scripts/export-logs.mjs --md > logs_export.md
```

**Ce que ça fait** : Lit `storage/logs.json` (500 entrées max, tournante) et le formate en CSV ou Markdown sur stdout. Utile pour l'audit des actions utilisateur, l'export vers un outil externe (n8n, Make, tableur) ou la documentation post-mortem.

**Colonnes exportées** : `id`, `timestamp`, `level` (`INFO` / `ACTION` / `ERROR`), `message`, `context` (JSON sérialisé).

**Prérequis** : Le fichier `storage/logs.json` doit exister (créé automatiquement par l'application au premier log). En développement : `npm run dev` puis effectuer une action (ajout de session ou de matériel).

---

## Skill 4 — `generate-api-docs` (documentation API)

**Skill Claude** : `.claude/skills/generate-api-docs/`  
**Invocation** : via `/generate-api-docs` dans Claude Code

**Ce que ça fait** : Inspecte les Server Actions dans `src/lib/actions/` et génère une documentation API structurée (`API_REFERENCE.md`) décrivant les signatures, les paramètres, les types de retour et les règles de validation de chaque action.

**Résultat** : `API_REFERENCE.md` à la racine du projet.

---

## Règle transverse

Aucun skill ne doit :
- Faire appel à un LLM pour calculer un résultat déterministe
- Modifier la base de données directement (hors `migrate.mjs`)
- Produire un résultat non reproductible à partir des mêmes entrées
