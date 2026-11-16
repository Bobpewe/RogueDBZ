# GAME_DESIGN — brief d'origine (enregistré tel quel)

Auteur du projet : Charles GRATIAS

---

Tu es un développeur de jeux senior. Construis un roguelike 2D jouable dans un navigateur, solo uniquement, dans l'univers Dragon Ball (fan game non commercial, sans aucun asset officiel).

## Étape 0 : organisation (avant tout code)
- Enregistre ce brief tel quel dans GAME_DESIGN.md.
- Crée PLAN.md : jalons M1 à M8 avec cases à cocher.
- Crée PROGRESS.md : état actuel, prochaine action, décisions prises. Mets-le à jour et fais un commit git à CHAQUE jalon, pour pouvoir reprendre proprement après une compaction de contexte.
- Initialise git si nécessaire.

## Contraintes techniques
- JavaScript vanilla + Canvas 2D, aucun build, aucune dépendance externe ni CDN.
- Doit fonctionner en ouvrant index.html directement (double-clic, donc pas de modules ES via file://) ET sur GitHub Pages.
- Sépare strictement la logique du jeu (simulation, sans DOM) du rendu/entrées, pour pouvoir la tester sous Node.
- Boucle à pas de temps fixe, RNG avec graine (seed) pour reproduire un run.
- Tout est généré par le code : sprites en pixel art dessinés depuis des tableaux/palettes, effets de particules, sons et musique synthétisés avec WebAudio. Aucun fichier image/son externe.

## Gameplay (action temps réel, vue de dessus)
- Déplacement libre (ZQSD et WASD + flèches), visée à la souris, tir de Ki blast (clic gauche ou J), dash/esquive avec invulnérabilité brève (Espace), attaque spéciale (K ou clic droit) consommant du Ki, transformation ultime sur jauge (ex. Super Saiyan : stats boostées, durée limitée).
- Ressources : PV, Ki (se recharge), Zeni (monnaie).
- Run = enchaînement de salles : combat → salle nettoyée → choix d'1 amélioration parmi 3 → porte suivante. Salles spéciales : boutique (Zeni), soin (Sorbier/Haricot magique), salle à trésor.
- Mort définitive à chaque run ; progression méta légère entre les runs (déblocage de personnages et bonus permanents avec une monnaie, sauvegardée en localStorage).
- Difficulté croissante, ennemis variés avec patterns lisibles (mêlée, distance, chargeurs, invocateurs), mini-boss et boss à phases.

## Contenu cible (ambition moyenne)
- 3 personnages jouables aux styles distincts (ex. Goku : polyvalent ; Vegeta : puissant et fragile ; Piccolo : régénération et allonge).
- 4 biomes (ex. plaines, désert, Namek, Salle de l'Esprit et du Temps), ~5 salles chacun, avec leur palette et leurs ennemis.
- 3 boss + un boss final.
- ~20 améliorations/objets qui se combinent (rareté commun/rare/légendaire).
- Écran titre, sélection du personnage, HUD clair, pause, réglages (volume), écran de fin de run avec stats, écran de victoire.

## Qualité
- 60 fps stable, contrôles réactifs, feedback d'impact (screen shake, hit-stop, particules, flash des dégâts).
- Équilibrage jouable : un run complet dure 20 à 30 minutes.
- Code lisible, modulaire, commenté en français.

## Signature obligatoire
Le nom « Charles GRATIAS » doit figurer à plusieurs endroits : écran titre, écran de crédits/fin, <title> et pied de page de la page HTML, en-tête de README.md, commentaire d'en-tête des fichiers principaux.

## README.md
Description, contrôles, comment lancer en local et publier sur GitHub Pages, mention « Fan game non commercial, non affilié à Bird Studio/Shueisha/Toei », crédits.

## Jalons suggérés
M1 moteur + joueur + salle vide · M2 combat, ennemis, dash, Ki · M3 génération des salles et progression d'un étage · M4 améliorations et objets · M5 biomes, 3 personnages, boutique · M6 boss + boss final · M7 méta-progression, menus, sons/musique · M8 équilibrage, tests, polish, README.

## Tests (obligatoire)
Crée tests/smoke.js (Node, sans dépendance) qui : charge la logique du jeu, simule des centaines de frames sans exception, joue un run complet avec une IA simple jusqu'au boss final (cas victoire et cas défaite), et vérifie la sauvegarde. Lance-le à chaque jalon et affiche sa sortie complète.

## Gestion du budget
Ne dépasse pas le jalon en cours : termine-le, teste-le, commite-le, puis passe au suivant. Évite les relectures inutiles de gros fichiers et les réécritures complètes ; préfère les modifications ciblées. Commence maintenant par l'étape 0, puis le jalon M1.
