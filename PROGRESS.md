# PROGRESS

## État actuel
M6 terminé et testé (16 tests OK). Jalon en cours : **M7**.

## Prochaine action
M7 : meta.js (sauvegarde, orbes, bonus, déblocages), audio.js (WebAudio), menus dans ui.js, machine à états dans main.js.

## Décisions prises
- Pas de modules ES : chaque fichier est une IIFE qui remplit l'espace de noms global `DBR` (window ou globalThis sous Node).
- `src/core/` = simulation pure (aucun DOM), `src/view/` = rendu, entrées, audio, menus.
- Monde = un écran fixe 960×540 (pas de caméra), murs de 32 px, obstacles circulaires.
- La simulation publie des événements dans `g.events` ; la vue les consomme (particules, sons, shake, hit-stop).
- Pas fixe 1/60 s ; `DBR.step(g, input)` avance d'un pas.
