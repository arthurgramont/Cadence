# Cadence — Notes pour Claude

## Pitch

Cadence est un dashboard de performance et de suivi de matériel pour triathlètes qui automatise le calcul de la charge d'entraînement et prévient l'usure critique des équipements selon des critères kilométriques et temporels.

## Stack technique

- **Langage** : TypeScript
- **Framework front** : Next.js (App Router)
- **Framework back** : Next.js Server Actions
- **DB** : SQLite via Drizzle ORM (local.db)
- **Auth** : Pas d'auth (Format solo de production)
- **Styling** : Tailwind CSS (Couleurs adoucies : text-slate-700/text-slate-300, pas de noir/blanc pur)
- **Tests** : Vitest (Prévu pour J4)

## Règles métier critiques (à NE JAMAIS casser)

1. **Calcul de charge déterministe** : La charge d'une session (`calculatedLoad`) est strictement égale à `duration (en minutes) * RPE`. Ce calcul ne doit jamais être estimé ou inline.
2. **Atomicité des Kilomètres** : L'ajout, la modification ou la suppression d'une session d'entraînement impliquant un équipement (`gearId`) doit mettre à jour de manière atomique la distance cumulée (`distanceCumulated`) de cet équipement dans la même transaction de base de données.
3. **Seuils d'Usure Temporelle & Sécurité** : Les alertes de sécurité s'activent selon trois invariants stricts : kilométrage max dépassé (tous équipements), âge supérieur à 3 ans (casques et combinaisons via `purchaseDate`), ou absence de révision depuis plus d'un an (vélos via `lastMaintenanceDate`).
4. **Validation des Inputs** : Aucune distance négative, aucune durée négative, et le RPE doit être un entier strictement compris entre 1 et 10.

## Conventions de code

- **Nommage fichiers** : kebab-case (`gear-form.tsx`, `actions.ts`)
- **Nommage variables** : camelCase
- **Pas de `any` TypeScript**. Si tu hésites, demande ou utilise des types stricts Drizzle/Next.
- **Pas de `try/except: pass`** — toute erreur dans les Server Actions doit être loggée et retournée proprement à l'UI.
- **Un fichier = une responsabilité**. Si un fichier dépasse 250 lignes, on découpe (notamment dans `src/lib/actions.ts`).

## Scripts déterministes à appeler

Pour les calculs et règles métier, **utilise ces fonctions**, ne les réécris JAMAIS :

- `src/lib/actions.ts` → Regroupe l'ensemble des Server Actions CRUD atomiques et sécurisées pour les sessions et le matériel.
- `scripts/calculate-splits.ts` → (En cours de création) Calculateur déterministe des temps de passage (splits) et des allures cibles.

## Anti-patterns SPÉCIFIQUES au projet

- ❌ Ne JAMAIS appeler le LLM pour faire un calcul de charge ou de delta kilométrique. Utilise les fonctions de la base de données ou des scripts purs.
- ❌ Ne JAMAIS mettre la logique de base de données ou de calcul dans un composant React. Toujours utiliser les Server Actions dans `src/lib/`.
- ❌ Ne JAMAIS hardcoder les seuils d'usure (ex: 800km pour les chaussures, 3 ans pour les casques). Utilise les champs dynamiques de la base de données.

## Anti-patterns d'INGÉNIERIE (les 7 commandements transverses)

1. ❌ **Big bang refacto** : pas de feature flag, pas de coexistence. Remplace, nettoie, commit.
2. ❌ **No stub / no TODO** : pas de `return null; // TODO`. Si commité, ça MARCHE.
3. ❌ **No silent fail** : pas de `try/catch` qui avale. Log ou re-throw.
4. ❌ **No revert** : corrige forward, jamais backward.
5. ❌ **No god file** : >250 lignes = découpe.
6. ❌ **No magic number** : valeurs business ou configurations → variables ou constantes typées.
7. ❌ **No vibe-prompt** : prompt précis ou pas de prompt.

## Commandes utiles

- `npm run dev` → lance le serveur de développement Next.js
- `npx drizzle-kit push` → pousse les modifications du schéma vers `local.db`
- `npx drizzle-kit studio` → ouvre l'interface de visualisation de la base de données

## Fichiers de référence

- `README.md` → présentation utilisateur du projet et de sa structure
- `DECISIONS.md` → journal d'architecture et de suivi des choix techniques (J2)
- `.plan.md` → contrat d'exécution quotidien validé avant développement
- `SKILL.md` → documentation des compétences déterministes et scripts du projet