/*
 * Dragon Roguelike — fan game non commercial
 * Auteur : Charles GRATIAS
 * fx.js : dessin des entités de combat et « game feel » : particules, nombres de dégâts,
 * secousses d'écran, hit-stop, flashs. Traduit les événements de la simulation en effets.
 */
(function () {
  'use strict';
  var DBR = window.DBR, R = DBR.Render, W = DBR.W, H = DBR.H;
  var TAU = Math.PI * 2;

  function ctx() { return R.ctx; }

  /* ---------- Particules et textes flottants ---------- */
  function part(x, y, vx, vy, life, color, size, grav) {
    if (R.parts.length < 700) R.parts.push({ x: x, y: y, vx: vx, vy: vy, life: life, max: life, color: color, size: size || 3, grav: grav || 0 });
  }
  function burst(x, y, n, color, speed, life, size) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * TAU, s = speed * (0.3 + Math.random() * 0.7);
      part(x, y, Math.cos(a) * s, Math.sin(a) * s, life * (0.5 + Math.random() * 0.5), color, size);
    }
  }
  function text(x, y, txt, color, size) { R.texts.push({ x: x, y: y, txt: txt, color: color, size: size || 12, life: 0.7 }); }
  R.burst = burst; R.text = text;
  R.rings = [];
  function ring(x, y, r, color) { R.rings.push({ x: x, y: y, r: r, life: 0.3, color: color }); }

  /** Lit les événements publiés par la simulation et déclenche effets + sons. */
  R.consume = function (g, app) {
    var A = DBR.Audio, p = g.player;
    for (var i = 0; i < g.events.length; i++) {
      var e = g.events[i];
      switch (e.t) {
        case 'shoot': burst(e.x + Math.cos(e.ang) * 14, e.y + Math.sin(e.ang) * 14, 2, '#fff3a0', 60, 0.15, 2); break;
        case 'hit':
          burst(e.x, e.y, e.crit ? 8 : 3, e.crit ? '#ff8a2a' : '#fff3a0', 140, 0.25, 2);
          text(e.x + (Math.random() - 0.5) * 12, e.y - 6, String(e.dmg), e.crit ? '#ff8a2a' : '#ffffff', e.crit ? 16 : 11);
          if (e.crit) app.hitstop = Math.max(app.hitstop, 2);
          break;
        case 'kill':
          burst(e.x, e.y, e.boss ? 80 : 14, e.color || '#ffffff', e.boss ? 320 : 180, e.boss ? 1 : 0.5, e.boss ? 5 : 3);
          burst(e.x, e.y, 6, '#ffffff', 120, 0.3, 2);
          R.shake = Math.max(R.shake, e.boss ? 22 : 5);
          app.hitstop = Math.max(app.hitstop, e.boss ? 14 : 2);
          if (e.boss) R.flash = 0.6;
          break;
        case 'hurt':
          R.shake = Math.max(R.shake, 12); R.hurtFlash = 0.35; app.hitstop = Math.max(app.hitstop, 5);
          burst(e.x, e.y, 12, '#ff4040', 200, 0.4, 3);
          text(e.x, e.y - 24, '-' + e.dmg, '#ff5050', 15);
          break;
        case 'explode':
          ring(e.x, e.y, e.r, e.owner === 'p' ? '#ffe23e' : '#ff5a3a');
          burst(e.x, e.y, Math.min(30, 8 + e.r / 4), e.owner === 'p' ? '#ffd23e' : '#ff7a3a', e.r * 3, 0.45, 4);
          R.shake = Math.max(R.shake, Math.min(14, e.r / 8));
          break;
        case 'spark': burst(e.x, e.y, 3, e.owner === 'e' ? '#ff6a8a' : '#fff3a0', 90, 0.2, 2); break;
        case 'dash': burst(e.x, e.y + 8, 8, '#e8e8e8', 90, 0.3, 3); break;
        case 'swing': burst(e.x, e.y, 5, '#ffffff', 110, 0.15, 2); break;
        case 'charge': burst(e.x, e.y, 8, '#d8c8a8', 120, 0.3, 3); break;
        case 'summon': ring(e.x, e.y, 50, '#c070ff'); burst(e.x, e.y, 12, '#c070ff', 120, 0.5, 3); break;
        case 'special': R.shake = Math.max(R.shake, 6); burst(e.x, e.y, 14, '#9fe8ff', 160, 0.4, 3); break;
        case 'beam': R.shake = Math.max(R.shake, 7); break;
        case 'ultra': R.flash = 0.5; R.shake = 18; app.hitstop = 10; burst(e.x, e.y, 60, '#ffe23e', 360, 0.8, 4); ring(e.x, e.y, 160, '#ffe23e'); break;
        case 'revive': R.flash = 0.5; burst(e.x, e.y, 40, '#6fe06f', 260, 0.8, 4); text(e.x, e.y - 30, 'SENZU !', '#6fe06f', 16); break;
        case 'pickup': burst(e.x, e.y, 3, e.kind === 'zeni' ? '#ffd23e' : '#6fe06f', 70, 0.25, 2); break;
        case 'death': R.shake = 26; R.flash = 0.4; burst(e.x, e.y, 60, '#ff9a2e', 300, 1, 4); app.hitstop = 20; break;
        case 'roomClear': text(W / 2, H / 2 - 40, 'SALLE NETTOYÉE', '#ffe23e', 22); break;
        case 'bossPhase': R.flash = 0.4; R.shake = 16; ring(e.x, e.y, 200, '#ff5a3a'); burst(e.x, e.y, 40, '#ff5a3a', 300, 0.7, 4); app.hitstop = 8; break;
        case 'buy': burst(e.x, e.y, 16, '#ffd23e', 160, 0.5, 3); text(e.x, e.y - 20, e.label || 'Acheté !', '#ffd23e', 12); break;
        case 'heal': burst(e.x, e.y, 20, '#6fe06f', 160, 0.6, 3); text(e.x, e.y - 24, '+' + e.val + ' PV', '#6fe06f', 14); break;
        case 'noZeni': text(e.x, e.y - 20, 'Pas assez de Zeni', '#ff7070', 12); break;
        case 'roomEnter': R.fade = 1; R.parts.length = 0; R.texts.length = 0; break;
      }
      if (A) A.onEvent(e, g);
    }
    g.events.length = 0;
    // Aura de transformation : flammèches qui montent
    if (p.ultraT > 0 && g.frame % 2 === 0) part(p.x + (Math.random() - 0.5) * 22, p.y + 10, 0, -90 - Math.random() * 80, 0.4, DBR.CHARS[p.char].auraColor || '#ffe23e', 3);
    if (p.dashT > 0) part(p.x, p.y, 0, 0, 0.18, '#ffffff', 10);
  };

  /* ---------- Dessin des entités ---------- */
  function circle(x, y, r, color) { var c = ctx(); c.fillStyle = color; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }

  function drawObstacles(g, P) {
    var c = ctx();
    for (var i = 0; i < g.obstacles.length; i++) {
      var o = g.obstacles[i];
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(o.x + 3, o.y + o.r * 0.6, o.r * 1.05, o.r * 0.55, 0, 0, TAU); c.fill();
      circle(o.x, o.y, o.r, P.rockDark);
      circle(o.x - o.r * 0.12, o.y - o.r * 0.18, o.r * 0.82, P.rock);
      c.fillStyle = 'rgba(255,255,255,0.22)'; c.fillRect(Math.round(o.x - o.r * 0.5), Math.round(o.y - o.r * 0.6), Math.round(o.r * 0.45), 3);
      c.fillStyle = P.rockDark; c.fillRect(Math.round(o.x + o.r * 0.1), Math.round(o.y + o.r * 0.1), Math.round(o.r * 0.4), 2);
    }
  }

  function drawZones(g) {
    var c = ctx();
    for (var i = 0; i < g.zones.length; i++) {
      var z = g.zones[i], k = 1 - z.warn / z.warn0, col = z.owner === 'p' ? '255,226,62' : '255,60,40';
      c.fillStyle = 'rgba(' + col + ',0.16)'; c.beginPath(); c.arc(z.x, z.y, z.r, 0, TAU); c.fill();
      c.fillStyle = 'rgba(' + col + ',0.3)'; c.beginPath(); c.arc(z.x, z.y, z.r * k, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(' + col + ',0.9)'; c.lineWidth = 2; c.beginPath(); c.arc(z.x, z.y, z.r, 0, TAU); c.stroke();
    }
  }

  function drawPickups(g) {
    var c = ctx();
    for (var i = 0; i < g.pickups.length; i++) {
      var k = g.pickups[i], x = Math.round(k.x), y = Math.round(k.y + Math.sin(R.t * 8 + i) * 1.5);
      if (k.kind === 'zeni') { c.fillStyle = '#a8780a'; c.fillRect(x - 4, y - 4, 8, 8); c.fillStyle = '#ffd23e'; c.fillRect(x - 3, y - 4, 6, 7); c.fillStyle = '#fff6b0'; c.fillRect(x - 2, y - 3, 2, 3); }
      else { c.fillStyle = '#2f8a2f'; c.fillRect(x - 4, y - 3, 9, 6); c.fillStyle = '#6fe06f'; c.fillRect(x - 3, y - 3, 7, 4); }
    }
  }

  function drawEnemies(g) {
    var c = ctx(), p = g.player, list = g.enemies.slice().sort(function (a, b) { return a.y - b.y; });
    for (var i = 0; i < list.length; i++) {
      var e = list[i], d = e.def, sc = d.scale || 2;
      if (e.spawnT > 0) {                  // télégraphe d'apparition : cercle qui se referme
        var k = e.spawnT / 0.8;
        c.strokeStyle = 'rgba(255,80,80,0.8)'; c.lineWidth = 2;
        c.beginPath(); c.arc(e.x, e.y, e.r + 22 * k, 0, TAU); c.stroke();
        c.fillStyle = 'rgba(255,80,80,' + (0.35 * (1 - k)) + ')'; c.beginPath(); c.arc(e.x, e.y, e.r, 0, TAU); c.fill();
        continue;
      }
      c.fillStyle = 'rgba(0,0,0,0.28)'; c.beginPath(); c.ellipse(e.x, e.y + e.r, e.r, e.r * 0.4, 0, 0, TAU); c.fill();
      if (e.state === 'windup') {          // télégraphes d'attaque
        var w = 1 - e.t / (e.t0 || 0.5);
        if (d.ai === 'charger' || e.atk === 'charge') {
          c.strokeStyle = 'rgba(255,60,40,' + (0.3 + 0.5 * w) + ')'; c.lineWidth = e.r * 1.6;
          c.beginPath(); c.moveTo(e.x, e.y); c.lineTo(e.x + Math.cos(e.ang) * 300, e.y + Math.sin(e.ang) * 300); c.stroke();
        } else if (d.ai === 'melee') {
          c.strokeStyle = 'rgba(255,60,40,0.8)'; c.lineWidth = 2;
          c.beginPath(); c.arc(e.x, e.y, (e.r + p.r + d.reach) * w, 0, TAU); c.stroke();
        } else if (d.ai === 'bomber') {
          c.fillStyle = 'rgba(255,60,40,' + (0.15 + 0.25 * w) + ')'; c.beginPath(); c.arc(e.x, e.y, 70, 0, TAU); c.fill();
        }
      }
      var white = e.flash > 0 || (e.state === 'windup' && Math.floor(R.t * 14) % 2 === 0 && d.ai !== 'boss');
      var bob = e.state === 'move' ? Math.round(Math.sin(R.t * 12 + e.id) * 1.5) : 0;
      var tele = e.invuln > 0 && d.boss ? 0.5 : 1;
      c.globalAlpha = tele;
      R.sprite(d.sprite, e.x, e.y - 2 + bob, sc, e.face < 0, d.swap, white);
      c.globalAlpha = 1;
      if (e.state === 'windup' && d.ai !== 'boss') { c.fillStyle = '#ffe23e'; c.font = 'bold 14px monospace'; c.textAlign = 'center'; c.fillText('!', e.x, e.y - e.r - 12); }
      if (e.hp < e.maxHp && !d.boss) {     // petite barre de vie
        c.fillStyle = '#000000'; c.fillRect(Math.round(e.x - 13), Math.round(e.y + e.r + 6), 26, 4);
        c.fillStyle = '#e03030'; c.fillRect(Math.round(e.x - 12), Math.round(e.y + e.r + 7), Math.round(24 * e.hp / e.maxHp), 2);
      }
    }
  }

  var BEAM_COL = [['#ff2a5a', '#ffd0dc'], ['#39b8ff', '#e8fbff'], ['#5a7aff', '#ffffff'], ['#ffd23e', '#b060ff']];
  function drawBeams(g) {
    var c = ctx();
    for (var i = 0; i < g.beams.length; i++) {
      var b = g.beams[i], col = BEAM_COL[b.color] || BEAM_COL[0];
      var ex = b.x + Math.cos(b.ang) * b.len, ey = b.y + Math.sin(b.ang) * b.len;
      c.lineCap = 'round';
      if (b.warn > 0) {                    // télégraphe : trait fin clignotant de la largeur du rayon
        c.strokeStyle = b.owner === 'e' ? 'rgba(255,60,40,0.22)' : 'rgba(160,230,255,0.25)'; c.lineWidth = b.w;
        c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(ex, ey); c.stroke();
        c.strokeStyle = b.owner === 'e' ? 'rgba(255,60,40,0.9)' : 'rgba(255,255,255,0.8)'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(ex, ey); c.stroke();
        continue;
      }
      var w = b.w * (0.8 + 0.2 * Math.sin(R.t * 60)) * Math.min(1, b.life / 0.12 + 0.2);
      c.strokeStyle = col[0]; c.globalAlpha = 0.5; c.lineWidth = w * 1.5; c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(ex, ey); c.stroke();
      c.globalAlpha = 1; c.lineWidth = w; c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(ex, ey); c.stroke();
      c.strokeStyle = col[1]; c.lineWidth = w * 0.5; c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(ex, ey); c.stroke();
      circle(b.x, b.y, w * 0.9, col[1]); circle(ex, ey, w * (0.9 + Math.random() * 0.4), col[0]);
      c.lineCap = 'butt';
      if (Math.random() < 0.6) burst(ex, ey, 1, col[0], 160, 0.3, 3);
    }
  }

  function drawBullets(g) {
    var c = ctx(), pc = DBR.CHARS[g.player.char].color;
    for (var i = 0; i < g.bullets.length; i++) {
      var b = g.bullets[i];
      if (b.owner === 'p') {
        c.globalAlpha = 0.35; circle(b.x - b.vx * 0.02, b.y - b.vy * 0.02, b.r + 1, pc);
        c.globalAlpha = 1; circle(b.x, b.y, b.r + 2, b.crit ? '#ff8a2a' : pc); circle(b.x, b.y, b.r * 0.6, '#ffffff');
      } else {
        circle(b.x, b.y, b.r + 2, '#8a0a3a'); circle(b.x, b.y, b.r, '#ff3b6b'); circle(b.x, b.y, b.r * 0.45, '#ffe0ea');
      }
    }
  }

  /** Entités sous le joueur. */
  R.drawWorld = function (g, P) {
    drawObstacles(g, P);
    if (R.drawProps) R.drawProps(g, P);
    drawZones(g);
    drawPickups(g);
    drawEnemies(g);
    var p = g.player, c = ctx();
    if (p.ultraT > 0) {                    // halo de transformation
      c.globalAlpha = 0.25 + 0.1 * Math.sin(R.t * 30);
      circle(p.x, p.y - 2, 24 + Math.sin(R.t * 22) * 3, DBR.CHARS[p.char].auraColor || '#ffe23e');
      c.globalAlpha = 1;
    }
    if (p.aura > 0) { c.strokeStyle = 'rgba(255,140,40,' + (0.25 + 0.15 * Math.sin(R.t * 10)) + ')'; c.lineWidth = 3; c.beginPath(); c.arc(p.x, p.y, 78, 0, TAU); c.stroke(); }
  };

  /** Effets au-dessus du joueur. */
  R.drawOver = function (g) {
    var c = ctx(), i, dt = 1 / 60;
    drawBeams(g);
    drawBullets(g);
    for (i = R.parts.length - 1; i >= 0; i--) {
      var q = R.parts[i];
      q.life -= dt;
      if (q.life <= 0) { R.parts.splice(i, 1); continue; }
      q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.93; q.vy = q.vy * 0.93 + q.grav * dt;
      var s = Math.max(1, Math.round(q.size * q.life / q.max));
      c.fillStyle = q.color; c.globalAlpha = Math.min(1, q.life / q.max * 1.6);
      c.fillRect(Math.round(q.x - s / 2), Math.round(q.y - s / 2), s, s);
    }
    c.globalAlpha = 1;
    for (i = R.rings.length - 1; i >= 0; i--) {
      var r = R.rings[i];
      r.life -= dt;
      if (r.life <= 0) { R.rings.splice(i, 1); continue; }
      c.strokeStyle = r.color; c.globalAlpha = r.life / 0.3; c.lineWidth = 4;
      c.beginPath(); c.arc(r.x, r.y, r.r * (1.1 - r.life / 0.3 * 0.5), 0, TAU); c.stroke();
    }
    c.globalAlpha = 1; c.textAlign = 'center';
    for (i = R.texts.length - 1; i >= 0; i--) {
      var t = R.texts[i];
      t.life -= dt; t.y -= 30 * dt;
      if (t.life <= 0) { R.texts.splice(i, 1); continue; }
      c.font = 'bold ' + t.size + 'px monospace'; c.globalAlpha = Math.min(1, t.life * 3);
      c.fillStyle = '#000000'; c.fillText(t.txt, Math.round(t.x) + 1, Math.round(t.y) + 1);
      c.fillStyle = t.color; c.fillText(t.txt, Math.round(t.x), Math.round(t.y));
    }
    c.globalAlpha = 1;
    // Flashs plein écran : blanc (ultime, mort d'un boss) et rouge (dégâts subis)
    if (R.flash > 0) { c.fillStyle = 'rgba(255,255,255,' + Math.min(0.8, R.flash) + ')'; c.fillRect(0, 0, W, H); R.flash -= dt * 1.5; }
    if (R.hurtFlash > 0) { c.fillStyle = 'rgba(255,0,0,' + R.hurtFlash * 0.5 + ')'; c.fillRect(0, 0, W, H); R.hurtFlash -= dt; }
    if (R.fade > 0) { c.fillStyle = 'rgba(0,0,0,' + R.fade + ')'; c.fillRect(0, 0, W, H); R.fade -= dt * 3; }
  };

  /** Cheveux dorés pendant la transformation. */
  R.playerSwap = function (p) { return p.ultraT > 0 ? DBR.CHARS[p.char].ultraSwap || null : null; };
})();
