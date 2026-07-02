# Cadence

Dashboard de performance et de suivi de matériel pour triathlètes.  
Cadence automatise le calcul de la charge d'entraînement et prévient l'usure critique des équipements selon des critères kilométriques et temporels stricts.

---

## Fonctionnalités

- **Dashboard hebdomadaire** — charge d'entraînement totale et par discipline (natation, vélo, course) calculée via la méthode Foster (durée × RPE)
- **CRUD sessions** — ajout, édition, suppression avec mise à jour atomique du kilométrage matériel dans la même transaction
- **CRUD matériel** — gestion du parc équipement avec seuils d'usure dynamiques, alertes kilométriques et temporelles (âge casque/combinaison > 3 ans, révision vélo > 1 an)
- **Calculateur de splits** — interface web + CLI ; prend une distance et un temps cible, retourne l'allure et le tableau de passage kilomètre par kilomètre
- **Export webhook** — envoi du plan d'allures en Markdown vers Slack, Discord ou tout service compatible (n8n, Make, Zapier)

## Stack technique

| Couche | Technologie |
|---|---|
| Langage | TypeScript (strict, zéro `any`) |
| Framework | Next.js 16 (App Router, Turbopack) |
| Mutations | Next.js Server Actions (`'use server'`) |
| Base de données | SQLite via Drizzle ORM (`local.db`) |
| Styling | Tailwind CSS (palette adoucie `slate-*`) |
| Tests | Vitest (`vitest run`) |
| Auth | Aucune (usage solo) |

---

## Lancement Instantané (Option Docker recommandé pour l'évaluation)

```bash
docker compose up --build
# → http://localhost:3000
```

Aucune dépendance locale requise — Node.js, SQLite et les migrations sont encapsulés dans le conteneur.

---

## Démarrage rapide (développement local)

```bash
# 1. Installer les dépendances
npm install

# 2. Pousser le schéma vers la base locale
npx drizzle-kit push

# 3. Lancer le serveur de développement
npm run dev
# → http://localhost:3000
```

### Scripts utiles

```bash
# Lancer la suite de tests (39 tests, couverture critique)
npm test

# Calculateur de splits en CLI
# Usage : npx tsx scripts/calculate-splits.ts <distanceKm> <tempsSecondes>
npx tsx scripts/calculate-splits.ts 10 2340        # 10 km en 39:00
npx tsx scripts/calculate-splits.ts 21.0975 6300   # Semi en 1h45
npx tsx scripts/calculate-splits.ts 42.195 12600   # Marathon en 3h30

# Auditeur de dette technique (score de santé du code)
npx tsx scripts/audit-dette.ts
# Score actuel : 100 % — zéro violation

# Export des logs système
node scripts/export-logs.mjs           # CSV (défaut)
node scripts/export-logs.mjs --md      # Markdown
node scripts/export-logs.mjs > logs_export.csv

# Lancer les migrations manuellement (hors Docker)
node scripts/migrate.mjs

# Visualiser la base de données
npx drizzle-kit studio
```

---

## Architecture

```
src/
├── app/                        # Pages Next.js (App Router)
│   ├── page.tsx                # Dashboard (Server Component)
│   ├── sessions/               # CRUD sessions
│   ├── gear/                   # CRUD matériel
│   ├── tools/                  # Calculateur de splits (UI)
│   └── admin/logs/             # Visualisation des logs système
├── components/
│   ├── SportBadge.tsx          # Badge sport partagé
│   ├── DeleteConfirmButton.tsx
│   └── ui/form.tsx             # inputClass, selectClass, FormField (partagés)
├── db/
│   ├── schema.ts               # Schéma Drizzle (sessions, gear, raceGoals)
│   └── index.ts
├── instrumentation.ts          # Auto-migration Drizzle au démarrage Next.js
└── lib/
    ├── actions/                # Server Actions (CRUD atomiques)
    │   ├── sessions.ts         # addSessionAction, editSessionAction, deleteSessionAction
    │   ├── gear.ts             # addGearAction, editGearAction, deleteGearAction
    │   ├── notifications.ts    # sendSplitsNotification (webhook)
    │   └── shared.ts           # ActionState, validateRpe/Distance/Duration
    ├── actions.ts              # Barrel (re-exports, sans 'use server')
    ├── constants/gear.ts       # GEAR_TYPES partagé entre GearForm et EditGearForm
    └── utils/
        ├── splits.ts           # Logique pure partagée CLI <-> UI
        └── splits.test.ts

scripts/
├── calculate-splits.ts         # Wrapper CLI -> src/lib/utils/splits.ts
├── audit-dette.ts              # Scanner de dette technique déterministe
├── export-logs.mjs             # Export des logs système en CSV ou Markdown
└── migrate.mjs                 # Lancement manuel des migrations Drizzle

storage/
└── logs.json                   # Journal des actions utilisateur (persisté en Docker)
```

