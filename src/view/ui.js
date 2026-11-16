/*
 * Dragon Roguelike — fan game non commercial
 * Auteur : Charles GRATIAS
 * ui.js : interface hors combat dessinée dans le canvas — cartes de choix d'amélioration,
 * puis (plus bas) les menus : titre, sélection, dojo, réglages, pause, fin de run, crédits.
 */
(function () {
  'use strict';
  var DBR = window.DBR, R = DBR.Render, In = DBR.Input, W = DBR.W, H = DBR.H;
  var UI = DBR.UI = { sel: 0, lock: 0 };

  /** Texte avec retour à la ligne automatique. Retourne la hauteur utilisée. */
  function wrap(c, txt, x, y, maxW, lh) {
    var words = txt.split(' '), line = '', yy = y;
    for (var i = 0; i < words.length; i++) {
      var t = line ? line + ' ' + words[i] : words[i];
      if (c.measureText(t).width > maxW && line) { c.fillText(line, x, yy); line = words[i]; yy += lh; } else line = t;
    }
    if (line) c.fillText(line, x, yy);
    return yy - y + lh;
  }
  UI.wrap = wrap;
  function inRect(m, x, y, w, h) { return m.x >= x && m.x < x + w && m.y >= y && m.y < y + h; }
  UI.inRect = inRect;

  /** Curseur de menu (le curseur système est masqué sur le canvas). */
  UI.cursor = function () {
    var c = R.ctx, m = In.mouse, x = Math.round(m.x), y = Math.round(m.y);
    c.fillStyle = '#000000'; c.fillRect(x - 1, y - 1, 12, 4); c.fillRect(x - 1, y - 1, 4, 12);
    c.fillStyle = '#ffe23e'; c.fillRect(x, y, 10, 2); c.fillRect(x, y, 2, 10); c.fillRect(x + 2, y + 2, 4, 4);
  };

  /* ---------- Choix d'une amélioration parmi 3 ---------- */
  var CW = 240, CH = 250, CY = 150;
  function cardX(i, n) { return W / 2 - (n * CW + (n - 1) * 30) / 2 + i * (CW + 30); }

  UI.openReward = function () { UI.sel = 1; UI.lock = 25; };   // court verrou : évite un clic accidentel en plein tir

  UI.updateReward = function (g) {
    var n = g.choice.length, m = In.mouse, i, pick = -1;
    if (UI.lock > 0) { UI.lock--; return; }
    for (i = 0; i < n; i++) {
      if (inRect(m, cardX(i, n), CY, CW, CH)) { UI.sel = i; if (m.clicked) pick = i; }
      if (In.hit('Digit' + (i + 1)) || In.hit('Numpad' + (i + 1))) pick = i;
    }
    if (In.hit('ArrowLeft') || In.hit('KeyA')) UI.sel = (UI.sel + n - 1) % n;
    if (In.hit('ArrowRight') || In.hit('KeyD')) UI.sel = (UI.sel + 1) % n;
    if (In.hit('Enter') || In.hit('Space')) pick = Math.min(UI.sel, n - 1);
    if (pick >= 0 && DBR.chooseUpgrade(g, pick) && DBR.Audio) DBR.Audio.sfx('power');
  };

  UI.drawReward = function (g) {
    var c = R.ctx, n = g.choice.length;
    c.fillStyle = 'rgba(5,5,15,0.72)'; c.fillRect(0, 0, W, H);
    R.label(c, 'CHOISIS UNE AMÉLIORATION', W / 2, 96, '#ffe23e', 24, 'center');
    R.label(c, 'Clic, ou touches 1 / 2 / 3, ou ←/→ puis Entrée', W / 2, 122, '#b8c0d0', 12, 'center');
    for (var i = 0; i < n; i++) {
      var u = DBR.UPGRADES[g.choice[i]], rar = DBR.RARITY[u.rar], x = cardX(i, n), y = CY - (UI.sel === i ? 8 : 0);
      c.fillStyle = '#000000'; c.fillRect(x - 4, y - 4, CW + 8, CH + 8);
      c.fillStyle = UI.sel === i ? rar.color : '#555a6a'; c.fillRect(x - 2, y - 2, CW + 4, CH + 4);
      c.fillStyle = '#1a1c2a'; c.fillRect(x, y, CW, CH);
      c.fillStyle = rar.color; c.fillRect(x, y, CW, 26);
      c.fillStyle = '#000000'; c.font = 'bold 13px monospace'; c.textAlign = 'center'; c.fillText(rar.name.toUpperCase(), x + CW / 2, y + 18);
      c.fillStyle = rar.color; c.fillRect(x + CW / 2 - 28, y + 44, 56, 56);
      c.fillStyle = '#1a1c2a'; c.fillRect(x + CW / 2 - 24, y + 48, 48, 48);
      c.fillStyle = rar.color; c.font = 'bold 34px monospace'; c.fillText(u.icon, x + CW / 2, y + 85);
      c.fillStyle = '#ffffff'; c.font = 'bold 15px monospace';
      var hh = wrap(c, u.name, x + CW / 2, y + 128, CW - 24, 18);
      c.fillStyle = '#b8c0d0'; c.font = '12px monospace';
      wrap(c, u.desc, x + CW / 2, y + 134 + hh, CW - 28, 16);
      c.fillStyle = '#8088a0'; c.font = 'bold 12px monospace'; c.fillText('[' + (i + 1) + ']', x + CW / 2, y + CH - 12);
    }
    UI.cursor();
  };
})();
