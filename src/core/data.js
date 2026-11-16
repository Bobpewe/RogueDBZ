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
      ultraName: 'Super Saiyan', ultraDmg: 1.5, cost: 0, color: '#ff9a2e'
    }
  };
  DBR.CHAR_ORDER = ['goku'];
})();
