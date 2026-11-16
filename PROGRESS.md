# PROGRESS

## État actuel
Tous les jalons M1 à M8 sont terminés. 23 tests OK (node tests/smoke.js). Parcours réel vérifié dans Chromium (60 fps, aucune erreur console).

## Prochaine action
Aucune action obligatoire. Pistes : test humain de la durée d'un run, retouches d'équilibrage, publication GitHub Pages.

## Décisions prises
- Pas de modules ES : chaque fichier est une IIFE qui remplit l'espace de noms global `DBR` (window ou globalThis sous Node).
- `src/core/` = simulation pure (aucun DOM), `src/view/` = rendu, entrées, audio, menus.
- Monde = un écran fixe 960×540 (pas de caméra), murs de 32 px, obstacles circulaires.
- La simulation publie des événements dans `g.events` ; la vue les consomme (particules, sons, shake, hit-stop).
- Pas fixe 1/60 s ; `DBR.step(g, input)` avance d'un pas.
- Run = 4 biomes × 6 salles (combat, combat, soin|trésor, mini-boss, boutique, boss) = 24 salles.
- Équilibrage (M8) : PV ennemis × (1,5 + 0,3 × profondeur) ; PV des boss absolus ; vagues chevauchantes
  (la suivante arrive dès qu'il reste ≤ 2 ennemis). Mesuré avec l'IA de test en Normal sans bonus :
  7 à 17 min simulées (moyenne ≈ 11 min), 11 victoires sur 12. L'IA vise parfaitement et tire en continu ;
  un humain est estimé à 20–30 min, à confirmer en jouant. Leviers : `hpMul`/`budget` dans run.js, PV des boss dans data.js.
- Monnaie méta : « Orbes du Dragon » (1/salle, 4/boss, 30/victoire). Vegeta 40, Piccolo 60.
- Banc d'équilibrage non versionné (script jetable) : rejouer des runs avec `playRun` de tests/smoke.js.
