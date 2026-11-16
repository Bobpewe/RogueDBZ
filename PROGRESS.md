# PROGRESS

## État actuel
M2 terminé et testé (6 tests OK). Jalon en cours : **M3**.

## Prochaine action
M3 : run.js (plan du run, vagues, porte, obstacles), hud.js (HUD + porte), IA de test dans smoke.js.

## Décisions prises
- Pas de modules ES : chaque fichier est une IIFE qui remplit l'espace de noms global `DBR` (window ou globalThis sous Node).
- `src/core/` = simulation pure (aucun DOM), `src/view/` = rendu, entrées, audio, menus.
- Monde = un écran fixe 960×540 (pas de caméra), murs de 32 px, obstacles circulaires.
- La simulation publie des événements dans `g.events` ; la vue les consomme (particules, sons, shake, hit-stop).
- Pas fixe 1/60 s ; `DBR.step(g, input)` avance d'un pas.
