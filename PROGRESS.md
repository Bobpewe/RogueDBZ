# PROGRESS

## État actuel
M1 terminé et testé (4 tests OK). Jalon en cours : **M2**.

## Prochaine action
M2 : combat.js (tirs, dash, Ki, spécial, ultime, dégâts), enemies.js (IA), fx.js (particules, shake, hit-stop).

## Décisions prises
- Pas de modules ES : chaque fichier est une IIFE qui remplit l'espace de noms global `DBR` (window ou globalThis sous Node).
- `src/core/` = simulation pure (aucun DOM), `src/view/` = rendu, entrées, audio, menus.
- Monde = un écran fixe 960×540 (pas de caméra), murs de 32 px, obstacles circulaires.
- La simulation publie des événements dans `g.events` ; la vue les consomme (particules, sons, shake, hit-stop).
- Pas fixe 1/60 s ; `DBR.step(g, input)` avance d'un pas.
