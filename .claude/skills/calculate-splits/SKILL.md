# Skill : calculate-splits

## Objectif

Calcule les allures cibles (splits) et les temps de passage par kilomètre ou par segment pour une session d'entraînement ou une course triathlon.

## Quand l'utiliser

Invoquer ce skill lorsque l'utilisateur demande :
- Les splits d'une session (ex. "donne-moi mes splits pour 10 km en 50 min")
- Une allure cible (ex. "à quelle allure dois-je courir pour finir en 1h45 ?")
- Le calcul de temps de passage intermédiaires

## Comment l'invoquer

1. Exécuter le script de validation :
   ```bash
   .claude/skills/calculate-splits/scripts/validate.sh <distance_km> <duree_min>
   ```
2. Récupérer la sortie JSON du script.
3. Remplir le modèle `template.md` avec les valeurs retournées.

## Paramètres attendus

| Paramètre     | Type   | Description                          |
|---------------|--------|--------------------------------------|
| `distance_km` | number | Distance totale en kilomètres        |
| `duree_min`   | number | Durée totale en minutes              |

## Règles métier

- L'allure est calculée en `min/km` : `duree_min / distance_km`
- Les splits sont fournis tous les kilomètres entiers
- Ne jamais inliner ce calcul dans un composant React — utiliser `scripts/calculate-splits.ts`
- Ne jamais appeler un LLM pour faire ce calcul

## Sortie attendue

Voir `template.md` pour le format et `examples/sample.md` pour un exemple concret.
