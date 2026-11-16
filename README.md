# Dragon Roguelike — par Charles GRATIAS

Roguelike d'action 2D en vue de dessus, solo, jouable directement dans le navigateur, dans l'univers de Dragon Ball.

> **Fan game non commercial, non affilié à Bird Studio/Shueisha/Toei.**
> Aucun asset officiel : tous les sprites, effets, sons et musiques sont générés par le code.

## Le jeu

Choisis ton combattant et traverse 4 biomes de 6 salles (Plaines, Désert, Namek, Salle de l'Esprit et du Temps) :
combat → salle nettoyée → **1 amélioration parmi 3** → porte suivante. La mort est définitive, mais les
**Orbes du Dragon** gagnés à chaque run débloquent des personnages et des bonus permanents au Dojo.

- **3 personnages** : Goku (polyvalent, Kamehameha), Vegeta (puissant et fragile, Big Bang Attack),
  Piccolo (régénération et allonge, Makankosappo). Chacun a sa transformation ultime sur jauge.
- **20 ennemis** aux comportements lisibles et télégraphiés : mêlée, tireurs, chargeurs, invocateurs, kamikazes, tourelles.
- **4 mini-boss, 3 boss à phases et un boss final** (Raditz, Nappa, Freezer, Boo).
- **26 améliorations** en 3 raretés (commun, rare, légendaire) qui se cumulent et se combinent.
- Salles spéciales : **boutique** (Zeni), **soin** (haricot Senzu), **trésor**.
- Un run complet dure environ **20 à 30 minutes**. Chaque run est reproductible grâce à sa **graine** (seed).

## Contrôles

| Action | Touches |
|---|---|
| Se déplacer | `ZQSD` (AZERTY) / `WASD` (QWERTY) / flèches |
| Viser | Souris |
| Ki blast | Clic gauche ou `J` |
| Dash (bref instant d'invulnérabilité) | `Espace` |
| Attaque spéciale (consomme du Ki) | Clic droit ou `K` |
| Transformation ultime (jauge pleine) | `F` ou `L` |
| Acheter en boutique | `E` |
| Pause | `Échap` ou `P` |
| Choisir une amélioration | Clic, `1` / `2` / `3`, ou `←` `→` puis `Entrée` |

Au clavier seul (`J`/`K` sans toucher la souris), la visée se verrouille automatiquement sur l'ennemi le plus proche.
Les touches sont lues par position physique : ZQSD et WASD fonctionnent sans réglage.

## Lancer en local

Aucune installation, aucun build, aucune dépendance :

1. Télécharge ou clone le dépôt.
2. Double-clique sur `index.html` (fonctionne en `file://`).

Ou, au choix, avec un petit serveur local :

```bash
python3 -m http.server 8000
```

puis ouvre `http://localhost:8000`.

## Publier sur GitHub Pages

1. Pousse le dépôt sur GitHub (avec `index.html` à la racine).
2. Dans le dépôt : **Settings → Pages → Build and deployment → Source : « Deploy from a branch »**.
3. Choisis la branche `main` et le dossier `/ (root)`, puis **Save**.
4. Après une minute, le jeu est en ligne sur `https://<utilisateur>.github.io/<dépôt>/`.

Le projet n'utilise que des chemins relatifs : il fonctionne tel quel dans un sous-dossier.

## Tests

```bash
node tests/smoke.js
```

Sans dépendance. Les tests chargent la logique du jeu sans navigateur, simulent des milliers de frames,
font jouer des runs complets à une IA simple (victoire contre le boss final, défaites), vérifient
la reproductibilité par la graine et la sauvegarde (écriture, relecture, données corrompues).

## Architecture

```
index.html            page unique, charge les scripts dans l'ordre (pas de modules ES)
src/core/             SIMULATION — aucun accès au DOM, testable sous Node
  rng.js              RNG à graine (mulberry32) + utilitaires géométriques
  data.js             personnages, ennemis, boss, biomes
  upgrades.js         améliorations, tirage 1 parmi 3, objets des salles spéciales
  game.js             état de la partie, joueur, pas de temps fixe (DBR.step)
  combat.js           tirs, dash, spéciaux, ultime, dégâts, rayons, zones, butin
  enemies.js          IA des ennemis (move → windup → attaque → recover)
  bosses.js           IA des boss : phases et attaques composables
  run.js              plan du run, vagues, obstacles, cycle des salles
  meta.js             méta-progression et sauvegarde (stockage injecté)
src/view/             VUE — Canvas 2D, entrées, audio
  sprites.js          pixel art défini par des tableaux + palettes
  render.js, fx.js    décor, entités, particules, shake, hit-stop, flashs
  hud.js, ui.js       HUD, cartes d'amélioration, menus
  audio.js            bruitages et musique générative WebAudio
  input.js            clavier + souris
src/main.js           boucle à pas fixe (1/60 s) et machine à états
tests/smoke.js        tests de fumée Node
```

La simulation publie des événements (`g.events`) que la vue transforme en particules, sons, secousses
et hit-stop : la logique ne dépend jamais du rendu. La sauvegarde utilise `localStorage`
(clé `dragon-roguelike-save-v1`).

## Crédits

- **Conception, direction et réalisation : Charles GRATIAS**
- Code, pixel art, effets, sons et musique : entièrement générés par le code (JavaScript vanilla, Canvas 2D, WebAudio).
- Hommage à l'œuvre d'Akira Toriyama. Dragon Ball et ses personnages appartiennent à leurs ayants droit
  (Bird Studio / Shueisha / Toei Animation). Ce projet est un fan game gratuit, sans but commercial ni affiliation.
