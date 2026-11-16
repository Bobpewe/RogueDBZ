# PROGRESS

## État actuel
M5 terminé et testé (14 tests OK). Jalon en cours : **M6**.

## Prochaine action
M6 : bosses.js (IA de boss à phases, attaques composables), données + sprites des 4 mini-boss et 4 boss.

## Décisions prises
- Pas de modules ES : chaque fichier est une IIFE qui remplit l'espace de noms global `DBR` (window ou globalThis sous Node).
- `src/core/` = simulation pure (aucun DOM), `src/view/` = rendu, entrées, audio, menus.
- Monde = un écran fixe 960×540 (pas de caméra), murs de 32 px, obstacles circulaires.
- La simulation publie des événements dans `g.events` ; la vue les consomme (particules, sons, shake, hit-stop).
- Pas fixe 1/60 s ; `DBR.step(g, input)` avance d'un pas.
