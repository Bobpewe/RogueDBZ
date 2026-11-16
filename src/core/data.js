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
    }
  };
  DBR.CHAR_ORDER = ['goku'];

  /*
   * Ennemis. ai = comportement (voir enemies.js) ; cost = poids dans le budget d'une vague ;
   * sprite/swap = dessin de base + recoloration ; zeni = [min, max] lâchés à la mort.
   */
  DBR.ENEMIES = {
    // --- Plaines ---
    wolf: { name: 'Loup', ai: 'melee', hp: 26, speed: 125, r: 12, dmg: 9, reach: 16, cd: 0.8, zeni: [1, 3], cost: 1, sprite: 'beast', color: '#8d8f9c' },
    soldier: { name: 'Soldat du Ruban Rouge', ai: 'ranged', hp: 24, speed: 80, r: 11, dmg: 8, keep: 250, shots: 1, bulletSpeed: 220, cd: 1.9, zeni: [2, 4], cost: 1.5, sprite: 'soldier', color: '#b33a3a' },
    brute: { name: 'Colosse', ai: 'charger', hp: 60, speed: 70, r: 15, dmg: 14, dashSpeed: 470, cd: 1.6, zeni: [3, 6], cost: 2.5, sprite: 'brute', color: '#a5653a' },
    tamer: { name: 'Dresseur', ai: 'summoner', hp: 42, speed: 75, r: 12, dmg: 0, minion: 'wolf', count: 2, cd: 5.5, zeni: [4, 7], cost: 3, sprite: 'mage', color: '#5b3f8a' }
  };

  /*
   * Biomes : palette du décor, ennemis (du plus simple au plus retors), mini-boss et boss.
   */
  DBR.BIOMES = [
    {
      id: 'plaines', name: 'Plaines', pool: ['wolf', 'soldier', 'brute', 'tamer'], miniboss: 'metallic', boss: 'raditz',
      pal: { floor: '#4f9a4a', floor2: '#4b9446', speck: '#6fbd62', wall: '#3a5a34', wallTop: '#5c8a50', wallDark: '#24381f', rock: '#8a8c94', rockDark: '#55575e', accent: '#ffe066' }
    }
  ];
})();
