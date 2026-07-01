# API_REFERENCE — Cadence

> Généré par le skill `generate-api-docs` le 2026-07-01.
> Source de vérité : `src/lib/actions/`. Ne pas modifier manuellement — relancer `/generate-api-docs` pour mettre à jour.

---

## Server Actions

Les Server Actions Next.js sont appelées via `useActionState` depuis les formulaires React. Elles opèrent côté serveur exclusivement — aucun calcul de charge ni opération DB n'a lieu dans les composants.

### Sessions (`src/lib/actions/sessions.ts`)

---

#### `addSessionAction`

| Champ        | Valeur |
|--------------|--------|
| **Fichier**  | `src/lib/actions/sessions.ts` |
| **Effet DB** | `insert` dans `sessions` + `update` atomique de `gear.distanceCumulated` |
| **Règle**    | Transaction unique : l'insertion et la mise à jour du kilométrage gear sont atomiques. `calculatedLoad = durationMin * rpe` (déterministe, jamais estimé). |

**Signature**

```typescript
addSessionAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState>
```

**Champs FormData**

| Champ       | Type                          | Contrainte                        |
|-------------|-------------------------------|-----------------------------------|
| `date`      | `string`                      | Obligatoire — format ISO 8601     |
| `sportType` | `"swim" \| "bike" \| "run"`   | Obligatoire                       |
| `duration`  | `number` (minutes)            | ≥ 1 minute                        |
| `rpe`       | `number`                      | Entier entre 1 et 10 inclus       |
| `distance`  | `number` (km)                 | Strictement positif               |
| `gearId`    | `string \| null`              | Optionnel — UUID d'un équipement  |

**Retour**

```typescript
{ success: true }
| { error: string }
```

---

#### `editSessionAction`

