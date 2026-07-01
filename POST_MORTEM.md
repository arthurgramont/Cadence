# POST_MORTEM — Cadence x Claude Code
## Retour d'expérience honnête sur une semaine de développement humain-IA

---

## 1. L'illusion de la vitesse

Le premier jour, j'ai commis l'erreur classique : traiter Claude comme un développeur junior très rapide à qui on donnerait des tickets vagues. "Génère-moi le schema, crée les Server Actions, fais l'UI." Et effectivement, ça sort vite. Trop vite pour être sain.

Le premier mur concret, c'est le bug de l'allure à `3:60`. Le calculateur de splits affichait une allure parfaitement formatée — sauf que `3:60` n'est pas une unité de temps. Ça n'existe pas. Quand on court 10 km en exactement 40 minutes, l'allure est `4:00/km`, pas `3:60`. Le code TypeScript compilait, aucune erreur de lint, mais la logique de formatage était fausse : la modulo n'était pas correctement gérée sur les secondes. Claude avait produit du code *qui tourne* mais pas du code *qui fait ce qu'on attend*. Nuance immense.

Le deuxième mur, c'était le webhook Discord. Skill 3 du projet : envoyer le plan d'allures vers un webhook externe. Claude a généré un payload `{ "text": "...", "source": "..." }`. C'est le format Slack. Discord attend `{ "content": "..." }`. HTTP 400, timeout côté client, zéro message d'erreur utile. Claude avait *deviné* le payload sans consulter la doc Discord. Et comme je ne l'ai pas questionné sur sa source, j'ai perdu du temps à déboguer un problème qu'il avait introduit par extrapolation.

C'est ça, la vraie leçon du début : le code compile, les types passent, mais la logique métier peut être complètement à côté. L'IA n'a pas de *bon sens* sur ce que signifie "3:60" pour un coureur, ou sur le fait que Discord et Slack ne partagent pas la même API de webhook. Elle extrapole depuis des patterns qui ressemblent à ce qu'elle a vu. Quand son entraînement est suffisant, c'est brillant. Quand c'est un domaine spécifique — le triathlon, les formats de webhooks d'un outil précis — elle comble les lacunes avec de la confiance, pas avec de la précision.

---

## 2. Le changement de rôle

À partir du deuxième jour, j'ai arrêté de demander du code. J'ai commencé à écrire des contraintes.

**Le `CLAUDE.md`** est devenu le document le plus important du projet. Pas le README, pas l'architecture — ce fichier. Il n'explique pas *ce que fait* l'application. Il explique *comment Claude doit se comporter* avant d'écrire la moindre ligne. Les règles métier y sont écrites noir sur blanc : `calculatedLoad = durationMinutes × RPE`, jamais inline dans un composant, toujours dans une Server Action. Les seuils d'usure ne sont pas hardcodés. Les types `any` sont bannis.

Ce changement a tout modifié. Avant le `CLAUDE.md`, Claude répondait à la question "comment faire un calcul de charge ?" par ce qui lui semblait logique dans le contexte. Après, il répondait en respectant une règle explicitement écrite. La différence entre "fais au mieux" et "voici le contrat" est fondamentale.

