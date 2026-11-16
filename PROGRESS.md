# PROGRESS

## État actuel
M4 terminé et testé (11 tests OK). Jalon en cours : **M5**.

## Prochaine action
M5 : 4 biomes (palettes + ennemis recolorés), 3 personnages (sprites Vegeta, Piccolo), vérifier la boutique en jeu.

## Décisions prises
- Pas de modules ES : chaque fichier est une IIFE qui remplit l'espace de noms global `DBR` (window ou globalThis sous Node).
- `src/core/` = simulation pure (aucun DOM), `src/view/` = rendu, entrées, audio, menus.
- Monde = un écran fixe 960×540 (pas de caméra), murs de 32 px, obstacles circulaires.
- La simulation publie des événements dans `g.events` ; la vue les consomme (particules, sons, shake, hit-stop).
- Pas fixe 1/60 s ; `DBR.step(g, input)` avance d'un pas.
