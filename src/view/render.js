/*
 * Dragon Roguelike — fan game non commercial
 * Auteur : Charles GRATIAS
 * render.js : rendu Canvas 2D de la partie (décor, entités, effets, HUD).
 * Lit l'état de la simulation sans jamais le modifier (sauf vider g.events).
 */
(function () {
  'use strict';
  var DBR = window.DBR = window.DBR || {};
  var S = DBR.Sprites, W = DBR.W, H = DBR.H, WALL = DBR.WALL;
  var ctx = null, floorCache = null, floorKey = '';

  var DEFAULT_PAL = { floor: '#4f9a4a', floor2: '#458c41', speck: '#6fbd62', wall: '#3a5a34', wallTop: '#5c8a50', wallDark: '#24381f', rock: '#7d7f86', rockDark: '#55575e', accent: '#ffe066' };
  function pal(g) {
    return (g.room && DBR.BIOMES && DBR.BIOMES[g.room.biome] && DBR.BIOMES[g.room.biome].pal) || DEFAULT_PAL;
  }

  var R = { shake: 0, t: 0, parts: [], texts: [], flash: 0, fade: 0 };

  R.init = function (canvas) {
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    R.ctx = ctx;
  };

  /** Pré-rend le sol et les murs d'une salle (mouchetis déterministe) dans un canvas caché. */
  function buildFloor(g) {
    var P = pal(g), c = document.createElement('canvas'), x, y, i;
    c.width = W; c.height = H;
    var k = c.getContext('2d'), rng = new DBR.RNG((g.seed ^ ((g.roomIndex || 0) * 7919)) >>> 0);
    k.fillStyle = P.floor; k.fillRect(0, 0, W, H);
    for (y = 0; y < H; y += 32) for (x = 0; x < W; x += 32) {
      if (((x + y) / 32) % 2 === 0) { k.fillStyle = P.floor2; k.fillRect(x, y, 32, 32); }
    }
    for (i = 0; i < 420; i++) {            // mouchetis : herbe, cailloux, éclats...
      k.fillStyle = rng.chance(0.5) ? P.speck : P.wallDark;
      k.globalAlpha = rng.range(0.15, 0.5);
      k.fillRect(rng.int(WALL, W - WALL - 4) & ~1, rng.int(WALL, H - WALL - 4) & ~1, rng.pick([2, 2, 4]), 2);
    }
    k.globalAlpha = 1;
    // Murs : bande supérieure épaisse (vue de 3/4), côtés et bas
    k.fillStyle = P.wall; k.fillRect(0, 0, W, WALL); k.fillRect(0, H - WALL, W, WALL); k.fillRect(0, 0, WALL, H); k.fillRect(W - WALL, 0, WALL, H);
    k.fillStyle = P.wallTop;
    for (x = 0; x < W; x += 32) { k.fillRect(x + 2, 2, 28, 12); k.fillRect(x + 2, H - WALL + 2, 28, 12); }
    for (y = 32; y < H - 32; y += 32) { k.fillRect(2, y + 2, 12, 28); k.fillRect(W - 14, y + 2, 12, 28); }
    k.fillStyle = P.wallDark;
    k.fillRect(WALL - 4, WALL - 4, W - 2 * WALL + 8, 4); k.fillRect(WALL - 4, H - WALL, W - 2 * WALL + 8, 4);
    k.fillRect(WALL - 4, WALL, 4, H - 2 * WALL); k.fillRect(W - WALL, WALL, 4, H - 2 * WALL);
    return c;
  }

  /** Dessine un sprite centré, avec miroir horizontal optionnel. */
  function sprite(name, x, y, scale, flip, swap, white) {
    var c = S.get(name, scale, swap, white);
    x = Math.round(x); y = Math.round(y);
    if (flip) { ctx.save(); ctx.translate(x, y); ctx.scale(-1, 1); ctx.drawImage(c, -c.width / 2, -c.height / 2); ctx.restore(); }
    else ctx.drawImage(c, x - c.width / 2, y - c.height / 2);
  }
  R.sprite = sprite;

  function shadow(x, y, r) {
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.45, 0, 0, 6.3); ctx.fill();
  }

  function drawPlayer(g) {
    var p = g.player, bob = p.moving ? Math.round(Math.sin(g.time * 16) * 1.5) : 0;
    shadow(p.x, p.y + 14, 12);
    var blink = p.invuln > 0 && p.dashT <= 0 && Math.floor(g.time * 20) % 2 === 0;
    if (!blink) sprite(p.char, p.x + 2, p.y - 4 + bob, 2, Math.cos(p.aim) < 0, R.playerSwap ? R.playerSwap(p) : null, p.flash > 0);
  }

  /** Rendu complet d'une image. */
  R.draw = function (g) {
    R.t += 1 / 60;
    var key = g.seed + ':' + (g.roomIndex || 0) + ':' + (g.room ? g.room.biome : -1);
    if (key !== floorKey) { floorCache = buildFloor(g); floorKey = key; }
    ctx.save();
    if (R.shakeOff) R.shake = 0;
    if (R.shake > 0.2) {
      ctx.translate(Math.round((Math.random() - 0.5) * R.shake), Math.round((Math.random() - 0.5) * R.shake));
      R.shake *= 0.86;
    }
    ctx.drawImage(floorCache, 0, 0);
    if (R.drawWorld) R.drawWorld(g, pal(g));   // entités de combat (ajoutées par fx.js)
    drawPlayer(g);
    if (R.drawOver) R.drawOver(g, pal(g));     // effets au-dessus (particules, textes)
    ctx.restore();
    if (R.drawHud) R.drawHud(g);
    if (R.noReticle) return;
    // Réticule de visée
    var m = DBR.Input.mouse;
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
    ctx.strokeRect(Math.round(m.x) - 5, Math.round(m.y) - 5, 10, 10);
    ctx.fillStyle = '#ff5050'; ctx.fillRect(Math.round(m.x) - 1, Math.round(m.y) - 1, 2, 2);
  };

  DBR.Render = R;
})();
