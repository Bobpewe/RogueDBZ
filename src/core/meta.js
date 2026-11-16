/*
 * Dragon Roguelike — fan game non commercial
 * Auteur : Charles GRATIAS
 * meta.js : progression entre les runs. Monnaie permanente (Orbes du Dragon), bonus
 * permanents, déblocage des personnages, réglages, statistiques. Aucune dépendance au DOM :
 * le stockage est injecté (localStorage dans le navigateur, faux stockage dans les tests).
 */
(function () {
  'use strict';
  var DBR = (typeof window !== 'undefined') ? (window.DBR = window.DBR || {}) : (globalThis.DBR = globalThis.DBR || {});

  /** Bonus permanents achetables au Dojo. cost[n] = prix du niveau n+1. */
  DBR.PERKS = {
    hp: { name: 'Vitalité', desc: '+10 PV max par niveau', cost: [8, 14, 22, 32, 45] },
    dmg: { name: 'Force', desc: '+5 % de dégâts par niveau', cost: [10, 16, 24, 34, 48] },
    ki: { name: 'Maîtrise du Ki', desc: '+10 Ki max et +5 % de recharge par niveau', cost: [6, 10, 16, 24, 34] },
    zeni: { name: 'Bourse de départ', desc: '+25 Zeni au début du run par niveau', cost: [6, 10, 16, 24] },
    ultra: { name: 'Éveil', desc: 'Jauge ultime déjà remplie de 20 % par niveau', cost: [8, 12, 18, 26, 36] }
  };
  DBR.PERK_ORDER = ['hp', 'dmg', 'ki', 'zeni', 'ultra'];
  DBR.DIFFICULTIES = [{ name: 'Facile', mul: 0.7 }, { name: 'Normal', mul: 1 }, { name: 'Difficile', mul: 1.35 }];

  var Meta = DBR.Meta = { KEY: 'dragon-roguelike-save-v1' };

  Meta.defaults = function () {
    return {
      v: 1, orbs: 0, unlocked: { goku: true }, perks: { hp: 0, dmg: 0, ki: 0, zeni: 0, ultra: 0 },
      settings: { sfx: 0.6, music: 0.45, difficulty: 1, shake: true },
      stats: { runs: 0, wins: 0, bestRoom: 0, kills: 0, bestTime: 0 }
    };
  };

  /** Charge la sauvegarde ; une sauvegarde absente ou corrompue redonne les valeurs par défaut. */
  Meta.load = function (storage) {
    var d = Meta.defaults();
    try {
      var raw = storage && storage.getItem(Meta.KEY);
      if (raw) {
        var s = JSON.parse(raw);
        if (s && typeof s === 'object') {
          if (typeof s.orbs === 'number' && s.orbs >= 0) d.orbs = Math.floor(s.orbs);
          ['unlocked', 'perks', 'settings', 'stats'].forEach(function (k) {
            if (s[k] && typeof s[k] === 'object') for (var key in d[k]) if (typeof s[k][key] === typeof d[k][key]) d[k][key] = s[k][key];
          });
          DBR.CHAR_ORDER.forEach(function (c) { if (s.unlocked && s.unlocked[c] === true) d.unlocked[c] = true; });
        }
      }
    } catch (e) { /* sauvegarde illisible : on repart de zéro */ }
    return d;
  };

  Meta.save = function (storage, data) {
    try { if (storage) storage.setItem(Meta.KEY, JSON.stringify(data)); return true; } catch (e) { return false; }
  };

  /** Orbes gagnés par un run : 1 par salle nettoyée, 4 par (mini-)boss, 30 pour la victoire. */
  Meta.runReward = function (g) { return g.stats.rooms + g.stats.bosses * 4 + (g.won ? 30 : 0); };

  /** Enregistre la fin d'un run dans les données méta. Retourne les orbes gagnés. */
  Meta.finishRun = function (data, g) {
    var earned = Meta.runReward(g), st = data.stats;
    data.orbs += earned;
    st.runs++; st.kills += g.stats.kills;
    st.bestRoom = Math.max(st.bestRoom, g.roomIndex + (g.won ? 1 : 0));
    if (g.won) { st.wins++; st.bestTime = st.bestTime ? Math.min(st.bestTime, Math.round(g.time)) : Math.round(g.time); }
    return earned;
  };

  Meta.perkCost = function (data, id) { var c = DBR.PERKS[id].cost, n = data.perks[id]; return n < c.length ? c[n] : -1; };

  Meta.buyPerk = function (data, id) {
    var cost = Meta.perkCost(data, id);
    if (cost < 0 || data.orbs < cost) return false;
    data.orbs -= cost; data.perks[id]++;
    return true;
  };

  Meta.unlockChar = function (data, id) {
    var c = DBR.CHARS[id];
    if (!c || data.unlocked[id] || data.orbs < c.cost) return false;
    data.orbs -= c.cost; data.unlocked[id] = true;
    return true;
  };
})();