### Règles métier critiques

1. **Charge déterministe** — `calculatedLoad = durationMinutes × RPE` (méthode Foster). Jamais inline, jamais estimé.
2. **Atomicité des kilomètres** — toute mutation de session qui implique un équipement met à jour `distanceCumulated` dans la même transaction Drizzle.
3. **Seuils d'alerte** — kilométrage dépassé (tous types), âge > 3 ans (casques, combinaisons via `purchaseDate`), révision > 1 an (vélos via `lastMaintenanceDate`). Aucune valeur hardcodée : les seuils viennent des champs de la base.
4. **Validation stricte** — distance > 0, durée > 0, RPE entier de 1 à 10. Contrôles à la frontière système (Server Actions), pas dans les composants.

---

## Gouvernance & Alignement IA

### CLAUDE.md comme contrat d'exécution

`CLAUDE.md` n'est pas de la documentation — c'est un **contrat exécutable** passé entre le projet et l'agent IA. Il liste les règles métier à ne jamais casser (atomicité des km, calcul de charge, seuils d'usure), les anti-patterns spécifiques (pas de LLM dans les calculs, pas de logique DB dans les composants, pas de valeurs hardcodées) et les conventions de code strictes (zéro `any`, zéro stub, zéro god file).

Sans ce contrat, l'agent générerait des solutions techniquement valides mais architecturalement incohérentes : logique métier dispersée dans les composants React, seuils d'usure figés en littéraux, fonctions de calcul réécrites à chaque appel au lieu d'être centralisées.

### Husky comme gate de commit

Un hook pre-commit Husky refuse tout commit qui ne passe pas le double-gate :

```bash
npm test && npx tsx scripts/audit-dette.ts
```

Le code ne peut pas entrer dans l'historique git si les tests échouent ou si l'audit descend sous 100 %. Ce n'est pas un filet contre Claude — c'est un invariant sur tout contributeur, humain ou agent.

### Le linter comme gate de qualité

L'auditeur de dette (`scripts/audit-dette.ts`) scanne en continu le code produit sur 4 axes — god files > 250 lignes, usages de `any`, marqueurs TODO/FIXME, stubs vides — et produit un score de santé global utilisable comme gate CI.

**Impact mesuré :**

| Moment | Violation détectée | Correction appliquée |
|---|---|---|
| Fin J2 | `actions.ts` à 314 lignes | Découpage en `sessions.ts` + `gear.ts` + `shared.ts` |
| Fin J2 | `SplitsCalculator.tsx` à 254 lignes | Extraction de `SplitsResult.tsx` |
| Audit final | `editSessionAction` à 63 lignes | Extraction du helper pur `gearDeltaOps()` |
| Audit final | `inputClass`/`Field()` dupliqués × 4 fichiers | Centralisation dans `src/components/ui/form.tsx` |
| Audit final | `GEAR_TYPES` dupliqué × 2 fichiers | Centralisation dans `src/lib/constants/gear.ts` |
| Audit final | `SportBadge` dupliqué × 2 pages | Centralisation dans `src/components/SportBadge.tsx` |

**Score final : 100 % — zéro violation sur 27 fichiers.**

Cette boucle `CLAUDE.md → développement → audit → correction` illustre un cycle de gouvernance IA reproductible : l'agent n'est pas libre de ses décisions architecturales, il est guidé par des invariants explicites et vérifié par un gate déterministe.

---

## Analyse Critique Avancée