| Champ        | Valeur |
|--------------|--------|
| **Fichier**  | `src/lib/actions/sessions.ts` |
| **Effet DB** | `update` dans `sessions` + `update` atomique de `gear.distanceCumulated` (delta calculé via `gearDeltaOps`) |
| **Règle**    | Gère 4 cas de transition gear : même gear (delta), gear changé (décrémente l'ancien, incrémente le nouveau), gear retiré, gear ajouté. `distanceCumulated` ne peut pas descendre en dessous de 0 (`max(0.0, ...)`). Redirige vers `/sessions` en cas de succès. |

**Signature**

```typescript
editSessionAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState>
```

**Champs FormData**

| Champ       | Type                          | Contrainte                        |
|-------------|-------------------------------|-----------------------------------|
| `id`        | `string`                      | Obligatoire — UUID de la session  |
| `date`      | `string`                      | Obligatoire — format ISO 8601     |
| `sportType` | `"swim" \| "bike" \| "run"`   | Obligatoire                       |
| `duration`  | `number` (minutes)            | ≥ 1 minute                        |
| `rpe`       | `number`                      | Entier entre 1 et 10 inclus       |
| `distance`  | `number` (km)                 | Strictement positif               |
| `gearId`    | `string \| null`              | Optionnel                         |

**Retour**

```typescript
{ success: true }   // suivi d'un redirect('/sessions')
| { error: string }
```

---

#### `deleteSessionAction`

| Champ        | Valeur |
|--------------|--------|
| **Fichier**  | `src/lib/actions/sessions.ts` |
| **Effet DB** | `delete` dans `sessions` + `update` atomique de `gear.distanceCumulated` (soustraction, plancher à 0) |
| **Règle**    | Si la session n'existe pas, retour silencieux sans erreur. La distance est soustraite du gear associé dans la même transaction. |

**Signature**

```typescript
deleteSessionAction(formData: FormData): Promise<void>
```

**Champs FormData**

| Champ | Type     | Contrainte                       |
|-------|----------|----------------------------------|
| `id`  | `string` | UUID de la session — obligatoire |

**Retour**

```typescript
void  // throw en cas d'erreur DB (pas de retour ActionState)
```

---

### Gear (`src/lib/actions/gear.ts`)

---

#### `addGearAction`

| Champ        | Valeur |
|--------------|--------|
| **Fichier**  | `src/lib/actions/gear.ts` |
| **Effet DB** | `insert` dans `gear` — `distanceCumulated` initialisé à `0`, `status` à `"active"` |
| **Règle**    | Les types valides sont figés dans `VALID_GEAR_TYPES = ['shoes', 'bike', 'wetsuit', 'helmet']`. `distanceMax` doit être ≥ 1 km. |

**Signature**

```typescript
addGearAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState>
```

**Champs FormData**

| Champ                 | Type                                          | Contrainte              |
|-----------------------|-----------------------------------------------|-------------------------|
| `name`                | `string`                                      | Obligatoire, non vide   |
| `type`                | `"shoes" \| "bike" \| "wetsuit" \| "helmet"`  | Obligatoire             |
| `distanceMax`         | `number` (km)                                 | ≥ 1 km                  |
| `purchaseDate`        | `string \| null`                              | Optionnel — ISO 8601    |
| `lastMaintenanceDate` | `string \| null`                              | Optionnel — ISO 8601    |

**Retour**

```typescript
{ success: true }
| { error: string }
```

---

#### `editGearAction`

| Champ        | Valeur |
|--------------|--------|
| **Fichier**  | `src/lib/actions/gear.ts` |
| **Effet DB** | `update` dans `gear` (nom, type, seuils, dates, statut) — `distanceCumulated` non modifiable ici |
| **Règle**    | `distanceCumulated` est géré exclusivement par les actions de sessions. Redirige vers `/gear` en cas de succès. |

**Signature**

```typescript
editGearAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState>
```

**Champs FormData**

| Champ                 | Type                                          | Contrainte              |
|-----------------------|-----------------------------------------------|-------------------------|
| `id`                  | `string`                                      | UUID — obligatoire      |
| `name`                | `string`                                      | Non vide                |
| `type`                | `"shoes" \| "bike" \| "wetsuit" \| "helmet"`  | Obligatoire             |
| `distanceMax`         | `number` (km)                                 | ≥ 1 km                  |
| `purchaseDate`        | `string \| null`                              | Optionnel — ISO 8601    |
| `lastMaintenanceDate` | `string \| null`                              | Optionnel — ISO 8601    |
| `status`              | `"active" \| "retired"`                       | Défaut : `"active"`     |

**Retour**

```typescript
{ success: true }   // suivi d'un redirect('/gear')
| { error: string }
```

---

#### `deleteGearAction`

| Champ        | Valeur |
|--------------|--------|
| **Fichier**  | `src/lib/actions/gear.ts` |
| **Effet DB** | `delete` dans `gear` — bloqué si des sessions référencent encore cet équipement |
| **Règle**    | Intégrité référentielle applicative : vérifie l'absence de sessions liées avant suppression pour éviter les compteurs `distanceCumulated` orphelins. |

**Signature**

```typescript
deleteGearAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState>
```

**Champs FormData**

| Champ | Type     | Contrainte                         |
|-------|----------|------------------------------------|
| `id`  | `string` | UUID de l'équipement — obligatoire |

**Retour**

```typescript
{ success: true }
| { error: string }  // dont "Ce matériel est utilisé par des sessions enregistrées."
```

---

### Notifications (`src/lib/actions/notifications.ts`)

---

#### `sendSplitsNotification`

| Champ        | Valeur |
|--------------|--------|
| **Fichier**  | `src/lib/actions/notifications.ts` |
| **Effet DB** | Aucun — appel HTTP `POST` vers `process.env.WEBHOOK_URL` |
| **Règle**    | Requiert la variable d'environnement `WEBHOOK_URL`. Le payload envoie le plan d'allures en Markdown. Retourne un état nommé (`status`) distinct du pattern `ActionState`. |

**Signature**

```typescript
sendSplitsNotification(
  _prevState: NotificationState,
  formData: FormData,
): Promise<NotificationState>
```

**Champs FormData**

| Champ      | Type     | Contrainte                                    |
|------------|----------|-----------------------------------------------|
| `markdown` | `string` | Contenu du plan d'allures — obligatoire       |

**Env requis**

| Variable      | Description                              |
|---------------|------------------------------------------|
| `WEBHOOK_URL` | URL HTTP(S) du webhook de destination    |

**Retour**

```typescript
{ status: 'success'; message: string }
| { status: 'error';   message: string }
```

---

### Utilitaires partagés (`src/lib/actions/shared.ts`)

> Ces fonctions ne sont **pas** des Server Actions — pas de `'use server'`. Elles sont importées par `sessions.ts` et `gear.ts` pour la validation des inputs aux limites du système.

#### `validateRpe(rpe: number): string | null`

Retourne un message d'erreur si `rpe` n'est pas un entier fini entre 1 et 10 inclus, `null` sinon.

#### `validateDistance(distance: number): string | null`

Retourne un message d'erreur si `distance` n'est pas un nombre fini strictement positif (> 0), `null` sinon.

#### `validateDuration(min: number): string | null`

Retourne un message d'erreur si `min` est inférieur à 1 minute, `null` sinon.

**Type partagé**

```typescript
export type ActionState = { error?: string; success?: boolean }
```

---

## Routes Next.js (App Router)

| Route                   | Fichier TSX                                   | Description                        |
|-------------------------|-----------------------------------------------|------------------------------------|
| `/`                     | `src/app/page.tsx`                            | Dashboard — charge et alertes      |
| `/sessions`             | `src/app/sessions/page.tsx`                   | Liste des sessions d'entraînement  |
| `/sessions/[id]/edit`   | `src/app/sessions/[id]/edit/page.tsx`         | Formulaire d'édition d'une session |
| `/gear`                 | `src/app/gear/page.tsx`                       | Liste du matériel et alertes usure |
| `/gear/[id]/edit`       | `src/app/gear/[id]/edit/page.tsx`             | Formulaire d'édition d'un équipement |
| `/tools`                | `src/app/tools/page.tsx`                      | Calculateur de splits              |
| `/admin/logs`           | `src/app/admin/logs/page.tsx`                 | Logs d'administration              |

---

## Invariants critiques (rappel)

| Invariant                  | Garantie                                                                 |
|----------------------------|--------------------------------------------------------------------------|
| Charge déterministe        | `calculatedLoad = durationMin * rpe` — calculé dans la Server Action, jamais dans un composant |
| Atomicité des km           | Toute modification de session met à jour `gear.distanceCumulated` dans la même transaction Drizzle |
| Plancher kilométrique      | `max(0.0, distanceCumulated + delta)` — le kilométrage ne peut pas être négatif |
| Intégrité référentielle    | Un gear référencé par des sessions ne peut pas être supprimé             |
| Validation aux limites     | `validateRpe / validateDistance / validateDuration` s'exécutent avant toute écriture DB |
