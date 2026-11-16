# PROGRESS

## État actuel
Étape 0 terminée (docs + git). Jalon en cours : **M1**.

## Prochaine action
Écrire le moteur M1 : rng.js, game.js (joueur + salle), sprites/rendu/entrées, main.js, tests/smoke.js.

## Décisions prises
- Pas de modules ES : chaque fichier est une IIFE qui remplit l'espace de noms global `DBR` (window ou globalThis sous Node).
- `src/core/` = simulation pure (aucun DOM), `src/view/` = rendu, entrées, audio, menus.
- Monde = un écran fixe 960×540 (pas de caméra), murs de 32 px, obstacles circulaires.
- La simulation publie des événements dans `g.events` ; la vue les consomme (particules, sons, shake, hit-stop).
- Pas fixe 1/60 s ; `DBR.step(g, input)` avance d'un pas.
