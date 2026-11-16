/*
 * Dragon Roguelike — fan game non commercial
 * Auteur : Charles GRATIAS
 * upgrades.js : améliorations (3 raretés), tirage « 1 parmi 3 », et objets des salles
 * spéciales (haricot Senzu, coffre, étals de la boutique). Simulation pure.
 *
 * Chaque amélioration modifie directement les statistiques du joueur : elles se cumulent
 * et se combinent librement (ex. Double tir + Ki perforant + Ki explosif + Ricochet).
 */
(function () {
  'use strict';
  var DBR = (typeof window !== 'undefined') ? (window.DBR = window.DBR || {}) : (globalThis.DBR = globalThis.DBR || {});
  var U = DBR.U;   // (DBR.W et DBR.H sont lus à l'exécution : game.js est chargé après ce fichier)

  DBR.RARITY = [
    { name: 'Commun', color: '#c8d0e0', price: 40 },
    { name: 'Rare', color: '#4aa8ff', price: 75 },
    { name: 'Légendaire', color: '#ffb020', price: 130 }
  ];

  var UP = DBR.UPGRADES = {};
  /** Déclare une amélioration. max = nombre maximal d'exemplaires cumulables. */
  function up(id, rar, icon, name, desc, apply, max) { UP[id] = { id: id, rar: rar, icon: icon, name: name, desc: desc, apply: apply, max: max || 99 }; }

  // --- Communes ---
  up('train', 0, 'F', 'Entraînement intensif', '+15 % de dégâts.', function (p) { p.dmg *= 1.15; }, 8);
  up('weights', 0, 'V', 'Vêtements lestés retirés', '+10 % de vitesse de déplacement.', function (p) { p.speed *= 1.1; }, 5);
  up('heart', 0, '♥', 'Cœur de guerrier', '+20 PV max et soigne 20 PV.', function (p) { p.maxHp += 20; p.hp = Math.min(p.maxHp, p.hp + 20); });
  up('meditate', 0, 'K', 'Méditation', '+25 Ki max et +25 % de recharge du Ki.', function (p) { p.kiMax += 25; p.kiRegen *= 1.25; });
  up('rapid', 0, 'R', 'Rafale de Ki', '+15 % de cadence de tir.', function (p) { p.fireRate *= 1.15; });
  up('step', 0, 'D', 'Déplacement instantané', 'Dash rechargé 20 % plus vite.', function (p) { p.dashMax *= 0.8; }, 4);
  up('purse', 0, 'Z', 'Capsule Hoi-Poi', '+40 % de Zeni ramassés et +20 Zeni.', function (p) { p.zeniMul += 0.4; p.zeni += 20; });
  up('tough', 0, 'A', 'Peau d\'acier', '−10 % de dégâts subis.', function (p) { p.dmgTaken *= 0.9; }, 5);
  up('reach', 0, 'P', 'Allonge', '+25 % de portée et tirs 10 % plus rapides.', function (p) { p.range *= 1.25; p.bulletSpeed *= 1.1; }, 4);
  // --- Rares ---
  up('double', 1, '2', 'Double tir', '+1 projectile par tir (dégâts −12 %).', function (p) { p.multishot += 1; p.dmg *= 0.88; }, 3);
  up('pierce', 1, '»', 'Ki perforant', 'Les tirs traversent 1 ennemi de plus.', function (p) { p.pierce += 1; }, 4);
  up('homing', 1, '@', 'Ki à tête chercheuse', 'Les tirs dévient vers les ennemis proches.', function (p) { p.homing += 3; }, 3);
  up('boom', 1, '*', 'Ki explosif', 'Les tirs explosent à l\'impact (50 % des dégâts en zone).', function (p) { p.explode = p.explode ? p.explode + 12 : 34; }, 4);
  up('vamp', 1, '+', 'Absorption d\'énergie', '+1 PV à chaque élimination.', function (p) { p.lifesteal += 1; }, 3);
  up('after', 1, 'I', 'Image rémanente', 'Le dash laisse une image qui explose (200 % des dégâts).', function (p) { p.afterimage += 2; }, 3);
  up('counter', 1, 'C', 'Contre-attaque', '+50 % de dégâts pendant 2,5 s après un dash.', function (p) { p.counter += 0.5; }, 3);
  up('crit', 1, '!', 'Point vital', '+15 % de chances de coup critique (dégâts ×2).', function (p) { p.crit += 0.15; }, 5);
  up('aura', 1, 'O', 'Aura brûlante', 'Votre aura brûle les ennemis proches.', function (p) { p.aura += 0.35; }, 4);
  up('rage', 1, 'S', 'Rage du Saiyan', '+50 % de dégâts sous 40 % de PV.', function (p) { p.rage += 0.5; }, 3);
  up('spirit', 1, 'U', 'Esprit combatif', 'Jauge ultime +40 % plus rapide, transformation +3 s.', function (p) { p.ultraGain += 0.4; p.ultraDur += 3; }, 3);
  // --- Légendaires ---
  up('kaioken', 2, 'X', 'Kaioken', '+40 % de dégâts, +20 % de cadence, mais +15 % de dégâts subis.', function (p) { p.dmg *= 1.4; p.fireRate *= 1.2; p.dmgTaken *= 1.15; }, 2);
  up('ricochet', 2, '^', 'Ricochet', 'Les tirs rebondissent 2 fois sur les murs.', function (p) { p.bounce += 2; p.range *= 1.3; }, 2);
  up('senzu', 2, 'B', 'Senzu de secours', 'Vous ressuscite une fois avec 50 % des PV.', function (p) { p.revive += 1; }, 2);
  up('master', 2, 'M', 'Maître du Ki', 'Spécial : coût −40 %, dégâts +50 %.', function (p) { p.specialCost *= 0.6; p.specialMul *= 1.5; }, 2);
  up('zenkai', 2, 'Z', 'Zenkai', 'Après chaque salle : +3 % de dégâts permanents et soin de 8 % des PV.', function (p) { p.zenkai += 0.03; }, 1);
  up('fan', 2, '3', 'Tir en éventail', '+2 projectiles par tir (dégâts −20 %).', function (p) { p.multishot += 2; p.dmg *= 0.8; }, 2);

  DBR.UPGRADE_IDS = Object.keys(UP);

  function count(p, id) { var n = 0; for (var i = 0; i < p.upgrades.length; i++) if (p.upgrades[i] === id) n++; return n; }

  /** Poids des raretés selon la qualité du tirage : 0 normal, 1 mini-boss/trésor, 2 boss. */
  var WEIGHTS = [[62, 30, 8], [28, 52, 20], [8, 50, 42]];

  /** Tire n améliorations distinctes encore disponibles. */
  DBR.rollChoices = function (g, tier, n) {
    var p = g.player, w = WEIGHTS[tier || 0], out = [], guard = 0;
    n = n || 3;
    while (out.length < n && guard++ < 300) {
      var r = g.rng.next() * 100, rar = r < w[0] ? 0 : (r < w[0] + w[1] ? 1 : 2);
      var id = g.rng.pick(DBR.UPGRADE_IDS), u = UP[id];
      if (u.rar !== rar || out.indexOf(id) >= 0 || count(p, id) >= u.max) continue;
      out.push(id);
    }
    return out;
  };

  DBR.applyUpgrade = function (g, id) {
    var p = g.player;
    UP[id].apply(p);
    p.upgrades.push(id);
    DBR.emit(g, 'upgrade', p.x, p.y, { id: id });
  };

  /** Valide le choix i de l'écran de récompense et rouvre la porte. */
  DBR.chooseUpgrade = function (g, i) {
    if (g.phase !== 'reward' || !g.choice || !g.choice[i]) return false;
    DBR.applyUpgrade(g, g.choice[i]);
    g.choice = null; g.phase = 'open';
    return true;
  };

  /* ---------- Salles spéciales ---------- */
  /** Place les objets interactifs d'une salle soin / trésor / boutique. */
  DBR.setupSpecial = function (g, room, rng) {
    var cx = DBR.W / 2, cy = DBR.H / 2 - 20, i;
    if (room.kind === 'heal') g.props.push({ kind: 'senzu', x: cx, y: cy, used: false });
    else if (room.kind === 'treasure') g.props.push({ kind: 'chest', x: cx, y: cy, used: false });
    else if (room.kind === 'shop') {
      var ids = DBR.rollChoices(g, 1, 3);
      for (i = 0; i < ids.length; i++) g.props.push({ kind: 'shopItem', x: cx - 200 + i * 200, y: cy - 30, upg: ids[i], cost: DBR.RARITY[UP[ids[i]].rar].price + room.biome * 10, used: false });
      g.props.push({ kind: 'shopHeal', x: cx, y: cy + 110, cost: 30 + room.biome * 10, used: false });
    }
  };

  /** Interactions : Senzu et coffre au contact, achats avec la touche d'interaction (E). */
  DBR.stepProps = function (g, inp, dt) {
    var p = g.player, press = inp.interact && !p.prev.interact;
    g.nearProp = null;
    for (var i = 0; i < g.props.length; i++) {
      var o = g.props[i];
      if (o.used) continue;
      var d = U.dist(p.x, p.y, o.x, o.y);
      if (o.kind === 'senzu' && d < 26 && p.hp < p.maxHp) {
        var v = Math.round(p.maxHp * 0.5); p.hp = Math.min(p.maxHp, p.hp + v); o.used = true;
        DBR.emit(g, 'heal', o.x, o.y, { val: v });
      } else if (o.kind === 'chest' && d < 30) {
        o.used = true;
        for (var k = 0; k < 8; k++) DBR.dropPickup(g, o.x, o.y, 'zeni', 3);
        g.choice = DBR.rollChoices(g, 1); g.phase = 'reward';
        DBR.emit(g, 'chest', o.x, o.y);
        return;
      } else if ((o.kind === 'shopItem' || o.kind === 'shopHeal') && d < 44) {
        g.nearProp = o;
        if (!press) continue;
        if (p.zeni < o.cost) { DBR.emit(g, 'noZeni', o.x, o.y); continue; }
        p.zeni -= o.cost; o.used = true;
        if (o.kind === 'shopHeal') { var h = Math.round(p.maxHp * 0.4); p.hp = Math.min(p.maxHp, p.hp + h); DBR.emit(g, 'heal', o.x, o.y, { val: h }); }
        else { DBR.applyUpgrade(g, o.upg); DBR.emit(g, 'buy', o.x, o.y, { label: UP[o.upg].name }); }
      }
    }
  };
})();
