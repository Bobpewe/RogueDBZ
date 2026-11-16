/*
 * Dragon Roguelike — fan game non commercial
 * Auteur : Charles GRATIAS
 * hud.js : interface en jeu (PV, Ki, jauge ultime, Zeni, salle, barre de boss),
 * porte de sortie et objets interactifs des salles spéciales.
 * Le HUD est logé dans l'épaisseur des murs pour ne jamais masquer l'action.
 */
(function () {
  'use strict';
  var DBR = window.DBR, R = DBR.Render, W = DBR.W, H = DBR.H, WALL = DBR.WALL;

  function bar(c, x, y, w, h, k, col, back) {
    c.fillStyle = '#000000'; c.fillRect(x - 1, y - 1, w + 2, h + 2);
    c.fillStyle = back || '#2a2a33'; c.fillRect(x, y, w, h);
    c.fillStyle = col; c.fillRect(x, y, Math.round(w * Math.max(0, Math.min(1, k))), h);
    c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(x, y, Math.round(w * Math.max(0, Math.min(1, k))), Math.max(1, h >> 2));
  }
  function label(c, txt, x, y, col, size, align) {
    c.font = 'bold ' + (size || 11) + 'px monospace'; c.textAlign = align || 'left';
    c.fillStyle = '#000000'; c.fillText(txt, x + 1, y + 1);
    c.fillStyle = col || '#ffffff'; c.fillText(txt, x, y);
  }
  R.label = label; R.bar = bar;

  /** Porte en haut au centre : fermée pendant le combat, lumineuse une fois ouverte. */
  function drawDoor(g, P) {
    var c = R.ctx, x = W / 2 - 34, open = g.phase === 'open';
    c.fillStyle = '#000000'; c.fillRect(x - 3, 0, 74, WALL);
    if (open) {
      c.fillStyle = P.accent; c.globalAlpha = 0.6 + 0.3 * Math.sin(R.t * 6); c.fillRect(x, 0, 68, WALL - 2); c.globalAlpha = 1;
      c.fillStyle = '#ffffff'; c.fillRect(x + 20, 4, 28, WALL - 8);
      var next = g.rooms[g.roomIndex + 1];
      if (next) label(c, '▲ ' + DBR.ROOM_NAMES[next.kind], W / 2, WALL + 16, '#ffffff', 12, 'center');
    } else {
      c.fillStyle = '#3a2a1e'; c.fillRect(x, 0, 68, WALL - 2);
      c.fillStyle = '#1e140e'; for (var i = 0; i < 5; i++) c.fillRect(x + 6 + i * 13, 0, 5, WALL - 2);
    }
  }

  /** Objets des salles spéciales : haricot Senzu, coffre, étals de boutique. */
  R.drawItems = function (g) {
    var c = R.ctx, p = g.player;
    for (var i = 0; i < g.props.length; i++) {
      var o = g.props[i], x = Math.round(o.x), y = Math.round(o.y), fl = Math.round(Math.sin(R.t * 3 + i) * 3);
      c.fillStyle = 'rgba(0,0,0,0.28)'; c.beginPath(); c.ellipse(x, y + 16, 20, 7, 0, 0, 6.3); c.fill();
      if (o.kind === 'chest') {
        c.fillStyle = '#5a3a14'; c.fillRect(x - 18, y - 12, 36, 26);
        c.fillStyle = o.used ? '#3a2a14' : '#b87a2a'; c.fillRect(x - 16, y - 10, 32, o.used ? 6 : 22);
        c.fillStyle = '#ffd23e'; c.fillRect(x - 16, y - 1, 32, 3); c.fillRect(x - 3, y - 4, 6, 9);
        if (!o.used) R.label(c, 'Trésor', x, y - 22 + fl, '#ffd23e', 11, 'center');
      } else if (o.kind === 'senzu' || o.kind === 'shopHeal') {
        if (o.kind === 'shopHeal') { c.fillStyle = '#4a4a5a'; c.fillRect(x - 16, y + 4, 32, 12); c.fillStyle = '#6a6a7a'; c.fillRect(x - 16, y + 4, 32, 3); }
        if (!o.used) {
          c.fillStyle = '#1f6a1f'; c.fillRect(x - 9, y - 8 + fl, 18, 12); c.fillStyle = '#6fe06f'; c.fillRect(x - 8, y - 8 + fl, 16, 9); c.fillStyle = '#d0ffd0'; c.fillRect(x - 5, y - 6 + fl, 5, 3);
          R.label(c, o.kind === 'senzu' ? 'Haricot Senzu (+50 % PV)' : 'Senzu +40 % PV — ' + o.cost + ' Z', x, y - 20, '#6fe06f', 11, 'center');
        }
      } else if (o.kind === 'shopItem') {
        var u = DBR.UPGRADES[o.upg], rar = DBR.RARITY[u.rar];
        c.fillStyle = '#4a4a5a'; c.fillRect(x - 18, y + 4, 36, 12); c.fillStyle = '#6a6a7a'; c.fillRect(x - 18, y + 4, 36, 3);
        if (!o.used) {
          c.fillStyle = '#000000'; c.fillRect(x - 13, y - 22 + fl, 26, 26);
          c.fillStyle = rar.color; c.fillRect(x - 11, y - 20 + fl, 22, 22);
          c.fillStyle = '#000000'; c.font = 'bold 16px monospace'; c.textAlign = 'center'; c.fillText(u.icon, x, y - 4 + fl);
          R.label(c, o.cost + ' Z', x, y + 32, p.zeni >= o.cost ? '#ffd23e' : '#ff7070', 12, 'center');
        }
      }
    }
    var n = g.nearProp;                    // fiche de l'article le plus proche
    if (n && !n.used && g.phase === 'open') {
      var name = n.kind === 'shopHeal' ? 'Haricot Senzu' : DBR.UPGRADES[n.upg].name, desc = n.kind === 'shopHeal' ? 'Rend 40 % des PV.' : DBR.UPGRADES[n.upg].desc;
      c.fillStyle = 'rgba(5,5,15,0.85)'; c.fillRect(W / 2 - 250, H - 110, 500, 60);
      R.label(c, name + ' — ' + n.cost + ' Zeni', W / 2, H - 90, n.kind === 'shopHeal' ? '#6fe06f' : DBR.RARITY[DBR.UPGRADES[n.upg].rar].color, 13, 'center');
      R.label(c, desc, W / 2, H - 74, '#ffffff', 11, 'center');
      R.label(c, p.zeni >= n.cost ? '[E] Acheter' : 'Pas assez de Zeni', W / 2, H - 58, p.zeni >= n.cost ? '#ffe23e' : '#ff7070', 11, 'center');
    }
  };

  R.drawProps = function (g, P) {
    drawDoor(g, P);
    if (R.drawItems) R.drawItems(g, P);
  };

  R.drawHud = function (g) {
    var c = R.ctx, p = g.player, ch = DBR.CHARS[p.char], room = g.room, i;
    // PV / Ki (mur du haut, à gauche)
    bar(c, 44, 5, 190, 11, p.hp / p.maxHp, p.hp < p.maxHp * 0.3 ? '#ff3030' : '#3ecf4a');
    label(c, 'PV ' + Math.ceil(p.hp) + '/' + p.maxHp, 48, 15, '#ffffff', 10);
    bar(c, 44, 20, 190, 7, p.ki / p.kiMax, p.ki >= p.specialCost ? '#39b8ff' : '#2a6a9a');
    c.fillStyle = '#ffffff'; c.fillRect(44 + Math.round(190 * p.specialCost / p.kiMax), 20, 1, 7);   // repère du coût du spécial
    label(c, 'PV', 10, 15, '#3ecf4a', 11); label(c, 'KI', 10, 27, '#39b8ff', 11);
    // Jauge ultime
    var full = p.ultra >= 100, on = p.ultraT > 0;
    bar(c, 250, 8, 120, 14, on ? p.ultraT / p.ultraDur : p.ultra / 100, on ? '#ffffff' : (full && Math.floor(R.t * 6) % 2 ? '#fff6b0' : '#ffd23e'), '#3a3010');
    label(c, on ? ch.ultraName.toUpperCase() + ' !' : (full ? 'F : ' + ch.ultraName : ch.ultraName), 310, 19, on || full ? '#000000' : '#c8b060', 10, 'center');
    // Zeni + dash
    c.fillStyle = '#a8780a'; c.fillRect(384, 9, 12, 12); c.fillStyle = '#ffd23e'; c.fillRect(385, 9, 10, 11);
    label(c, String(p.zeni), 402, 20, '#ffd23e', 13);
    // Salle courante (mur du haut, à droite)
    if (room) {
      var b = DBR.BIOMES[room.biome];
      label(c, b.name + ' — ' + DBR.ROOM_NAMES[room.kind], W - 10, 14, '#ffffff', 11, 'right');
      label(c, 'Salle ' + (g.roomIndex + 1) + '/' + g.rooms.length + (room.waves.length > 1 && g.phase === 'combat' ? '  Vague ' + Math.max(1, room.wave) + '/' + room.waves.length : ''), W - 10, 27, '#b8c0d0', 10, 'right');
    }
    // Mur du bas : dash, améliorations acquises, rappel des touches
    bar(c, 10, H - 20, 60, 8, 1 - Math.max(0, p.dashCd) / p.dashMax, p.dashCd <= 0 ? '#e8e8e8' : '#777777');
    label(c, 'DASH', 76, H - 12, '#b8c0d0', 10);
    if (DBR.UPGRADES) for (i = 0; i < p.upgrades.length && i < 34; i++) {
      var u = DBR.UPGRADES[p.upgrades[i]];
      c.fillStyle = '#000000'; c.fillRect(118 + i * 15, H - 23, 13, 13);
      c.fillStyle = DBR.RARITY[u.rar].color; c.fillRect(119 + i * 15, H - 22, 11, 11);
      c.fillStyle = '#000000'; c.font = 'bold 9px monospace'; c.textAlign = 'center'; c.fillText(u.icon, 124.5 + i * 15, H - 13);
    }
    label(c, 'Échap : pause', W - 10, H - 12, '#8088a0', 10, 'right');
    // Barre de (mini-)boss
    for (i = 0; i < g.enemies.length; i++) {
      var e = g.enemies[i];
      if (e.def.boss && !(e.spawnT > 0)) {
        bar(c, W / 2 - 220, H - 58, 440, 12, e.hp / e.maxHp, e.def.boss > 1 ? '#d03aff' : '#ff7a2a');
        label(c, e.def.name, W / 2, H - 62, '#ffffff', 13, 'center');
        var ph = e.def.phases || [];
        c.fillStyle = '#ffffff'; for (var k = 1; k < ph.length; k++) c.fillRect(W / 2 - 220 + Math.round(440 * ph[k].at), H - 58, 2, 12);
        break;
      }
    }
    // Message d'invite quand la porte est ouverte
    if (g.phase === 'open' && Math.floor(R.t * 2) % 2 === 0 && g.room && (g.room.kind === 'combat' || g.room.kind === 'miniboss' || g.room.kind === 'boss'))
      label(c, 'La porte est ouverte !', W / 2, WALL + 34, '#ffe23e', 12, 'center');
  };
})();