**Husky + l'audit de dette** ont ajouté une couche de sécurité mécanique. Le commit `60fb6f6` installe un hook pre-commit qui refuse tout commit qui ne passe pas les tests et l'audit. Ce n'est pas de la méfiance — c'est de l'ingénierie de fiabilité. L'idée est simple : si Claude commence à glisser vers des mauvaises habitudes (un fichier qui grossit, un `any` qui s'installe, une fonction qui dépasse 50 lignes), le hook le coupe avant que ça entre dans l'historique git.

Le script `audit-dette.ts` est lui-même déterministe : mêmes fichiers → même score. Il pénalise les god files, les `any`, les TODO, les stubs vides. Il sort un score sur 100 et retourne `exit 1` si ce n'est pas parfait. Claude ne peut pas passer outre. Si le score est à 97 %, il doit corriger avant de rendre la main.

En pratique, ça a forcé un refacto significatif (commit `d45f8fa`) : le fichier `actions.ts` avait grossi jusqu'à dépasser la limite. Il a été découpé en `actions-sessions.ts` et `actions-gear.ts`, chaque fichier avec une responsabilité unique. Ce n'est pas Claude qui a détecté le problème — c'est le script. Claude a exécuté le refacto une fois le problème identifié mécaniquement.

Le rôle a changé : je ne demandais plus à Claude d'être créatif sur la structure du code. Je définissais l'architecture, les règles, les invariants — et Claude les implémentait. Je suis passé de "pilote passager" à "co-pilote avec les mains sur les commandes".

---

## 3. Le verdict

### Ce qu'il fait bien

**La vitesse d'exécution est réelle.** Sur tout ce qui est CRUD standard, validation de formulaires, logique de composants React, Claude est deux à trois fois plus rapide que de coder à la main. Le schema Drizzle, les Server Actions atomiques avec transaction, la mise en place de Vitest — tout ça s'est fait proprement et vite.

**Sa capacité à digérer de la documentation technique est sous-estimée.** La dockerisation du projet (commit `cc91ac1`) illustre bien ça : multi-stage build Node 22, séparation des dépendances de production, gestion du lockfile. Claude a produit un `Dockerfile` et un `docker-compose.yml` fonctionnels en une passe, sans tâtonner sur les étapes de build. Il a absorbé les patterns Docker pour Next.js et les a appliqués correctement. C'est le même mécanisme pour le lockfile synchronisé dans `910822a` — un problème de packaging qui aurait pris du temps à diagnostiquer manuellement, résolu net.

### Ce qu'il ne fait pas bien

**Il manque du bon sens sur les règles métier spécifiques.** Le triathlon n'est pas dans son entraînement de la même façon que React ou TypeScript. Résultat : si vous ne lui donnez pas explicitement la formule `calculatedLoad = durationMinutes × RPE`, il va en inventer une qui *ressemble* à du calcul de charge sportive. Pareil pour les seuils d'usure : 3 ans pour un casque, 1 an pour la maintenance vélo. Ce sont des normes de sécurité triathlon réelles. Sans les documenter dans `CLAUDE.md`, il les aurait hardcodées au hasard, ou pire, demandé à l'utilisateur à chaque fois.

**Il choisit la solution de facilité si personne ne surveille.** Les types `any`, c'est exactement ça. TypeScript avec `any`, c'est TypeScript sans TypeScript. Claude y recourt dès qu'un type est un peu complexe à inférer. Sans la règle explicite dans `CLAUDE.md` et la pénalité dans l'audit, il laisserait traîner des `any` partout — ça compile, ça passe, mais ça casse toute la sécurité du typage statique. Ce n'est pas de la paresse : c'est qu'il optimise pour "produire du code qui marche maintenant", pas pour "maintenir un codebase dans 6 mois".

**Il extrapole avec trop de confiance.** Le bug Discord en est l'exemple le plus propre. Il ne dit pas "je ne sais pas quel format Discord attend". Il produit un payload plausible, sans signaler l'incertitude. Ce comportement est particulièrement dangereux sur les intégrations tierces, les formats d'API, et les calculs métier qui ne sont pas des patterns génériques.

---

### Ce qu'on en retient

Un LLM dans une boucle de développement, c'est un amplificateur. S'il n'y a pas de gouvernance en place, il amplifie les erreurs aussi vite que les bonnes décisions. Le `CLAUDE.md` n'est pas un fichier de configuration : c'est le document de gouvernance de l'agent. L'audit de dette et Husky ne sont pas des gardes-fous contre Claude — ce sont des gardes-fous contre toute forme de glissement, y compris humain.

La collaboration qui fonctionne ressemble à ça : l'humain définit les invariants métier, les contraintes architecturales, les règles de qualité. L'agent exécute dans ce cadre. Dès qu'on inverse les rôles — dès que l'agent définit la structure et l'humain valide en diagonal — les bugs logiques s'accumulent silencieusement derrière un code qui compile parfaitement.

---

## 4. Gestion des incidents et fuite de secrets (GitGuardian)

Le 1er juillet 2026, en fin de sprint, GitGuardian nous a envoyé une alerte automatique : un webhook Discord avait été commité en clair dans l'historique git. Pas dans un fichier `.env` mal ignoré — directement hardcodé dans `docker-compose.yml`, visiblement lors d'un test rapide pour valider l'intégration Discord avant de le "nettoyer plus tard". Le "plus tard" n'était jamais venu.

**Ce qui s'est passé exactement.** GitGuardian scanne les dépôts publics (et privés si connecté) en quasi temps réel. Il a détecté le pattern de l'URL Discord (`https://discord.com/api/webhooks/...`) dans un commit qui n'avait pas été purgé de l'historique. La notification est arrivée par e-mail avec le hash du commit, le fichier, et la ligne exacte. Difficile de faire plus précis.

**La réponse immédiate.** Deux actions en parallèle, dans les minutes qui suivent :

1. **Révoquer le webhook sur Discord.** Serveur → Paramètres de la chaîne → Intégrations → Webhooks → supprimer. Un webhook révoqué est mort : même si quelqu'un l'a copié depuis l'historique git, il ne renvoie plus rien. C'est le seul moyen de couper court à toute utilisation non autorisée.

2. **Basculer sur une variable d'environnement.** Le `docker-compose.yml` a été modifié pour passer de la valeur en dur à `${WEBHOOK_URL}`, la variable étant désormais injectée au runtime via un fichier `.env.local` qui ne sort jamais du poste local (couvert par la règle `.env*` dans `.gitignore`).

**Ce qu'on en retient.** Ce n'est pas un bug Claude — c'est une faute de process humain classique : tester vite, oublier de nettoyer, commiter. Ce que l'incident illustre, c'est que les outils de détection automatique (GitGuardian, git-secrets, trufflehog) ne remplacent pas la vigilance au moment du commit, mais ils rattrapent ce qui passe entre les mailles. Le délai entre le commit et l'alerte était de moins de dix minutes. Sans cet outil, ce webhook aurait pu rester accessible dans l'historique public indéfiniment.

La règle pratique qui en découle : **aucune clé, aucun token, aucune URL d'intégration ne vit dans un fichier commité**. Si ça ne peut pas aller dans `.env.local`, ça n'a pas sa place dans le repo. C'est valable pour les webhooks Discord autant que pour les clés API, les DSN de monitoring ou les tokens d'accès.

---

*Cadence — Post-mortem rédigé au terme du Niveau 3, 2026-07-01*
