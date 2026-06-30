# SKILL.md — Compétences déterministes de Cadence

> Ce fichier documente les scripts autonomes et déterministes du projet.
> Un "skill" ici désigne une capacité de calcul pure : entrée typée → sortie reproductible, sans LLM, sans DB.

---

## Skill 1 — Calculateur de splits (`calculate-splits`)

**Fichier** : `scripts/calculate-splits.ts`
**Exécution** : `npx tsx scripts/calculate-splits.ts <distanceKm> <tempsSecondes>`

### Objectif

Prendre un objectif de course (distance + temps cible) et produire :
1. L'**allure cible** moyenne (min/km et min/mile)
2. Un **tableau des temps de passage** kilomètre par kilomètre (splits)

### Signature

```typescript
function calculateSplits(distanceKm: number, targetTimeSeconds: number): SplitResult
```

### Types

```typescript
type Split = {
  km: number           // numéro du kilomètre (1, 2, ..., N)
  splitTimeSeconds: number   // durée de ce km à allure constante
  cumulativeTimeSeconds: number // temps total au passage
  cumulativeTimeFormatted: string // "MM:SS" ou "H:MM:SS"
}

type SplitResult = {
  distanceKm: number
  targetTimeSeconds: number
  paceSecondsPerKm: number
  paceFormatted: string    // "M:SS /km"
  paceMileFormatted: string // "M:SS /mile"
  splits: Split[]
  lastSplitDistanceKm: number | null  // fraction si distance non entière
}
```

### Algorithme

1. Calculer l'**allure de base** : `paceSecondsPerKm = targetTimeSeconds / distanceKm`
2. Pour chaque kilomètre entier `i` de 1 à `floor(distanceKm)` :
  - `splitTimeSeconds = paceSecondsPerKm` (constant à allure uniforme)
  - `cumulativeTimeSeconds = i × paceSecondsPerKm`
3. Si `distanceKm` n'est pas un entier, ajouter un dernier split partiel :
  - `lastSplitDistanceKm = distanceKm - floor(distanceKm)`
  - `splitTimeSeconds = lastSplitDistanceKm × paceSecondsPerKm`
4. Convertir les secondes en chaîne `formatTime(seconds)` → `"M:SS"` ou `"H:MM:SS"`

### Invariants

- `targetTimeSeconds > 0` et `distanceKm > 0` — sinon erreur explicite.
- La somme des splits est égale au temps cible (à la précision flottante près).
- Le calcul est **purement arithmétique** — aucun appel réseau, aucune DB, aucun LLM.
- Reproductible : mêmes entrées → mêmes sorties, toujours.

### Exemples d'usage

```bash
# 10 km en 40 minutes (2400s) → allure 4:00/km
npx tsx scripts/calculate-splits.ts 10 2400

# 10 km en 39 minutes (2340s) → allure 3:54/km
npx tsx scripts/calculate-splits.ts 10 2340

# Semi-marathon (21.0975 km) en 1h45 (6300s) → allure 4:59/km
npx tsx scripts/calculate-splits.ts 21.0975 6300

# 42.195 km en 3h30 (12600s) → allure 4:59/km marathon
npx tsx scripts/calculate-splits.ts 42.195 12600
```

### Exemple de sortie (10 km / 2340 s)

```
Cadence — Calculateur de splits
════════════════════════════════════════
Distance    : 10.00 km
Temps cible : 39:00
Allure      : 3:54 /km  (6:17 /mile)
════════════════════════════════════════

Km   │ Split  │ Passage
─────┼────────┼─────────
  1  │  3:54  │   3:54
  2  │  3:54  │   7:48
  3  │  3:54  │  11:42
  4  │  3:54  │  15:36
  5  │  3:54  │  19:30
  6  │  3:54  │  23:24
  7  │  3:54  │  27:18
  8  │  3:54  │  31:12
  9  │  3:54  │  35:06
  10 │  3:54  │  39:00
─────┴────────┴─────────
```

### Intégration future

Ce script est prévu pour être intégré comme Server Action dans l'onglet "Objectifs" :
- Associer un `raceGoal` à son calculateur de splits
- Afficher le tableau dans l'UI Next.js
- Permettre des stratégies de course non-uniformes (negative split, positive split) — **ADR-008**

---

---

## Skill 2 — Auditeur de dette technique (`audit-dette`)

**Fichier** : `scripts/audit-dette.ts`
**Exécution** : `npx tsx scripts/audit-dette.ts [--src <path>]`

### Objectif

Scanner de façon déterministe tous les fichiers `.ts`/`.tsx` d'un répertoire source pour détecter quatre catégories de dette technique, puis afficher un score global de santé du code.

### Signature

```typescript
function analyzeFile(absPath: string, srcRoot: string): FileReport
function computeScore(reports: FileReport[]): { score: number; penalties: string[] }
```

### Types

```typescript
type LineMatch = { line: number; excerpt: string }
type FileReport = {
  rel: string
  lineCount: number
  anyMatches: LineMatch[]   // usages de `any` TypeScript
  todoMatches: LineMatch[]  // marqueurs TODO / FIXME
  stubMatches: LineMatch[]  // fonctions vides / stubs
}
```

### Catégories détectées

