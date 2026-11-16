/*
 * Dragon Roguelike — fan game non commercial
 * Auteur : Charles GRATIAS
 * combat.js : tirs de Ki, dash, attaques spéciales, transformation, dégâts,
 * projectiles, rayons, zones télégraphiées et butin. Simulation pure (pas de DOM).
 */
(function () {
  'use strict';
  var DBR = (typeof window !== 'undefined') ? (window.DBR = window.DBR || {}) : (globalThis.DBR = globalThis.DBR || {});
  var U = DBR.U, W = DBR.W, H = DBR.H, WALL = DBR.WALL;

  /* ---------- Statistiques effectives du joueur ---------- */
  DBR.playerSpeed = function (g, p) {
    var s = p.speed;
    if (p.ultraT > 0) s *= 1.2;
    if (p.specialT > 0) s *= 0.35;        // on est presque immobile pendant un spécial
    return s;
  };
  DBR.playerDamage = function (g, p) {
    var d = p.dmg;
    if (p.ultraT > 0) d *= p.ultraDmg;
    if (p.rage > 0 && p.hp < p.maxHp * 0.4) d *= 1 + p.rage;
    if (p.counterT > 0) d *= 1 + p.counter;
    return d;
  };

  /* ---------- Dégâts ---------- */
  /** Blesse le joueur. Retourne true si le coup a porté. */
  DBR.hurtPlayer = function (g, dmg, sx, sy) {
    var p = g.player;
    if (g.over || p.invuln > 0) return false;
    dmg = Math.max(1, Math.round(dmg * p.dmgTaken * g.difficulty));
    p.hp -= dmg; p.invuln = 0.7; p.flash = 0.15;
    g.stats.dmgTaken += dmg;
    if (p.ultraT <= 0) p.ultra = Math.min(100, p.ultra + dmg * 0.4 * p.ultraGain);
    DBR.emit(g, 'hurt', p.x, p.y, { dmg: dmg });
    if (p.hp <= 0) {
      if (p.revive > 0) {                  // Senzu de secours : on repart à 50 %
        p.revive--; p.hp = Math.round(p.maxHp * 0.5); p.invuln = 2;
        clearEnemyBullets(g);
        DBR.emit(g, 'revive', p.x, p.y);
      } else {
        p.hp = 0; g.phase = 'dead'; g.over = true;
        DBR.emit(g, 'death', p.x, p.y);
      }
    }
    return true;
  };

  function clearEnemyBullets(g) {
    for (var i = 0; i < g.bullets.length; i++) if (g.bullets[i].owner === 'e') { g.bullets[i].life = 0; DBR.emit(g, 'spark', g.bullets[i].x, g.bullets[i].y); }
    for (i = 0; i < g.zones.length; i++) g.zones[i].dead = true;
    for (i = 0; i < g.beams.length; i++) if (g.beams[i].owner === 'e') g.beams[i].life = 0, g.beams[i].warn = 0;
  }
  DBR.clearEnemyBullets = clearEnemyBullets;

  /** Blesse un ennemi (dégâts du joueur). */
  DBR.hurtEnemy = function (g, e, dmg, crit) {
    if (e.dead || e.spawnT > 0 || e.invuln > 0) return;
    var p = g.player;
    dmg = Math.max(1, Math.round(dmg));
    e.hp -= dmg; e.flash = 0.1;
    g.stats.dmgDealt += dmg;
    if (p.ultraT <= 0) p.ultra = Math.min(100, p.ultra + dmg * 0.03 * p.ultraGain);
    DBR.emit(g, 'hit', e.x, e.y - e.r, { dmg: dmg, crit: !!crit });
    if (e.hp <= 0) DBR.killEnemy(g, e, true);
  };

  /** Tue un ennemi ; loot = true pour lâcher du butin. */
  DBR.killEnemy = function (g, e, loot) {
    if (e.dead) return;
    var p = g.player, def = e.def, i;
    e.dead = true; e.hp = 0;
    DBR.emit(g, 'kill', e.x, e.y, { r: e.r, boss: def.boss || 0, color: def.color });
    if (!loot) return;
    g.stats.kills++;
    p.ki = Math.min(p.kiMax, p.ki + 3);
    if (p.lifesteal > 0) p.hp = Math.min(p.maxHp, p.hp + p.lifesteal);
    var total = g.rng.int(def.zeni[0], def.zeni[1]), unit = def.boss ? 10 : 2;
    while (total > 0) {
      var v = Math.min(total, unit); total -= v;
      DBR.dropPickup(g, e.x, e.y, 'zeni', v);
    }
    if (!def.boss && g.rng.chance(0.04)) DBR.dropPickup(g, e.x, e.y, 'heal', 8);
    if (def.boss) {                        // la mort d'un (mini-)boss balaie ses sbires et ses tirs
      g.stats.bosses++;
      for (i = 0; i < g.enemies.length; i++) if (g.enemies[i] !== e && !g.enemies[i].def.boss) DBR.killEnemy(g, g.enemies[i], false);
      clearEnemyBullets(g);
    }
  };

  DBR.dropPickup = function (g, x, y, kind, val) {
    var a = g.rng.range(0, 6.283), s = g.rng.range(60, 200);
    g.pickups.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, kind: kind, val: val, t: 0 });
  };

  /** Explosion instantanée (zone circulaire). owner = 'p' ou 'e'. */
  DBR.explode = function (g, x, y, r, dmg, owner) {
    DBR.emit(g, 'explode', x, y, { r: r, owner: owner });
    if (owner === 'p') {
      for (var i = 0; i < g.enemies.length; i++) {
        var e = g.enemies[i];
        if (U.dist(x, y, e.x, e.y) < r + e.r) DBR.hurtEnemy(g, e, dmg, false);
      }
    } else if (U.dist(x, y, g.player.x, g.player.y) < r + g.player.r - 3) DBR.hurtPlayer(g, dmg, x, y);
  };

  /* ---------- Projectiles, rayons, zones ---------- */
  DBR.spawnBullet = function (g, o) {
    if (g.bullets.length > 500) return null;
    var b = {
      x: o.x, y: o.y, vx: Math.cos(o.ang) * o.speed, vy: Math.sin(o.ang) * o.speed, r: o.r || 5, dmg: o.dmg, owner: o.owner,
      life: o.life || 3, pierce: o.pierce || 0, homing: o.homing || 0, bounce: o.bounce || 0,
      explode: o.explode || 0, explodeDmg: o.explodeDmg || 0, crit: !!o.crit, big: !!o.big, color: o.color || 0, hit: null
    };
    g.bullets.push(b);
    return b;
  };

  /** Rayon. Avec warn > 0 il est d'abord télégraphié (inoffensif). */
  DBR.spawnBeam = function (g, o) {
    var b = { x: o.x, y: o.y, ang: o.ang, w: o.w || 20, warn: o.warn || 0, warn0: o.warn || 0, life: o.life || 0.5, life0: o.life || 0.5, dmg: o.dmg, owner: o.owner, tick: o.tick || 0, acc: 0, follow: o.follow || null, once: !o.tick, done: false, len: 0, color: o.color || 0 };
    b.len = rayLen(b.x, b.y, b.ang);
    g.beams.push(b);
    return b;
  };

  /** Zone d'impact télégraphiée : explose à la fin du compte à rebours. */
  DBR.spawnZone = function (g, x, y, r, warn, dmg, owner) {
    g.zones.push({ x: x, y: y, r: r, warn: warn, warn0: warn, dmg: dmg, owner: owner || 'e', dead: false });
  };

  /** Longueur d'un rayon jusqu'au mur. */
  function rayLen(x, y, a) {
    var c = Math.cos(a), s = Math.sin(a), t = 1e9;
    if (c > 1e-6) t = Math.min(t, (W - WALL - x) / c); else if (c < -1e-6) t = Math.min(t, (WALL - x) / c);
    if (s > 1e-6) t = Math.min(t, (H - WALL - y) / s); else if (s < -1e-6) t = Math.min(t, (WALL - y) / s);
    return Math.max(0, t === 1e9 ? 0 : t);
  }

  function nearestEnemy(g, x, y, max) {
    var best = null, bd = max;
    for (var i = 0; i < g.enemies.length; i++) {
      var e = g.enemies[i];
      if (e.dead || e.spawnT > 0) continue;
      var d = U.dist(x, y, e.x, e.y);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }
  DBR.nearestEnemy = nearestEnemy;

  function stepBullets(g, dt) {
    var p = g.player, i, j, b, e;
    for (i = 0; i < g.bullets.length; i++) {
      b = g.bullets[i];
      if (b.life <= 0) continue;
      b.life -= dt;
      if (b.homing > 0) {                  // tête chercheuse : on tourne vers la cible la plus proche
        e = nearestEnemy(g, b.x, b.y, 240);
        if (e) {
          var sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy), a = Math.atan2(b.vy, b.vx);
          a += U.clamp(U.angDiff(a, Math.atan2(e.y - b.y, e.x - b.x)), -b.homing * dt, b.homing * dt);
          b.vx = Math.cos(a) * sp; b.vy = Math.sin(a) * sp;
        }
      }
      b.x += b.vx * dt; b.y += b.vy * dt;
      var hitWall = false;
      if (b.x < WALL + b.r || b.x > W - WALL - b.r) { if (b.bounce > 0) { b.vx = -b.vx; b.x = U.clamp(b.x, WALL + b.r, W - WALL - b.r); b.bounce--; } else hitWall = true; }
      if (b.y < WALL + b.r || b.y > H - WALL - b.r) { if (b.bounce > 0) { b.vy = -b.vy; b.y = U.clamp(b.y, WALL + b.r, H - WALL - b.r); b.bounce--; } else hitWall = true; }
      for (j = 0; j < g.obstacles.length && !hitWall; j++) {
        if (U.dist(b.x, b.y, g.obstacles[j].x, g.obstacles[j].y) < g.obstacles[j].r + b.r - 2) hitWall = true;
      }
      if (hitWall) { endBullet(g, b); continue; }
      if (b.owner === 'p') {
        for (j = 0; j < g.enemies.length; j++) {
          e = g.enemies[j];
          if (e.dead || e.spawnT > 0) continue;
          if (U.dist(b.x, b.y, e.x, e.y) < b.r + e.r) {
            if (b.hit && b.hit.indexOf(e.id) >= 0) continue;
            if (!e.def.boss) { e.kx += b.vx * 0.12; e.ky += b.vy * 0.12; }
            DBR.hurtEnemy(g, e, b.dmg, b.crit);
            if (b.pierce > 0 && !b.big) { b.pierce--; (b.hit = b.hit || []).push(e.id); if (b.explode) DBR.explode(g, b.x, b.y, b.explode, b.explodeDmg, 'p'); }
            else { endBullet(g, b); break; }
          }
        }
      } else if (p.dashT <= 0 && U.dist(b.x, b.y, p.x, p.y) < b.r + p.r - 3) {
        if (DBR.hurtPlayer(g, b.dmg, b.x, b.y)) endBullet(g, b);
      }
      if (b.life <= 0 && b.big) endBullet(g, b);   // un gros projectile explose en fin de course
    }
    for (i = g.bullets.length - 1; i >= 0; i--) if (g.bullets[i].life <= 0) g.bullets.splice(i, 1);
  }

  function endBullet(g, b) {
    if (b.dead) return;
    b.dead = true; b.life = 0;
    if (b.explode) DBR.explode(g, b.x, b.y, b.explode, b.explodeDmg, b.owner);
    else DBR.emit(g, 'spark', b.x, b.y, { owner: b.owner });
  }

  function beamDamage(g, b) {
    var ex = b.x + Math.cos(b.ang) * b.len, ey = b.y + Math.sin(b.ang) * b.len, p = g.player;
    if (b.owner === 'p') {
      for (var i = 0; i < g.enemies.length; i++) {
        var e = g.enemies[i];
        if (!e.dead && U.segDist(e.x, e.y, b.x, b.y, ex, ey) < b.w / 2 + e.r) DBR.hurtEnemy(g, e, b.dmg, false);
      }
    } else if (p.dashT <= 0 && U.segDist(p.x, p.y, b.x, b.y, ex, ey) < b.w / 2 + p.r - 4) DBR.hurtPlayer(g, b.dmg, b.x, b.y);
  }

  function stepBeams(g, dt) {
    for (var i = g.beams.length - 1; i >= 0; i--) {
      var b = g.beams[i];
      if (b.follow) {                      // le rayon reste accroché à son lanceur
        if (b.follow.dead) { g.beams.splice(i, 1); continue; }
        b.x = b.follow.x; b.y = b.follow.y;
        if (b.follow === g.player) b.ang = g.player.aim;
        b.x += Math.cos(b.ang) * 14; b.y += Math.sin(b.ang) * 14;
      }
      b.len = rayLen(b.x, b.y, b.ang);
      if (b.warn > 0) {
        b.warn -= dt;
        if (b.warn <= 0) DBR.emit(g, 'beam', b.x, b.y, { owner: b.owner });
        continue;
      }
      if (b.once) { if (!b.done) { b.done = true; beamDamage(g, b); } }
      else { b.acc += dt; while (b.acc >= b.tick) { b.acc -= b.tick; beamDamage(g, b); } }
      b.life -= dt;
      if (b.life <= 0) g.beams.splice(i, 1);
    }
  }

  function stepZones(g, dt) {
    for (var i = g.zones.length - 1; i >= 0; i--) {
      var z = g.zones[i];
      if (!z.dead) { z.warn -= dt; if (z.warn <= 0) { z.dead = true; DBR.explode(g, z.x, z.y, z.r, z.dmg, z.owner); } }
      if (z.dead) g.zones.splice(i, 1);
    }
  }

  function stepPickups(g, dt) {
    var p = g.player;
    for (var i = g.pickups.length - 1; i >= 0; i--) {
      var k = g.pickups[i], d = U.dist(k.x, k.y, p.x, p.y);
      k.t += dt;
      // Aimantation : de près, ou partout une fois la salle nettoyée
      if (k.t > 0.3 && (d < 100 || g.phase !== 'combat')) {
        var s = 520 / (d || 1);
        k.vx = (p.x - k.x) * s; k.vy = (p.y - k.y) * s;
      } else { k.vx *= 0.9; k.vy *= 0.9; }
      k.x = U.clamp(k.x + k.vx * dt, WALL + 6, W - WALL - 6);
      k.y = U.clamp(k.y + k.vy * dt, WALL + 6, H - WALL - 6);
      if (d < p.r + 10 && k.t > 0.3) {
        if (k.kind === 'zeni') { var v = Math.max(1, Math.round(k.val * p.zeniMul)); p.zeni += v; g.stats.zeni += v; }
        else if (k.kind === 'heal') p.hp = Math.min(p.maxHp, p.hp + k.val);
        DBR.emit(g, 'pickup', k.x, k.y, { kind: k.kind });
        g.pickups.splice(i, 1);
      }
    }
  }

  /* ---------- Actions du joueur ---------- */
  function fire(g, p) {
    var n = p.multishot, base = DBR.playerDamage(g, p);
    var spread = Math.min(0.13, 0.4 / Math.max(1, n - 1));   // l'éventail total reste serré, même avec beaucoup de projectiles
    for (var i = 0; i < n; i++) {
      var crit = p.crit > 0 && g.rng.chance(p.crit);
      DBR.spawnBullet(g, {
        x: p.x + Math.cos(p.aim) * 12, y: p.y + Math.sin(p.aim) * 12, ang: p.aim + (i - (n - 1) / 2) * spread,
        speed: p.bulletSpeed, r: 5, dmg: base * (crit ? 2 : 1), crit: crit, owner: 'p', life: p.range,
        pierce: p.pierce, homing: p.homing, bounce: p.bounce, explode: p.explode, explodeDmg: base * 0.5
      });
    }
    p.fireCd = 1 / (p.fireRate * (p.ultraT > 0 ? 1.3 : 1));
    DBR.emit(g, 'shoot', p.x, p.y, { ang: p.aim });
  }

  /** Attaque spéciale propre à chaque personnage. */
  function special(g, p) {
    var c = DBR.CHARS[p.char], d = DBR.playerDamage(g, p) * p.specialMul;
    p.ki -= p.specialCost;
    if (c.special === 'kamehameha') {       // rayon continu orientable
      p.specialT = 0.9;
      DBR.spawnBeam(g, { x: p.x, y: p.y, ang: p.aim, w: 26, warn: 0.12, life: 0.78, tick: 0.05, dmg: d * 0.8, owner: 'p', follow: p, color: 1 });
    } else if (c.special === 'bigbang') {   // grosse sphère explosive
      p.specialT = 0.25;
      DBR.spawnBullet(g, { x: p.x, y: p.y, ang: p.aim, speed: 430, r: 13, dmg: d * 2.5, owner: 'p', life: 1.4, big: true, explode: 95, explodeDmg: d * 5.5, color: 2 });
    } else {                                // makankosappo : rayon perforant instantané
      p.specialT = 0.5;
      DBR.spawnBeam(g, { x: p.x, y: p.y, ang: p.aim, w: 14, warn: 0.3, life: 0.2, dmg: d * 11, owner: 'p', follow: p, color: 3 });
    }
    DBR.emit(g, 'special', p.x, p.y, { kind: c.special });
  }

  /** Pas de combat complet, appelé par DBR.step. */
  DBR.stepCombat = function (g, p, inp, mv, dt) {
    var i;
    p.fireCd -= dt; p.dashCd -= dt; p.invuln -= dt; p.flash -= dt; p.counterT -= dt; p.specialT -= dt;
    var ultra = p.ultraT > 0;
    p.ki = Math.min(p.kiMax, p.ki + p.kiRegen * (ultra ? 2.5 : 1) * dt);
    if (p.regen > 0 || (ultra && p.char === 'piccolo')) p.hp = Math.min(p.maxHp, p.hp + (p.regen + (ultra && p.char === 'piccolo' ? 5 : 0)) * dt);
    if (ultra) { p.ultraT -= dt; if (p.ultraT <= 0) DBR.emit(g, 'ultraEnd', p.x, p.y); }

    // Dash : court, rapide, invulnérable
    if (p.dashT > 0) p.dashT -= dt;
    else if (inp.dash && !p.prev.dash && p.dashCd <= 0) {
      if (mv.l > 0.1) { p.dashX = mv.mx / mv.l; p.dashY = mv.my / mv.l; } else { p.dashX = Math.cos(p.aim); p.dashY = Math.sin(p.aim); }
      p.dashT = 0.17; p.dashCd = p.dashMax; p.invuln = Math.max(p.invuln, 0.3);
      if (p.afterimage > 0) DBR.spawnZone(g, p.x, p.y, 64, 0.35, DBR.playerDamage(g, p) * p.afterimage, 'p');
      if (p.counter > 0) p.counterT = 2.5;
      DBR.emit(g, 'dash', p.x, p.y);
    }
    if (inp.fire && p.fireCd <= 0 && p.specialT <= 0) fire(g, p);
    if (inp.special && !p.prev.special && p.ki >= p.specialCost && p.specialT <= 0) special(g, p);
    if (inp.ultra && !p.prev.ultra && p.ultra >= 100 && p.ultraT <= 0) {
      p.ultra = 0; p.ultraT = p.ultraDur; p.invuln = Math.max(p.invuln, 1);
      clearEnemyBullets(g);
      DBR.emit(g, 'ultra', p.x, p.y);
    }
    if (p.aura > 0 && g.frame % 15 === 0) {  // aura brûlante : dégâts de proximité 4 fois par seconde
      for (i = 0; i < g.enemies.length; i++) if (U.dist(p.x, p.y, g.enemies[i].x, g.enemies[i].y) < 78 + g.enemies[i].r) DBR.hurtEnemy(g, g.enemies[i], DBR.playerDamage(g, p) * p.aura, false);
    }
    if (DBR.stepEnemies) DBR.stepEnemies(g, dt);
    stepBullets(g, dt);
    stepBeams(g, dt);
    stepZones(g, dt);
    stepPickups(g, dt);
    for (i = g.enemies.length - 1; i >= 0; i--) if (g.enemies[i].dead) g.enemies.splice(i, 1);
  };
})();