### Ce qui a bien marché : la logique pure partagée

La décision architecturale la plus structurante du projet a été de créer `src/lib/utils/splits.ts` comme source de vérité unique pour le calcul des splits. Cette fonction pure (`distanceKm, targetTimeSeconds → SplitResult`) est importée à la fois par le script CLI et par le composant React :

```
scripts/calculate-splits.ts       →  import '../src/lib/utils/splits'
src/app/tools/SplitsCalculator.tsx →  import '@/lib/utils/splits'
```

Cette architecture garantit trois propriétés simultanément :

- **Testabilité** — la fonction pure est testée sans DOM, sans serveur, sans base de données (39 assertions Vitest en moins de 100 ms)
- **Cohérence** — l'interface web et la CLI produisent exactement les mêmes résultats pour les mêmes entrées, sans risque de divergence
- **Extensibilité** — ajouter une stratégie de negative split revient à modifier un seul fichier, répercuté automatiquement sur toutes les surfaces

L'alternative — logique inline dans le composant ou dupliquée dans le script — aurait créé une divergence silencieuse impossible à détecter par le compilateur.

### Ce qui a dérivé : deux bugs capturés par les gates

**Dérive 1 — Bug d'arrondi `3:60` dans `formatPace`**

L'agent a implémenté `formatPace` avec un `Math.round()` sur les secondes sans gérer la retenue :

```typescript
// Code initial (bugué)
const s = Math.round(secondsPerKm % 60)
// Pour 239.6 s/km : Math.round(59.6) = 60 → retourne "3:60" au lieu de "4:00"
```

Le bug était silencieux : aucune erreur TypeScript, aucun crash runtime. C'est le gate Vitest qui l'a capturé lors de l'écriture du test `expect(formatPace(239.6)).toBe('4:00')`. Correction :

```typescript
let s = Math.round(secondsPerKm % 60)
if (s === 60) { m += 1; s = 0 }  // retenue : 3:60 → 4:00
```

Ce cas illustre pourquoi les calculs temporels doivent être testés sur des valeurs proches des frontières d'arrondi. L'agent ne teste pas spontanément ces cas limites — le gate déterministe les force.

**Dérive 2 — Payload Discord incompatible (erreur HTTP 400)**

L'agent a implémenté le webhook en ciblant uniquement le format Slack (`"text": markdown`). Discord exige la clé `"content"`. Cette contrainte est invisible au code et absente de la documentation standard — c'est une particularité runtime de l'API Discord.

```typescript
// Code initial (Slack uniquement — rejeté par Discord)
body: JSON.stringify({ text: markdown })

// Après recadrage humain
body: JSON.stringify({ text: markdown, content: markdown, source: 'Cadence — Calculateur de splits' })
```

C'est l'humain qui a identifié l'erreur 400 en testant le bouton export sur une vraie instance Discord, puis qui a transmis la contrainte précise à l'agent sous la forme d'une correction ciblée. Ce type de connaissance — les particularités d'un protocole externe — ne peut pas être déduit du code ; il exige un aller-retour entre l'exécution réelle et le contexte de l'agent.

**Leçon transverse** : les gates déterministes (tests unitaires, type checker, auditeur de dette) capturent les bugs structurels et les régressions de calcul. Les tests d'intégration humains sur les surfaces externes (webhooks, APIs tierces, navigateur) restent irremplaçables pour les contrats de protocole invisibles au compilateur.

---

## Fichiers de gouvernance

| Fichier | Rôle |
|---|---|
| `CLAUDE.md` | Contrat d'exécution : règles métier, anti-patterns, conventions de code |
| `DECISIONS.md` | Journal des ADRs — 6 décisions architecturales documentées avec contexte et justification |
| `SKILL.md` | Documentation des 3 skills déterministes : splits, audit-dette, send-splits-notification |
| `API_REFERENCE.md` | Référence auto-générée de toutes les Server Actions (généré par `/generate-api-docs`) |
| `POST_MORTEM.md` | Retour d'expérience honnête sur la semaine : bugs capturés, leçons tirées, incident GitGuardian |
| `.plan.md` | Contrat d'exécution quotidien validé avant chaque session de développement |
