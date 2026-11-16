/*
 * Dragon Roguelike — fan game non commercial
 * Auteur : Charles GRATIAS
 * enemies.js : apparition et IA des ennemis. Chaque comportement suit le même schéma lisible :
 *   move -> windup (télégraphe visible) -> attaque -> recover.
 * Comportements : melee, ranged, charger, summoner, bomber, turret (+ boss dans bosses.js).
 */
(function () {
  'use strict';
  var DBR = (typeof window !== 'undefined') ? (window.DBR = window.DBR || {}) : (globalThis.DBR = globalThis.DBR || {});
  var U = DBR.U, W = DBR.W, H = DBR.H, WALL = DBR.WALL;

  /** Fait apparaître un ennemi (avec un court télégraphe d'apparition). */
  DBR.spawnEnemy = function (g, kind, x, y, o) {
    var def = DBR.ENEMIES[kind]; o = o || {};
    var hpMul = (g.room ? g.room.hpMul : 1), dmgMul = (g.room ? g.room.dmgMul : 1);
    g.nextId = (g.nextId || 0) + 1;
    var e = {
      id: g.nextId, kind: kind, def: def, x: x, y: y, r: def.r, hp: Math.round(def.hp * hpMul), maxHp: Math.round(def.hp * hpMul),
      dmgMul: dmgMul, state: 'move', t: 0, cd: g.rng.range(0.4, 1.4), kx: 0, ky: 0, flash: 0, face: 1, ang: 0,
      spawnT: o.spawnT === undefined ? 0.8 : o.spawnT, strafe: g.rng.chance(0.5) ? 1 : -1, parent: o.parent || 0, dead: false, invuln: 0,
      phase: 0, atk: null, at: 0, n: 0
    };
    DBR.collideWorld(g, e);
    g.enemies.push(e);
    return e;
  };

  /** Tir ennemi standard. */
  DBR.enemyShot = function (g, e, ang, speed, dmg, r) {
    return DBR.spawnBullet(g, { x: e.x + Math.cos(ang) * e.r * 0.6, y: e.y + Math.sin(ang) * e.r * 0.6, ang: ang, speed: speed, r: r || 6, dmg: dmg, owner: 'e', life: 6 });
  };

  function vec(e, p) { var dx = p.x - e.x, dy = p.y - e.y, d = Math.sqrt(dx * dx + dy * dy) || 1; return { x: dx / d, y: dy / d, d: d }; }
  function move(e, dx, dy, sp, dt) { e.x += dx * sp * dt; e.y += dy * sp * dt; }
  function windup(g, e, t) { e.state = 'windup'; e.t = t; e.t0 = t; DBR.emit(g, 'windup', e.x, e.y); }

  var AI = DBR.AI = {};

  /** Mêlée : fonce, arme son coup (windup), frappe si le joueur est encore à portée. */
  AI.melee = function (g, e, p, v, dt) {
    var d = e.def;
    if (e.state === 'move') {
      move(e, v.x, v.y, d.speed, dt);
      if (v.d < e.r + p.r + d.reach * 0.6 && e.cd <= 0) windup(g, e, d.windup || 0.38);
    } else if (e.state === 'windup') {
      if ((e.t -= dt) <= 0) {
        if (v.d < e.r + p.r + d.reach) DBR.hurtPlayer(g, d.dmg * e.dmgMul, e.x, e.y);
        DBR.emit(g, 'swing', e.x + v.x * e.r, e.y + v.y * e.r);
        e.state = 'recover'; e.t = 0.35; e.cd = d.cd;
      }
    } else if ((e.t -= dt) <= 0) e.state = 'move';
  };

  /** Distance : garde ses distances, tourne autour du joueur, tire après un télégraphe. */
  AI.ranged = function (g, e, p, v, dt) {
    var d = e.def;
    if (e.state === 'move') {
      if (v.d > d.keep + 40) move(e, v.x, v.y, d.speed, dt);
      else if (v.d < d.keep - 70) move(e, -v.x, -v.y, d.speed, dt);
      else move(e, -v.y * e.strafe, v.x * e.strafe, d.speed * 0.7, dt);
      if (g.rng.chance(0.004)) e.strafe = -e.strafe;
      if (e.cd <= 0 && v.d < 560) windup(g, e, d.windup || 0.45);
    } else if (e.state === 'windup') {
      if ((e.t -= dt) <= 0) {
        var a = Math.atan2(p.y - e.y, p.x - e.x), n = d.shots || 1;
        for (var i = 0; i < n; i++) DBR.enemyShot(g, e, a + (i - (n - 1) / 2) * (d.spread || 0.25), d.bulletSpeed, d.dmg * e.dmgMul);
        DBR.emit(g, 'eshoot', e.x, e.y);
        e.state = 'move'; e.cd = d.cd * g.rng.range(0.8, 1.25);
      }
    }
  };

  /** Chargeur : vise (ligne télégraphiée), puis fonce en ligne droite. */
  AI.charger = function (g, e, p, v, dt) {
    var d = e.def;
    if (e.state === 'move') {
      move(e, v.x, v.y, d.speed, dt);
      if (v.d < 360 && e.cd <= 0) { windup(g, e, d.windup || 0.65); e.ang = Math.atan2(v.y, v.x); }
    } else if (e.state === 'windup') {
      if (e.t > 0.2) e.ang = Math.atan2(v.y, v.x);     // la direction se verrouille 0,2 s avant la charge
      if ((e.t -= dt) <= 0) { e.state = 'dash'; e.t = 0.55; e.hitP = false; DBR.emit(g, 'charge', e.x, e.y); }
    } else if (e.state === 'dash') {
      var ox = e.x + Math.cos(e.ang) * d.dashSpeed * dt, oy = e.y + Math.sin(e.ang) * d.dashSpeed * dt;
      e.x = ox; e.y = oy;
      if (!e.hitP && v.d < e.r + p.r + 2 && p.dashT <= 0) e.hitP = DBR.hurtPlayer(g, d.dmg * e.dmgMul, e.x, e.y);
      var m = WALL + e.r;
      if ((e.t -= dt) <= 0 || ox < m || ox > W - m || oy < m || oy > H - m) { e.state = 'recover'; e.t = 0.7; e.cd = d.cd; }
    } else if ((e.t -= dt) <= 0) e.state = 'move';
  };

  /** Invocateur : fuit le joueur et appelle régulièrement des sbires. */
  AI.summoner = function (g, e, p, v, dt) {
    var d = e.def, i, n = 0;
    if (e.state === 'move') {
      if (v.d < 280) move(e, -v.x, -v.y, d.speed, dt);
      else move(e, -v.y * e.strafe, v.x * e.strafe, d.speed * 0.5, dt);
      if (g.rng.chance(0.006)) e.strafe = -e.strafe;
      if (e.cd <= 0) {
        for (i = 0; i < g.enemies.length; i++) if (g.enemies[i].parent === e.id) n++;
        if (n < 4 && g.enemies.length < 14) windup(g, e, 0.8); else e.cd = 1;
      }
    } else if (e.state === 'windup') {
      if ((e.t -= dt) <= 0) {
        for (i = 0; i < (d.count || 2); i++) DBR.spawnEnemy(g, d.minion, e.x + g.rng.range(-50, 50), e.y + g.rng.range(-50, 50), { parent: e.id, spawnT: 0.5 });
        DBR.emit(g, 'summon', e.x, e.y);
        e.state = 'move'; e.cd = d.cd;
      }
    }
  };

  /** Kamikaze : court vers le joueur, clignote puis explose. */
  AI.bomber = function (g, e, p, v, dt) {
    var d = e.def;
    if (e.state === 'move') {
      move(e, v.x, v.y, d.speed, dt);
      if (v.d < 50) windup(g, e, 0.6);
    } else if ((e.t -= dt) <= 0) {
      DBR.explode(g, e.x, e.y, 70, d.dmg * e.dmgMul, 'e');
      DBR.killEnemy(g, e, true);
    }
  };

  /** Tourelle : avance lentement et tire en couronne. */
  AI.turret = function (g, e, p, v, dt) {
    var d = e.def;
    if (e.state === 'move') {
      if (v.d > 200) move(e, v.x, v.y, d.speed, dt);
      if (e.cd <= 0) windup(g, e, 0.6);
    } else if ((e.t -= dt) <= 0) {
      var n = d.shots || 8, off = g.rng.range(0, 6.283);
      for (var i = 0; i < n; i++) DBR.enemyShot(g, e, off + i * 6.283 / n, d.bulletSpeed, d.dmg * e.dmgMul);
      DBR.emit(g, 'eshoot', e.x, e.y);
      e.state = 'move'; e.cd = d.cd;
    }
  };

  /** Pas de tous les ennemis : IA, recul, séparation mutuelle, collisions. */
  DBR.stepEnemies = function (g, dt) {
    var p = g.player, i, j, e, o;
    for (i = 0; i < g.enemies.length; i++) {
      e = g.enemies[i];
      if (e.dead) continue;
      if (e.spawnT > 0) { e.spawnT -= dt; continue; }
      e.flash -= dt; e.cd -= dt; e.invuln -= dt;
      e.x += e.kx * dt; e.y += e.ky * dt; e.kx *= 0.82; e.ky *= 0.82;
      var v = vec(e, p);
      if (e.state !== 'dash') e.face = p.x >= e.x ? 1 : -1;
      (AI[e.def.ai] || AI.melee)(g, e, p, v, dt);
      if (e.dead) continue;
      if (e.state !== 'dash') {
        for (j = 0; j < g.enemies.length; j++) {     // séparation : évite l'empilement
          o = g.enemies[j];
          if (o === e || o.dead || o.spawnT > 0) continue;
          var dx = e.x - o.x, dy = e.y - o.y, d = Math.sqrt(dx * dx + dy * dy), min = e.r + o.r;
          if (d < min && d > 0.01) { var push = (min - d) * (o.def.boss ? 1 : 0.5); e.x += dx / d * push; e.y += dy / d * push; }
        }
      }
      DBR.collideWorld(g, e);
    }
  };
})();