| Catégorie | Pattern | Pénalité |
|---|---|---|
| Fichier > 250 lignes (god file) | `lineCount > MAX_FILE_LINES` | −10 pts/fichier |
| Type `any` explicite | `: any`, `as any`, `<any>`, `any[]` | −3 pts/occurrence |
| Marqueur TODO/FIXME | `/\b(TODO\|FIXME)\b/i` | −2 pts/occurrence |
| Fonction vide / stub | `=> {}`, `function f() {}` | −5 pts/occurrence |

### Formule de score

```
score = max(0, 100 − godFiles×10 − anyCount×3 − todoCount×2 − stubCount×5)
```

### Invariants

- Le résultat est **purement déterministe** : mêmes fichiers → même score, toujours.
- Les lignes de commentaires purs (`//`, `*`) sont ignorées pour éviter les faux positifs.
- **Exit 0** si score = 100 %, **exit 1** sinon — intégrable dans un pipeline CI.
- `--src <path>` permet de pointer sur un dossier arbitraire (défaut : `./src`).

### Exemple de sortie (codebase propre)

```
Cadence — Audit de dette technique
════════════════════════════════════════════════════
Scanné : 22 fichiers TypeScript dans src/

┌─ Fichiers > 250 lignes ─────────────────────────────
  ✓  Aucun
└───────────────────────────────────────────────────
┌─ Utilisations de `any` ───────────────────────────
  ✓  Aucun
└───────────────────────────────────────────────────
┌─ Marqueurs TODO / FIXME ──────────────────────────
  ✓  Aucun
└───────────────────────────────────────────────────
┌─ Fonctions vides / stubs ─────────────────────────
  ✓  Aucun
└───────────────────────────────────────────────────

════════════════════════════════════════════════════
Score de santé : 100%  [████████████████████]  ✓
Aucune violation détectée — codebase propre.
════════════════════════════════════════════════════
```

### Intégration future

- Ajouter en hook pre-commit via `package.json` scripts
- Étendre aux fichiers `.js` pour détecter les résidus non-typés
- Détecter les imports circulaires (catégorie 5)

---

---

## Skill 3 — Notification webhook (`send-splits-notification`)

**Fichier** : `src/lib/actions/notifications.ts`
**Type** : Next.js Server Action (`'use server'`)
**Déclencheur** : bouton "↗ Exporter le plan d'allures" sur `/tools`, après calcul des splits

### Objectif

Envoyer un plan d'allures formaté en Markdown vers un webhook externe (Slack, Discord, n8n, Make, Zapier…) via un `fetch` POST JSON, sans crash si la configuration est absente.

### Signature

```typescript
async function sendSplitsNotification(
  _prevState: NotificationState,
  formData: FormData,
): Promise<NotificationState>
```

### Types

```typescript
type NotificationState = {
  status: 'idle' | 'success' | 'error'
  message?: string
}
```

### Payload envoyé

```json
{
  "text": "## Plan d'allures — 10 km\n\n| Propriété | Valeur |…",
  "source": "Cadence — Calculateur de splits"
}
```

Le champ `text` est du Markdown généré par `formatSplitsMarkdown(result)` — fonction pure dans `src/lib/utils/splits.ts`.

### Configuration

| Variable d'environnement | Valeur exemple |
|---|---|
| `WEBHOOK_URL` | `https://hooks.slack.com/services/T…` |

À déclarer dans `.env.local` (jamais commité). Si absente, l'action retourne `{ status: 'error' }` sans lancer d'exception.

### Invariants

- **Jamais de crash silencieux** : chaque branche d'erreur retourne un `NotificationState` avec `status: 'error'` et un `message` lisible par l'UI.
- **Log serveur sur tout `catch`** : `console.error('[sendSplitsNotification]', err)` — traçable dans les logs Next.js.
- **Sans `WEBHOOK_URL`** : l'application reste fonctionnelle, seul le bouton export est inutilisable (feedback affiché).
- **Idempotence** : l'action peut être appelée plusieurs fois — aucun état côté serveur, chaque appel est indépendant.

### Flux UI

```
Utilisateur calcule les splits
        ↓
SplitsResult affiche le tableau
        ↓
Bouton "↗ Exporter" → form POST (hidden input: markdown)
        ↓
sendSplitsNotification() [Server Action]
        ↓
  WEBHOOK_URL absent  → { status: 'error', message: '…' }
  fetch OK            → { status: 'success', message: '…' }
  fetch erreur HTTP   → { status: 'error', message: 'HTTP 4xx/5xx' }
  erreur réseau       → { status: 'error', message: 'Erreur réseau' }
        ↓
NotifFeedback affiche le message (vert / rouge)
```

### Intégration future

- Ajouter un second type de notification pour les alertes matériel (`sendGearAlertNotification`)
- Permettre le choix du format : Markdown / JSON brut / texte enrichi Slack Block Kit

---

## Récapitulatif des skills

| Skill | Type | Description | Statut |
|---|---|---|---|
| `calculate-splits` | Script CLI + lib partagée | Splits et allure cible | ✅ Implémenté |
| `audit-dette` | Script CLI | Scanner de dette technique avec score de santé | ✅ Implémenté |
| `send-splits-notification` | Server Action | Export Markdown vers webhook externe | ✅ Implémenté |
| `calculate-zones` | Script CLI | Zones d'allure à partir de VMA ou allure seuil | Prévu J4 |
| `export-sessions` | Server Action | Export CSV/JSON des sessions filtrées | Prévu J4 |
| `calculate-trimp` | Lib partagée | Charge d'entraînement méthode TRIMP (avec FC) | Prévu J4 |
