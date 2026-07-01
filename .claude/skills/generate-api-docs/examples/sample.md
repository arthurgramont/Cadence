# Exemple — Documentation d'endpoint Cadence

> Cet exemple illustre comment documenter une Server Action avec le modèle du skill `generate-api-docs`.

---

## Exemple complet : `createSession`

| Champ        | Valeur                          |
|--------------|---------------------------------|
| **Fichier**  | `src/lib/actions/sessions.ts`   |
| **Effet DB** | `insert` dans la table `sessions` + `update` atomique sur `gear.distanceCumulated` |
| **Règle**    | Atomicité des km : la mise à jour du kilométrage de l'équipement se fait dans la même transaction que l'insertion de la session |

**Paramètres**

```typescript
type CreateSessionInput = {
  date: string          // Format ISO 8601 : "2026-06-30"
  duration: number      // En minutes — doit être > 0
  rpe: number           // Entier entre 1 et 10 inclus
  sport: "swim" | "bike" | "run"
  distance?: number     // En km — doit être >= 0 si fourni
  gearId?: number       // Référence vers un équipement existant
  notes?: string
}
```

**Retour**

```typescript
{ success: true; data: { id: number; calculatedLoad: number } }
| { success: false; error: string }
```

**Note sur le calcul**

`calculatedLoad` est calculé de manière déterministe : `duration (minutes) * rpe`. Ce calcul n'est jamais inline dans un composant React.

---

## Exemple complet : `getWearAlerts`

| Champ        | Valeur                               |
|--------------|--------------------------------------|
| **Fichier**  | `src/lib/actions/notifications.ts`   |
| **Effet DB** | `select` sur `gear` — lecture des champs `distanceCumulated`, `purchaseDate`, `lastMaintenanceDate` |
| **Règle**    | Trois invariants vérifiés : dépassement kilométrique, âge > 3 ans (casques/combi), absence de révision > 1 an (vélos) |

**Paramètres**

```typescript
// Aucun paramètre — lit l'ensemble du matériel en base
```

**Retour**

```typescript
{
  success: true
  data: Array<{
    gearId: number
    gearName: string
    alertType: "mileage" | "age" | "maintenance"
    message: string
    severity: "warning" | "critical"
  }>
}
| { success: false; error: string }
```
