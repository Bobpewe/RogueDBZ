/*
 * Dragon Roguelike — fan game non commercial
 * Auteur : Charles GRATIAS
 * bosses.js : IA des mini-boss et boss. Un boss enchaîne des attaques composables
 * (toutes télégraphiées) choisies dans la liste de sa phase courante ; il change de phase
 * en franchissant des seuils de PV (def.phases[k].at), ce qui débloque de nouvelles attaques.
 */
(function () {
  'use strict';
  var DBR = (typeof window !== 'undefined') ? (window.DBR = window.DBR || {}) : (globalThis.DBR = globalThis.DBR || {});
  var U = DBR.U, W = DBR.W, H = DBR.H, WALL = DBR.WALL, TAU = Math.PI * 2;

  function dmg(e, k) { return e.def.dmg * e.dmgMul * (k || 1); }
  function aim(e, p) { return Math.atan2(p.y - e.y, p.x - e.x); }
  /** Vrai une fois par sous-étape : à t0, t0+dt, t0+2dt... (count fois). */
  function every(e, t0, interval, count) {
    if (e.n < count && e.at >= t0 + e.n * interval) { e.n++; return true; }
    return false;
  }
  function ring(g, e, n, off, speed) {
    for (var i = 0; i < n; i++) DBR.enemyShot(g, e, off + i * TAU / n, speed || e.def.bulletSpeed, dmg(e), 6);
    DBR.emit(g, 'eshoot', e.x, e.y);
  }

  /*
   * Attaques. Signature : (g, e, p, ph) -> true quand l'attaque est terminée.
   * e.at = temps écoulé dans l'attaque, e.n = compteur de sous-étapes, ph = numéro de phase.
   */
  var ATK = DBR.BOSS_ATK = {};

  /** Salves visées en éventail. */
  ATK.aimed = function (g, e, p, ph) {
    var volleys = 3 + ph, n = ph > 0 ? 5 : 3;
    e.tele = e.at < 0.4 ? 'cast' : null;
    if (every(e, 0.4, 0.3, volleys)) {
      var a = aim(e, p);
      for (var i = 0; i < n; i++) DBR.enemyShot(g, e, a + (i - (n - 1) / 2) * 0.2, e.def.bulletSpeed * 1.1, dmg(e), 6);
      DBR.emit(g, 'eshoot', e.x, e.y);
    }
    return e.at > 0.4 + volleys * 0.3 + 0.2;
  };

  /** Deux couronnes décalées. */
  ATK.ring = function (g, e, p, ph) {
    var n = 14 + ph * 4;
    e.tele = e.at < 0.5 ? 'cast' : null;
    if (every(e, 0.5, 0.45, 2 + (ph > 1 ? 1 : 0))) ring(g, e, n, e.n * Math.PI / n);
    return e.at > 1.6 + (ph > 1 ? 0.45 : 0);
  };

  /** Spirale de projectiles (deux bras à partir de la phase 2). */
  ATK.spiral = function (g, e, p, ph) {
    e.tele = e.at < 0.35 ? 'cast' : null;
    if (every(e, 0.35, 0.075, 28)) {
      var a = e.n * 0.44 + e.id;
      DBR.enemyShot(g, e, a, e.def.bulletSpeed * 0.9, dmg(e), 6);
      if (ph > 0) DBR.enemyShot(g, e, a + Math.PI, e.def.bulletSpeed * 0.9, dmg(e), 6);
      if (e.n % 4 === 0) DBR.emit(g, 'eshoot', e.x, e.y);
    }
    return e.at > 0.35 + 28 * 0.075 + 0.3;
  };

  /** Charges en ligne droite : visée télégraphiée puis ruée (répétée selon la phase). */
  ATK.charge = function (g, e, p, ph) {
    var reps = Math.min(3, 1 + ph), wind = 0.6, dash = 0.42, cyc = wind + dash + 0.15;
    var k = Math.floor(e.at / cyc), t = e.at - k * cyc;
    if (k >= reps) { e.tele = null; return true; }
    if (t < wind) {
      if (t < wind - 0.15) e.ang = aim(e, p);
      e.tele = 'charge'; e.t = wind - t; e.t0 = wind; e.hitP = false;
    } else if (t < wind + dash) {
      if (e.tele === 'charge') DBR.emit(g, 'charge', e.x, e.y);
      e.tele = 'dash';
      e.x += Math.cos(e.ang) * 640 * DBR.DT; e.y += Math.sin(e.ang) * 640 * DBR.DT;
      if (!e.hitP && U.dist(e.x, e.y, p.x, p.y) < e.r + p.r && p.dashT <= 0) e.hitP = DBR.hurtPlayer(g, dmg(e, 1.3), e.x, e.y);
    } else e.tele = null;
    return false;
  };

  /** Rayon(s) télégraphié(s) ; éventail de 3 à partir de la phase 2. */
  ATK.beam = function (g, e, p, ph) {
    e.tele = e.at < 0.85 ? 'cast' : null;
    if (every(e, 0, 1, 1)) {
      var a = aim(e, p), n = ph > 0 ? 3 : 1;
      for (var i = 0; i < n; i++) DBR.spawnBeam(g, { x: e.x, y: e.y, ang: a + (i - (n - 1) / 2) * 0.55, w: 28, warn: 0.85, life: 0.5, tick: 0.1, dmg: dmg(e, 1.3), owner: 'e' });
    }
    return e.at > 1.6;
  };

  /** Zones d'impact successives sous les pieds du joueur. */
  ATK.slam = function (g, e, p, ph) {
    var n = 3 + ph;
    e.tele = 'cast';
    if (every(e, 0.2, 0.4, n)) DBR.spawnZone(g, p.x, p.y, 62, 0.75, dmg(e, 1.3), 'e');
    if (e.at > 0.2 + n * 0.4 + 0.5) { e.tele = null; return true; }
    return false;
  };

  /** Pluie de zones aléatoires (une sur deux près du joueur). */
  ATK.rain = function (g, e, p, ph) {
    var n = 7 + ph * 3;
    e.tele = e.at < 0.5 ? 'cast' : null;
    if (every(e, 0.3, 0.12, n)) {
      var near = e.n % 2 === 0;
      var x = near ? p.x + g.rng.range(-110, 110) : g.rng.range(WALL + 50, W - WALL - 50);
      var y = near ? p.y + g.rng.range(-110, 110) : g.rng.range(WALL + 50, H - WALL - 50);
      DBR.spawnZone(g, x, y, 54, 0.9, dmg(e, 1.2), 'e');
    }
    return e.at > 0.3 + n * 0.12 + 0.6;
  };

  /** Appel de sbires. */
  ATK.summon = function (g, e, p, ph) {
    e.tele = e.at < 0.6 ? 'cast' : null;
    if (every(e, 0.6, 1, 1) && g.enemies.length < 8) {
      for (var i = 0; i < 2 + Math.min(1, ph); i++) DBR.spawnEnemy(g, e.def.minion, e.x + g.rng.range(-80, 80), e.y + g.rng.range(-80, 80), { parent: e.id, spawnT: 0.6 });
      DBR.emit(g, 'summon', e.x, e.y);
    }
    return e.at > 1;
  };

  /** Téléportation loin du joueur, suivie d'une couronne. */
  ATK.teleport = function (g, e, p, ph) {
    if (every(e, 0.3, 1, 1)) {
      DBR.emit(g, 'teleport', e.x, e.y);
      var x, y, tries = 0;
      do { x = g.rng.range(WALL + 80, W - WALL - 80); y = g.rng.range(WALL + 70, H - WALL - 70); }
      while (U.dist(x, y, p.x, p.y) < 220 && tries++ < 20);
      e.x = x; e.y = y; e.invuln = 0.25;
      DBR.emit(g, 'teleport', e.x, e.y);
    }
    if (e.n === 1 && e.at > 0.65) { e.n = 2; ring(g, e, 10 + ph * 2, g.rng.range(0, TAU)); }
    return e.at > 1;
  };

  /** IA de boss : se replace, puis lance l'attaque suivante de sa phase. */
  DBR.AI.boss = function (g, e, p, v, dt) {
    var d = e.def, phs = d.phases;
    // Changement de phase : bref répit invulnérable, l'écran est nettoyé
    if (e.phase + 1 < phs.length && e.hp / e.maxHp <= phs[e.phase + 1].at) {
      e.phase++; e.invuln = 1.3; e.state = 'recover'; e.t = 1.3; e.atk = null; e.tele = null; e.order = null;
      DBR.clearEnemyBullets(g);
      DBR.emit(g, 'bossPhase', e.x, e.y, { phase: e.phase });
    }
    var P = phs[e.phase];
    if (e.state === 'move') {
      var sp = d.speed * (P.speed || 1), keep = 230;
      if (v.d > keep + 50) { e.x += v.x * sp * dt; e.y += v.y * sp * dt; }
      else if (v.d < keep - 80) { e.x -= v.x * sp * dt; e.y -= v.y * sp * dt; }
      else { e.x += -v.y * e.strafe * sp * 0.7 * dt; e.y += v.x * e.strafe * sp * 0.7 * dt; }
      if (g.rng.chance(0.008)) e.strafe = -e.strafe;
      if (e.cd <= 0) {
        // Les attaques de la phase sont jouées dans un ordre mélangé, sans répétition immédiate
        if (!e.order || !e.order.length) e.order = g.rng.shuffle(P.attacks.slice());
        e.atk = e.order.pop(); e.state = 'attack'; e.at = 0; e.n = 0;
      }
    } else if (e.state === 'attack') {
      e.at += dt;
      if (ATK[e.atk](g, e, p, e.phase)) { e.state = 'move'; e.cd = P.rest || 1.1; e.atk = null; e.tele = null; }
    } else if ((e.t -= dt) <= 0) { e.state = 'move'; e.cd = 0.4; }
  };
})();
