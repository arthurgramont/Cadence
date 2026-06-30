# DECISIONS.md — Journal d'architecture Cadence

> Chaque entrée répond à : **Contexte → Options envisagées → Décision → Conséquences**
> Format inspiré de l'ADR (Architecture Decision Record).

---

## ADR-001 — SQLite local via Drizzle ORM

**Date** : 2026-06-28
**Statut** : Accepté

### Contexte
Application solo sans infrastructure cloud. Besoin d'un stockage persistant simple, déployable sans serveur de base de données.

### Options envisagées
| Option | Avantages | Inconvénients |
|---|---|---|
| PostgreSQL (Supabase) | Scalable, types riches | Sur-engineering pour usage solo |
| SQLite (libsql) | Zero-infra, fichier unique | Pas de concurrence multi-process |
| Prisma + SQLite | API familiar | Schéma dupliqué (Prisma schema + migrations) |

### Décision
SQLite via `@libsql/client` + Drizzle ORM dialect `turso`. Le fichier `local.db` est versioning-exclu (`.gitignore`) mais reproductible via `npx drizzle-kit push`.

### Conséquences
- Migration : `npx drizzle-kit push` — pas de fichiers de migration générés en dev.
- Production : remplacement par Turso (libsql remote) sans changer le code applicatif — seule la connexion change.
- Contrainte : un seul process écrit à la fois. Acceptable pour un dashboard solo.

---

## ADR-002 — Next.js Server Actions comme couche de mutation

**Date** : 2026-06-28
**Statut** : Accepté

### Contexte
Choisir entre API Routes (`/api/*`), tRPC, ou Server Actions pour les mutations CRUD.

### Options envisagées
| Option | Avantages | Inconvénients |
|---|---|---|
| API Routes REST | Familier, testable via HTTP | Boilerplate fetch + gestion d'état côté client |
| tRPC | Type-safe end-to-end | Dépendance lourde, surcharge pour CRUD simple |
| Server Actions | Zéro boilerplate fetch, co-localisation | Moins testable en isolation |

### Décision
Server Actions dans `src/lib/actions.ts`. Toutes les mutations passent par ce fichier unique (`'use server'`). Les composants React n'ont aucune logique de mutation inline.

### Conséquences
- Règle de découpage : si `actions.ts` dépasse 250 lignes, on crée `src/lib/actions-sessions.ts` et `src/lib/actions-gear.ts`.
- Les redirections (`redirect()`) sont appelées **hors** des blocs `try/catch` pour éviter que Next.js ne les intercepte comme des erreurs.
- `revalidatePath('/', 'layout')` invalide le cache de toutes les pages en un seul appel.

---

## ADR-003 — Atomicité des mises à jour kilométriques

**Date** : 2026-06-28
**Statut** : Accepté

### Contexte
Chaque session peut être liée à un équipement. Toute création, modification ou suppression de session doit ajuster `gear.distanceCumulated` sans race condition.

### Décision
Utiliser `db.transaction(async tx => { ... })` dans chaque Server Action de mutation de session. L'incrémentation utilise du SQL atomique :
```sql
-- Incrément (ajout de session)
SET distance_cumulated = distance_cumulated + :delta

-- Décrément protégé (suppression/modification)
SET distance_cumulated = max(0.0, distance_cumulated - :delta)
```

### Conséquences
- Pas de lecture préalable du compteur (pas de race condition type "read-modify-write").
- La valeur ne peut jamais descendre en dessous de 0 grâce à `max(0.0, ...)`.
- Lors de l'édition d'une session, 4 cas sont gérés : même équipement + delta distance, changement d'équipement, suppression d'équipement, ajout d'équipement.

---

## ADR-004 — Calcul de charge déterministe (méthode Foster)

**Date** : 2026-06-28
**Statut** : Accepté

### Contexte
La "charge d'entraînement" est affichée sur le dashboard. Plusieurs méthodes existent (TRIMP, TSS, Foster).

### Décision
Méthode Foster : `calculatedLoad = durationMinutes × RPE`. Simple, sans capteur externe requis, largement utilisée en endurance.

### Règle d'implémentation
- Le calcul est effectué dans le Server Action à l'insertion, **jamais** dans un composant React.
- La valeur est stockée en base (`calculated_load INTEGER`) — elle n'est pas recalculée à la lecture.
- Corollaire : si la formule change, une migration des données existantes sera nécessaire.

---

## ADR-005 — Alertes matériel : seuils temporels et kilométriques

**Date** : 2026-06-29
**Statut** : Accepté

### Décision
Trois invariants d'alerte, tous calculés côté serveur dans `src/app/page.tsx` :

| Type | Condition | Niveau |
|---|---|---|
| Kilométrage | `distanceCumulated ≥ distanceMax` | Critique |
| Kilométrage | `distanceCumulated ≥ 0.8 × distanceMax` | Avertissement |
| Sécurité casque/combinaison | `purchaseDate < aujourd'hui - 3 ans` | Avertissement |
| Maintenance vélo | `lastMaintenanceDate` absent ou `< aujourd'hui - 1 an` | Avertissement |

### Principe de conception
Les seuils kilométriques ne sont **pas** hardcodés. `distanceMax` est un champ utilisateur par équipement. Seuls les seuils temporels (3 ans, 1 an) sont des constantes métier issues de normes de sécurité triathlon.

---

## ADR-006 — Workflow de validation Git

**Date** : 2026-06-29
**Statut** : Accepté

### Décision
Workflow de feature branch simplifié (usage solo) :

1. `main` est la branche de production — toujours en état déployable.
2. Chaque session de développement correspond à un ensemble de commits atomiques et fonctionnels sur `main` (pas de WIP commits).
3. Convention de commit : `feat:`, `fix:`, `refactor:`, `docs:` + description courte en anglais.
4. `local.db` est ignoré par git. La structure de la base est reproductible via `npx drizzle-kit push`.

### Conséquences
- Pas de branche de feature pour l'instant (usage solo). À revisiter si collaboration.
- Chaque commit doit compiler et les routes principales doivent répondre 200.

---

## Décisions en attente

| ID | Question ouverte | Priorité |
|---|---|---|
| ADR-007 | Framework de test (Vitest) — setup et périmètre de couverture | J4 |
| ADR-008 | Zones d'allure : basées sur VMA ou allure cible ? | J3 |
| ADR-009 | Export des données — format CSV ou JSON ? | J3 |
