/*
 * Dragon Roguelike — fan game non commercial
 * Auteur : Charles GRATIAS
 * data.js : données de jeu (personnages, ennemis, biomes). Aucune logique ici.
 */
(function () {
  'use strict';
  var DBR = (typeof window !== 'undefined') ? (window.DBR = window.DBR || {}) : (globalThis.DBR = globalThis.DBR || {});

  /** Personnages jouables. Les vitesses sont en px/s, fireRate en tirs/s. */
  DBR.CHARS = {
    goku: {
      id: 'goku', name: 'Goku', desc: 'Polyvalent. Kamehameha : rayon continu.',
      hp: 100, speed: 190, dmg: 10, fireRate: 5, bulletSpeed: 520, range: 0.85,
      kiMax: 100, kiRegen: 14, regen: 0, special: 'kamehameha', specialName: 'Kamehameha',
      ultraName: 'Super Saiyan', ultraDmg: 1.5, cost: 0, color: '#ffd23e', auraColor: '#ffe23e', ultraSwap: { K: '#ffe23e' }
    },
    vegeta: {
      id: 'vegeta', name: 'Vegeta', desc: 'Puissant mais fragile. Big Bang Attack : sphère explosive.',
      hp: 75, speed: 200, dmg: 14, fireRate: 4.5, bulletSpeed: 560, range: 0.8,
      kiMax: 100, kiRegen: 13, regen: 0, special: 'bigbang', specialName: 'Big Bang Attack',
      ultraName: 'Super Saiyan', ultraDmg: 1.7, cost: 40, color: '#c69cff', auraColor: '#ffe23e', ultraSwap: { K: '#ffe23e' }
    },
    piccolo: {
      id: 'piccolo', name: 'Piccolo', desc: 'Régénération et allonge. Makankosappo : rayon perforant.',
      hp: 110, speed: 178, dmg: 9, fireRate: 5, bulletSpeed: 640, range: 1.2,
      kiMax: 120, kiRegen: 16, regen: 1.2, special: 'makanko', specialName: 'Makankosappo',
      ultraName: 'Fusion Namek', ultraDmg: 1.4, cost: 60, color: '#c8ff6a', auraColor: '#e8f0ff', ultraSwap: null
    }
  };
  DBR.CHAR_ORDER = ['goku', 'vegeta', 'piccolo'];

  /*
   * Ennemis. ai = comportement (voir enemies.js) ; cost = poids dans le budget d'une vague ;
   * sprite/swap = dessin de base + recoloration ; zeni = [min, max] lâchés à la mort.
   */
  DBR.ENEMIES = {
    // --- Plaines ---
    wolf: { name: 'Loup', ai: 'melee', hp: 26, speed: 125, r: 12, dmg: 9, reach: 16, cd: 0.8, zeni: [1, 3], cost: 1, sprite: 'beast', color: '#8d8f9c' },
    soldier: { name: 'Soldat du Ruban Rouge', ai: 'ranged', hp: 24, speed: 80, r: 11, dmg: 8, keep: 250, shots: 1, bulletSpeed: 220, cd: 1.9, zeni: [2, 4], cost: 1.5, sprite: 'soldier', color: '#b33a3a' },
    brute: { name: 'Colosse', ai: 'charger', hp: 60, speed: 70, r: 15, dmg: 14, dashSpeed: 470, cd: 1.6, zeni: [3, 6], cost: 2.5, sprite: 'brute', color: '#a5653a' },
    tamer: { name: 'Dresseur', ai: 'summoner', hp: 42, speed: 75, r: 12, dmg: 0, minion: 'wolf', count: 2, cd: 5.5, zeni: [4, 7], cost: 3, sprite: 'mage', color: '#5b3f8a' },
    // --- Désert ---
    jackal: { name: 'Chacal des sables', ai: 'melee', hp: 32, speed: 145, r: 12, dmg: 10, reach: 16, cd: 0.7, zeni: [2, 4], cost: 1, sprite: 'beast', swap: { G: '#c9a05a', D: '#8a6a34' }, color: '#c9a05a' },
    saibaman: { name: 'Saibaman', ai: 'bomber', hp: 30, speed: 150, r: 11, dmg: 18, zeni: [2, 4], cost: 1.5, sprite: 'imp', color: '#5fae3c' },
    bandit: { name: 'Bandit du désert', ai: 'ranged', hp: 38, speed: 90, r: 11, dmg: 9, keep: 260, shots: 3, spread: 0.28, bulletSpeed: 230, cd: 2.1, zeni: [3, 5], cost: 2, sprite: 'soldier', swap: { H: '#f0e8d8', u: '#8a5a30' }, color: '#f0e8d8' },
    raider: { name: 'Pillard', ai: 'charger', hp: 85, speed: 80, r: 15, dmg: 15, dashSpeed: 500, cd: 1.4, zeni: [4, 7], cost: 2.5, sprite: 'brute', swap: { a: '#7a4a6a', H: '#d8c8a8' }, color: '#7a4a6a' },
    sandbot: { name: 'Robot pilleur', ai: 'turret', hp: 75, speed: 45, r: 12, dmg: 9, shots: 8, bulletSpeed: 170, cd: 2.6, zeni: [4, 8], cost: 3, sprite: 'robot', swap: { m: '#b08a4a', d: '#6a4a24' }, color: '#b08a4a' },
    // --- Namek ---
    nbeast: { name: 'Bête de Namek', ai: 'melee', hp: 50, speed: 150, r: 12, dmg: 11, reach: 16, cd: 0.7, zeni: [2, 5], cost: 1, sprite: 'beast', swap: { G: '#5a7ad0', D: '#34489a' }, color: '#5a7ad0' },
    fsoldier: { name: 'Soldat de Freezer', ai: 'ranged', hp: 48, speed: 95, r: 11, dmg: 10, keep: 270, shots: 2, spread: 0.2, bulletSpeed: 270, cd: 1.7, zeni: [3, 6], cost: 1.5, sprite: 'soldier', swap: { H: '#7a4ab0', u: '#e8e8f0', s: '#9ad0a0' }, color: '#7a4ab0' },
    felite: { name: 'Soldat d\'élite', ai: 'charger', hp: 110, speed: 85, r: 15, dmg: 16, dashSpeed: 540, cd: 1.3, zeni: [4, 8], cost: 2.5, sprite: 'brute', swap: { a: '#e8e8f0', s: '#d08ab0', H: '#5a3a7a', b: '#c8a030' }, color: '#d08ab0' },
    fdrone: { name: 'Drone éclaireur', ai: 'turret', hp: 85, speed: 55, r: 12, dmg: 10, shots: 10, bulletSpeed: 185, cd: 2.4, zeni: [4, 8], cost: 3, sprite: 'robot', swap: { m: '#8a5ac0', d: '#4a2a7a', R: '#6affd0' }, color: '#8a5ac0' },
    fmage: { name: 'Mage de l\'armée', ai: 'summoner', hp: 80, speed: 80, r: 12, dmg: 0, minion: 'nbeast', count: 2, cd: 5, zeni: [5, 9], cost: 3.5, sprite: 'mage', swap: { h: '#2a7a6a', e: '#ff6060' }, color: '#2a7a6a' },
    // --- Salle de l'Esprit et du Temps ---
    celljr: { name: 'Cell Junior', ai: 'melee', hp: 75, speed: 175, r: 11, dmg: 13, reach: 16, cd: 0.6, zeni: [3, 6], cost: 1.2, sprite: 'imp', swap: { g: '#4a9ad8', d: '#2a5a9a', v: '#2a5a9a', R: '#ff60c0' }, color: '#4a9ad8' },
    phantom: { name: 'Fantôme kamikaze', ai: 'bomber', hp: 55, speed: 170, r: 11, dmg: 22, zeni: [3, 6], cost: 1.5, sprite: 'imp', swap: { g: '#f0f0ff', d: '#b0b8e0', v: '#b0b8e0', R: '#4060ff' }, color: '#d0d8ff' },
    spectre: { name: 'Spectre du temps', ai: 'ranged', hp: 70, speed: 100, r: 12, dmg: 11, keep: 280, shots: 3, spread: 0.22, bulletSpeed: 280, cd: 1.6, zeni: [4, 7], cost: 2, sprite: 'mage', swap: { h: '#7888b8', e: '#60e0ff' }, color: '#7888b8' },
    shadow: { name: 'Ombre guerrière', ai: 'charger', hp: 140, speed: 95, r: 15, dmg: 18, dashSpeed: 580, cd: 1.2, zeni: [5, 9], cost: 2.5, sprite: 'brute', swap: { a: '#3a3a4a', s: '#5a5a6a', H: '#1a1a22', p: '#2a2a33', b: '#ff4040', e: '#ff4040' }, color: '#3a3a4a' },
    timeorb: { name: 'Sphère du temps', ai: 'turret', hp: 110, speed: 60, r: 12, dmg: 11, shots: 12, bulletSpeed: 195, cd: 2.2, zeni: [5, 9], cost: 3, sprite: 'robot', swap: { m: '#d8b040', d: '#8a6a14', a: '#ffffff', R: '#40a0ff' }, color: '#d8b040' },
    oracle: { name: 'Oracle', ai: 'summoner', hp: 100, speed: 85, r: 12, dmg: 0, minion: 'celljr', count: 2, cd: 5, zeni: [6, 10], cost: 4, sprite: 'mage', swap: { h: '#c8a030', e: '#ffffff' }, color: '#c8a030' },

    /*
     * Mini-boss (boss: 1) et boss (boss: 2). Leurs PV sont absolus (non multipliés par la profondeur).
     * phases[k].at = fraction de PV à laquelle la phase k commence ; attacks = voir bosses.js.
     */
    metallic: { name: 'Sergent Métallique', boss: 1, ai: 'boss', hp: 900, speed: 70, r: 20, dmg: 9, bulletSpeed: 220, zeni: [35, 45], cost: 99, sprite: 'robot', scale: 3, color: '#7d8496',
      phases: [{ at: 1, attacks: ['aimed', 'slam'], rest: 1.3 }] },
    saibaking: { name: 'Saibaman Alpha', boss: 1, ai: 'boss', hp: 1500, speed: 90, r: 20, dmg: 9, bulletSpeed: 220, minion: 'saibaman', zeni: [45, 55], cost: 99, sprite: 'imp', swap: { g: '#8a5ac0', d: '#5a2a8a', v: '#5a2a8a' }, scale: 3, color: '#8a5ac0',
      phases: [{ at: 1, attacks: ['summon', 'charge', 'ring'], rest: 1.2 }] },
    dodoria: { name: 'Dodoria', boss: 1, ai: 'boss', hp: 2400, speed: 85, r: 22, dmg: 9, bulletSpeed: 230, zeni: [55, 65], cost: 99, sprite: 'brute', swap: { a: '#e8e8f0', s: '#e07aa0', H: '#e07aa0', b: '#c8a030', p: '#e07aa0' }, scale: 3, color: '#e07aa0',
      phases: [{ at: 1, attacks: ['charge', 'ring', 'aimed'], rest: 1.1 }] },
    cell: { name: 'Cell', boss: 1, ai: 'boss', hp: 3600, speed: 100, r: 20, dmg: 9, bulletSpeed: 240, zeni: [65, 80], cost: 99, sprite: 'cell', scale: 3, color: '#6ab04a',
      phases: [{ at: 1, attacks: ['beam', 'teleport', 'aimed', 'spiral'], rest: 1 }] },
    raditz: { name: 'Raditz', boss: 2, ai: 'boss', hp: 1900, speed: 95, r: 20, dmg: 9, bulletSpeed: 230, zeni: [70, 90], cost: 99, sprite: 'raditz', scale: 3, color: '#b88a3a',
      phases: [{ at: 1, attacks: ['aimed', 'charge'], rest: 1.3 }, { at: 0.5, attacks: ['aimed', 'charge', 'ring'], rest: 1 }] },
    nappa: { name: 'Nappa', boss: 2, ai: 'boss', hp: 3400, speed: 85, r: 22, dmg: 9, bulletSpeed: 230, zeni: [90, 110], cost: 99, sprite: 'nappa', scale: 3, color: '#c8a030',
      phases: [{ at: 1, attacks: ['slam', 'charge', 'ring'], rest: 1.2 }, { at: 0.5, attacks: ['slam', 'rain', 'charge', 'beam'], rest: 0.9 }] },
    freezer: { name: 'Freezer', boss: 2, ai: 'boss', hp: 5400, speed: 110, r: 18, dmg: 9, bulletSpeed: 250, zeni: [110, 130], cost: 99, sprite: 'freezer', scale: 3, color: '#b070e0',
      phases: [{ at: 1, attacks: ['aimed', 'beam', 'teleport'], rest: 1.1 }, { at: 0.66, attacks: ['spiral', 'beam', 'slam', 'teleport'], rest: 0.9 }, { at: 0.33, attacks: ['spiral', 'rain', 'beam', 'charge', 'teleport'], rest: 0.7 }] },
    boo: { name: 'Boo', boss: 2, ai: 'boss', hp: 8000, speed: 115, r: 20, dmg: 9, bulletSpeed: 255, minion: 'phantom', zeni: [0, 0], cost: 99, sprite: 'boo', scale: 3, color: '#ff8ac0',
      phases: [{ at: 1, attacks: ['ring', 'aimed', 'charge', 'summon'], rest: 1 }, { at: 0.66, attacks: ['spiral', 'slam', 'teleport', 'beam'], rest: 0.85 }, { at: 0.33, attacks: ['spiral', 'rain', 'beam', 'charge', 'teleport', 'summon'], rest: 0.65 }] }
  };

  /*
   * Biomes : palette du décor, ennemis (du plus simple au plus retors), mini-boss et boss.
   */
  DBR.BIOMES = [
    {
      id: 'plaines', name: 'Plaines', pool: ['wolf', 'soldier', 'brute', 'tamer'], miniboss: 'metallic', boss: 'raditz',
      pal: { floor: '#4f9a4a', floor2: '#4b9446', speck: '#6fbd62', wall: '#3a5a34', wallTop: '#5c8a50', wallDark: '#24381f', rock: '#8a8c94', rockDark: '#55575e', accent: '#ffe066' }
    },
    {
      id: 'desert', name: 'Désert', pool: ['jackal', 'saibaman', 'bandit', 'raider', 'sandbot'], miniboss: 'saibaking', boss: 'nappa',
      pal: { floor: '#d9b46a', floor2: '#d5af64', speck: '#eccf8e', wall: '#8a5a30', wallTop: '#b07a44', wallDark: '#55351a', rock: '#b0885a', rockDark: '#7a5a36', accent: '#ffe066' }
    },
    {
      id: 'namek', name: 'Namek', pool: ['nbeast', 'fsoldier', 'felite', 'fdrone', 'fmage'], miniboss: 'dodoria', boss: 'freezer',
      pal: { floor: '#4fb89a', floor2: '#4bb294', speck: '#8fe8c8', wall: '#2a6a7a', wallTop: '#3f93a3', wallDark: '#184450', rock: '#8fa8c8', rockDark: '#5a7294', accent: '#aaff88' }
    },
    {
      id: 'temps', name: 'Salle de l\'Esprit et du Temps', pool: ['celljr', 'phantom', 'spectre', 'shadow', 'timeorb', 'oracle'], miniboss: 'cell', boss: 'boo',
      pal: { floor: '#e4e8f2', floor2: '#dfe3ee', speck: '#ffffff', wall: '#a0a8c4', wallTop: '#c4cce2', wallDark: '#7078a0', rock: '#c8d0e4', rockDark: '#9098b4', accent: '#66d0ff' }
    }
  ];
})();
