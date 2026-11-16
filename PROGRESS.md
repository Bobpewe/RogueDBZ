# PROGRESS

## État actuel
M7 terminé et testé (18 tests OK + parcours réel Chromium à 60 fps). Jalon en cours : **M8**.

## Prochaine action
M8 : équilibrage avec l'IA (durée 20–30 min), tests run complet victoire/défaite, README, polish.

## Décisions prises
- Pas de modules ES : chaque fichier est une IIFE qui remplit l'espace de noms global `DBR` (window ou globalThis sous Node).
- `src/core/` = simulation pure (aucun DOM), `src/view/` = rendu, entrées, audio, menus.
- Monde = un écran fixe 960×540 (pas de caméra), murs de 32 px, obstacles circulaires.
- La simulation publie des événements dans `g.events` ; la vue les consomme (particules, sons, shake, hit-stop).
- Pas fixe 1/60 s ; `DBR.step(g, input)` avance d'un pas.
