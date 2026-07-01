# API_REFERENCE — Cadence

> Généré par le skill `generate-api-docs`. Ne pas modifier manuellement — relancer le skill pour mettre à jour.
>
> Date de génération : <!-- DATE -->

---

## Server Actions

### Sessions

<!-- Répéter ce bloc pour chaque action de sessions.ts -->

#### `<!-- NOM_FONCTION -->`

| Champ        | Valeur                          |
|--------------|---------------------------------|
| **Fichier**  | `src/lib/actions/sessions.ts`   |
| **Effet DB** | <!-- insert / update / delete / select --> |
| **Règle**    | <!-- invariant métier respecté --> |

**Paramètres**

```typescript
// Coller la signature TypeScript stricte ici
```

**Retour**

```typescript
{ success: true; data: <!-- type --> }
| { success: false; error: string }
```

---

### Gear

<!-- Répéter ce bloc pour chaque action de gear.ts -->

#### `<!-- NOM_FONCTION -->`

| Champ        | Valeur                        |
|--------------|-------------------------------|
| **Fichier**  | `src/lib/actions/gear.ts`     |
| **Effet DB** | <!-- insert / update / delete / select --> |
| **Règle**    | <!-- invariant métier respecté --> |

**Paramètres**

```typescript
// Coller la signature TypeScript stricte ici
```

**Retour**

```typescript
{ success: true; data: <!-- type --> }
| { success: false; error: string }
```

---

### Notifications

<!-- Répéter ce bloc pour chaque action de notifications.ts -->

#### `<!-- NOM_FONCTION -->`

| Champ        | Valeur                               |
|--------------|--------------------------------------|
| **Fichier**  | `src/lib/actions/notifications.ts`   |
| **Effet DB** | <!-- select (lecture des seuils) --> |
| **Règle**    | <!-- seuil d'usure vérifié -->        |

**Paramètres**

```typescript
// Aucun paramètre ou signature stricte ici
```

**Retour**

```typescript
{ success: true; data: Alert[] }
| { success: false; error: string }
```

---

## Routes Next.js (App Router)

| Route                        | Page TSX                                        | Description              |
|------------------------------|-------------------------------------------------|--------------------------|
| `/`                          | `src/app/page.tsx`                              | Dashboard principal      |
| `/sessions`                  | `src/app/sessions/page.tsx`                     | Liste des sessions       |
| `/sessions/[id]/edit`        | `src/app/sessions/[id]/edit/page.tsx`           | Édition d'une session    |
| `/gear`                      | `src/app/gear/page.tsx`                         | Liste du matériel        |
| `/gear/[id]/edit`            | `src/app/gear/[id]/edit/page.tsx`               | Édition d'un équipement  |
| `/tools`                     | `src/app/tools/page.tsx`                        | Outils (splits, calculs) |
| `/admin/logs`                | `src/app/admin/logs/page.tsx`                   | Logs d'administration    |
