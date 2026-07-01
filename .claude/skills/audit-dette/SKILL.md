# Skill : audit-dette

## Objectif

Lance l'analyse de dette technique du projet Cadence et vérifie que le score reste à 100 % avant tout commit ou déclaration de tâche terminée.

## Quand l'utiliser

Invoquer ce skill **systématiquement** :
- Après chaque modification d'un fichier TypeScript ou TSX
- Avant tout commit git
- Avant de déclarer une tâche terminée
- Lorsque l'utilisateur demande un bilan de qualité du code

## Comment l'invoquer

```bash
.claude/skills/audit-dette/scripts/validate.sh
```

## Règles de blocage

Si l'audit retourne un score < 100 %, l'agent DOIT refactoriser avant de continuer :

| Violation détectée            | Action requise                              |
|-------------------------------|---------------------------------------------|
| Fichier > 250 lignes          | Découper en modules à responsabilité unique |
| `any` TypeScript explicite    | Remplacer par un type Drizzle ou strict     |
| Marqueur `TODO` / `FIXME`     | Implémenter ou supprimer                   |
| Fonction vide / stub          | Implémenter complètement                   |
| `console.log` dans le source  | Supprimer (utiliser les Server Actions)     |
| Fonction > 50 lignes          | Extraire en sous-fonctions nommées          |

## Contrat de qualité

L'agent ne rend jamais la main avec un score < 100 % ni des tests en échec.
La commande complète du double-gate est :

```bash
npm test && npx tsx scripts/audit-dette.ts
```

## Sortie attendue

Voir `template.md` pour le format et `examples/sample.md` pour un exemple de succès.
