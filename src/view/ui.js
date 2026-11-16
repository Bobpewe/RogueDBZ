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

  /** Vrai si la souris a bougé depuis le dernier appel : le survol ne vole pas la sélection clavier. */
  var lastMx = -1, lastMy = -1;
  function mouseMoved() { var m = In.mouse, mv = m.x !== lastMx || m.y !== lastMy; lastMx = m.x; lastMy = m.y; return mv; }

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
    var n = g.choice.length, m = In.mouse, i, pick = -1, moved = mouseMoved();
    if (UI.lock > 0) { UI.lock--; return; }
    for (i = 0; i < n; i++) {
      if (inRect(m, cardX(i, n), CY, CW, CH)) { if (moved || m.clicked) UI.sel = i; if (m.clicked) pick = i; }
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

  /* ====================================================================================
   * Menus. Chaque écran = { enter(), update(), draw(), overGame } rangé dans UI.screens.
   * overGame : l'écran se dessine par-dessus la partie (pause, fin de run).
   * ==================================================================================== */
  var S = UI.screens = {}, MW = 360, MH = 32, MG = 8;
  var SIGN = '© Charles GRATIAS — Fan game non commercial, non affilié à Bird Studio/Shueisha/Toei';

  function sfx(n) { if (DBR.Audio) DBR.Audio.sfx(n); }
  UI.go = function (state) { DBR.App.state = state; UI.sel = 0; if (S[state] && S[state].enter) S[state].enter(); };

  function fire(it, dir) {
    if (it.adj) { it.adj(dir); sfx('select'); }
    else if (it.act) { sfx('confirm'); it.act(); }
  }
  /** Navigation d'une liste verticale : flèches/ZQSD + Entrée, ou souris. */
  function menuUpdate(items, y, back) {
    var m = In.mouse, x = W / 2 - MW / 2, n = items.length, moved = mouseMoved(), old = UI.sel, i;
    if (UI.sel >= n) UI.sel = 0;
    if (In.hit('ArrowUp') || In.hit('KeyW')) UI.sel = (UI.sel + n - 1) % n;
    if (In.hit('ArrowDown') || In.hit('KeyS')) UI.sel = (UI.sel + 1) % n;
    for (i = 0; i < n; i++) {
      if (inRect(m, x, y + i * (MH + MG), MW, MH)) {
        if (moved) UI.sel = i;
        if (m.clicked) { UI.sel = i; fire(items[i], m.x < W / 2 ? -1 : 1); return; }
      }
    }
    if (old !== UI.sel) sfx('select');
    var it = items[UI.sel];
    if (In.hit('Enter') || In.hit('Space')) fire(it, 1);
    else if (it.adj && (In.hit('ArrowLeft') || In.hit('KeyA'))) fire(it, -1);
    else if (it.adj && (In.hit('ArrowRight') || In.hit('KeyD'))) fire(it, 1);
    else if (back && In.hit('Escape')) { sfx('select'); back(); }
  }
  function menuDraw(items, y) {
    var c = R.ctx, x = W / 2 - MW / 2;
    for (var i = 0; i < items.length; i++) {
      var it = items[i], iy = y + i * (MH + MG), on = UI.sel === i, txt = typeof it.label === 'function' ? it.label() : it.label;
      c.fillStyle = '#000000'; c.fillRect(x - 2, iy - 2, MW + 4, MH + 4);
      c.fillStyle = on ? '#ff9a2e' : '#2a2c40'; c.fillRect(x, iy, MW, MH);
      c.fillStyle = on ? '#ffd23e' : '#3a3d58'; c.fillRect(x, iy, MW, 3);
      c.font = 'bold 14px monospace'; c.textAlign = 'center';
      c.fillStyle = on ? '#1a1206' : '#e8ecf8'; c.fillText((it.adj ? '◄ ' : '') + txt + (it.adj ? ' ►' : ''), W / 2, iy + 21);
    }
    UI.cursor();
  }

  /** Fond des menus : ciel nocturne étoilé, collines, et les sept boules de cristal. */
  function backdrop(title, sub) {
    var c = R.ctx, i;
    c.fillStyle = '#0b0b1e'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#141432'; c.fillRect(0, H * 0.45, W, H);
    for (i = 0; i < 90; i++) {
      var x = (i * 137.5) % W, y = (i * 61.3) % (H * 0.7), tw = 0.4 + 0.6 * Math.abs(Math.sin(R.t * 1.5 + i));
      c.fillStyle = 'rgba(255,255,255,' + (tw * 0.8) + ')'; c.fillRect(Math.round(x), Math.round(y), i % 7 === 0 ? 3 : 2, i % 7 === 0 ? 3 : 2);
    }
    c.fillStyle = '#1c2a3a'; for (i = 0; i < W; i += 8) c.fillRect(i, H - 70 - Math.round(Math.sin(i / 90) * 22 + Math.sin(i / 37) * 8), 8, 200);
    c.fillStyle = '#16212e'; for (i = 0; i < W; i += 8) c.fillRect(i, H - 40 - Math.round(Math.sin(i / 60 + 2) * 14), 8, 200);
    if (title) {
      c.font = 'bold 44px monospace'; c.textAlign = 'center';
      c.fillStyle = '#7a2a08'; c.fillText(title, W / 2 + 3, 73);
      c.fillStyle = '#ff9a2e'; c.fillText(title, W / 2, 70);
      if (sub) R.label(c, sub, W / 2, 96, '#b8c0d0', 12, 'center');
    }
    R.label(c, SIGN, W / 2, H - 8, '#8088a0', 10, 'center');
  }
  function orb(x, y, r, stars) {
    var c = R.ctx, i;
    c.fillStyle = '#a84a08'; c.beginPath(); c.arc(x, y, r, 0, 6.3); c.fill();
    c.fillStyle = '#ff9a2e'; c.beginPath(); c.arc(x - 1, y - 1, r - 2, 0, 6.3); c.fill();
    c.fillStyle = '#ffd88a'; c.fillRect(Math.round(x - r * 0.5), Math.round(y - r * 0.6), Math.max(2, r >> 2), Math.max(2, r >> 2));
    c.fillStyle = '#d02020';
    for (i = 0; i < stars; i++) { var a = i * 6.283 / stars, d = stars > 1 ? r * 0.42 : 0; c.fillRect(Math.round(x + Math.cos(a) * d) - 1, Math.round(y + Math.sin(a) * d) - 1, 3, 3); }
  }
  function orbCount() { orb(W - 110, 24, 9, 4); R.label(R.ctx, DBR.App.save.orbs + ' orbes', W - 94, 29, '#ffd23e', 14); }
  function fmtTime(t) { var s = Math.floor(t); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }

  /* ---------- Écran titre ---------- */
  var titleItems = [
    { label: 'Jouer', act: function () { UI.go('select'); } },
    { label: 'Dojo — bonus permanents', act: function () { UI.go('dojo'); } },
    { label: 'Réglages', act: function () { UI.back = 'title'; UI.go('settings'); } },
    { label: 'Crédits', act: function () { UI.go('credits'); } }
  ];
  S.title = {
    update: function () { menuUpdate(titleItems, 250); },
    draw: function () {
      var c = R.ctx, st = DBR.App.save.stats, i;
      backdrop();
      c.font = 'bold 60px monospace'; c.textAlign = 'center';
      c.fillStyle = '#7a2a08'; c.fillText('DRAGON ROGUELIKE', W / 2 + 4, 124);
      c.fillStyle = '#ff9a2e'; c.fillText('DRAGON ROGUELIKE', W / 2, 120);
      c.fillStyle = '#ffd23e'; c.fillRect(W / 2 - 290, 134, 580, 4);
      R.label(c, 'Un fan game de Charles GRATIAS', W / 2, 164, '#ffffff', 16, 'center');
      for (i = 0; i < 7; i++) orb(W / 2 - 108 + i * 36, 204 + Math.round(Math.sin(R.t * 2 + i) * 3), 12, i + 1);
      R.sprite('goku', 150, 330 + Math.round(Math.sin(R.t * 3) * 3), 6, false);
      R.sprite('vegeta', 800, 330 + Math.round(Math.sin(R.t * 3 + 2) * 3), 6, true);
      R.sprite('piccolo', 112, 446 + Math.round(Math.sin(R.t * 3 + 4) * 3), 4, true);
      menuDraw(titleItems, 250);
      orbCount();
      R.label(c, 'Runs : ' + st.runs + '   Victoires : ' + st.wins + '   Meilleure salle : ' + st.bestRoom + (st.bestTime ? '   Record : ' + fmtTime(st.bestTime) : ''), W / 2, 436, '#b8c0d0', 11, 'center');
      R.label(c, 'ZQSD / WASD / flèches : bouger · Souris : viser · Clic gauche / J : Ki blast · Espace : dash', W / 2, 462, '#e8ecf8', 11, 'center');
      R.label(c, 'Clic droit / K : attaque spéciale · F / L : transformation · E : acheter · Échap / P : pause', W / 2, 478, '#e8ecf8', 11, 'center');
    }
  };

  /* ---------- Sélection du personnage ---------- */
  var KW = 270, KH = 330, KY = 108;
  function charX(i) { return W / 2 - (3 * KW + 40) / 2 + i * (KW + 20); }
  function pickChar(i) {
    var App = DBR.App, id = DBR.CHAR_ORDER[i];
    if (App.save.unlocked[id]) { sfx('confirm'); App.startRun(id); }
    else if (DBR.Meta.unlockChar(App.save, id)) { App.persist(); sfx('power'); }
    else sfx('deny');
  }
  S.select = {
    enter: function () { UI.sel = Math.max(0, DBR.CHAR_ORDER.indexOf(DBR.App.charId)); },
    update: function () {
      var m = In.mouse, App = DBR.App, old = UI.sel, moved = mouseMoved();
      for (var i = 0; i < 3; i++) if (inRect(m, charX(i), KY, KW, KH)) { if (moved || m.clicked) UI.sel = i; if (m.clicked) return pickChar(i); }
      if (In.hit('ArrowLeft') || In.hit('KeyA')) UI.sel = (UI.sel + 2) % 3;
      if (In.hit('ArrowRight') || In.hit('KeyD')) UI.sel = (UI.sel + 1) % 3;
      if (old !== UI.sel) sfx('select');
      if (In.hit('Enter') || In.hit('Space')) return pickChar(UI.sel);
      if (In.hit('KeyG')) { var s = window.prompt('Graine du run (laisser vide pour une graine aléatoire) :', App.seedText || ''); if (s !== null) App.seedText = s.trim(); }
      if (In.hit('Escape')) { sfx('select'); UI.go('title'); }
    },
    draw: function () {
      var c = R.ctx, App = DBR.App;
      backdrop('CHOISIS TON COMBATTANT', '←/→ puis Entrée, ou clic · Échap : retour');
      orbCount();
      for (var i = 0; i < 3; i++) {
        var ch = DBR.CHARS[DBR.CHAR_ORDER[i]], x = charX(i), on = UI.sel === i, y = KY - (on ? 6 : 0), open = App.save.unlocked[ch.id];
        c.fillStyle = '#000000'; c.fillRect(x - 4, y - 4, KW + 8, KH + 8);
        c.fillStyle = on ? '#ffd23e' : '#555a6a'; c.fillRect(x - 2, y - 2, KW + 4, KH + 4);
        c.fillStyle = '#1a1c2a'; c.fillRect(x, y, KW, KH);
        c.fillStyle = '#24273a'; c.fillRect(x + 10, y + 10, KW - 20, 116);
        R.sprite(ch.id, x + KW / 2 + 6, y + 70 + (on ? Math.round(Math.sin(R.t * 5) * 3) : 0), 6, false, on && open ? ch.ultraSwap : null, false);
        R.label(c, ch.name.toUpperCase(), x + KW / 2, y + 150, '#ffffff', 20, 'center');
        c.fillStyle = '#b8c0d0'; c.font = '11px monospace'; c.textAlign = 'center';
        wrap(c, ch.desc, x + KW / 2, y + 170, KW - 30, 14);
        var rows = [['PV', ch.hp / 120, '#3ecf4a'], ['Dégâts', ch.dmg / 15, '#ff7a2a'], ['Vitesse', (ch.speed - 150) / 60, '#e8e8e8'], ['Portée', ch.range / 1.3, '#39b8ff']];
        for (var k = 0; k < rows.length; k++) { R.label(c, rows[k][0], x + 22, y + 216 + k * 18, '#b8c0d0', 11); R.bar(c, x + 90, y + 208 + k * 18, 150, 8, rows[k][1], rows[k][2]); }
        R.label(c, 'Spécial : ' + ch.specialName, x + KW / 2, y + 292, '#39b8ff', 11, 'center');
        R.label(c, 'Ultime : ' + ch.ultraName + (ch.regen ? ' · régénère' : ''), x + KW / 2, y + 308, '#ffd23e', 11, 'center');
        if (!open) {
          c.fillStyle = 'rgba(5,5,15,0.78)'; c.fillRect(x, y, KW, KH);
          R.label(c, 'VERROUILLÉ', x + KW / 2, y + 150, '#ffffff', 20, 'center');
          orb(x + KW / 2 - 104, y + 184, 10, 4);
          R.label(c, 'Débloquer : ' + ch.cost + ' orbes', x + KW / 2 + 12, y + 189, App.save.orbs >= ch.cost ? '#ffd23e' : '#ff7070', 13, 'center');
          R.label(c, App.save.orbs >= ch.cost ? 'Entrée / clic pour débloquer' : 'Gagne des orbes en jouant', x + KW / 2, y + 214, '#b8c0d0', 11, 'center');
        }
      }
      R.label(c, 'Graine : ' + (App.seedText || 'aléatoire') + '   [G pour changer]   ·   Difficulté : ' + DBR.DIFFICULTIES[App.save.settings.difficulty].name, W / 2, 478, '#b8c0d0', 12, 'center');
      UI.cursor();
    }
  };

  /* ---------- Dojo : bonus permanents ---------- */
  var dojoItems = DBR.PERK_ORDER.map(function (id) {
    return {
      label: function () {
        var d = DBR.App.save, pk = DBR.PERKS[id], n = d.perks[id], cost = DBR.Meta.perkCost(d, id), pips = '';
        for (var i = 0; i < pk.cost.length; i++) pips += i < n ? '■' : '□';
        return pk.name + ' ' + pips + (cost < 0 ? '  MAX' : '  ' + cost + ' orbes');
      },
      act: function () { if (DBR.Meta.buyPerk(DBR.App.save, id)) { DBR.App.persist(); sfx('power'); } else sfx('deny'); }
    };
  }).concat([{ label: 'Retour', act: function () { UI.go('title'); } }]);
  S.dojo = {
    update: function () { menuUpdate(dojoItems, 150, function () { UI.go('title'); }); },
    draw: function () {
      backdrop('DOJO', 'Dépense tes Orbes du Dragon en bonus permanents');
      orbCount();
      menuDraw(dojoItems, 150);
      if (UI.sel < DBR.PERK_ORDER.length) R.label(R.ctx, DBR.PERKS[DBR.PERK_ORDER[UI.sel]].desc, W / 2, 420, '#ffffff', 13, 'center');
      R.label(R.ctx, 'Orbes : 1 par salle nettoyée, 4 par boss vaincu, 30 pour une victoire.', W / 2, 446, '#b8c0d0', 11, 'center');
    }
  };

  /* ---------- Réglages ---------- */
  function vol(key, d) { var s = DBR.App.save.settings; s[key] = Math.round(Math.max(0, Math.min(1, s[key] + d * 0.1)) * 10) / 10; DBR.App.applySettings(); DBR.App.persist(); }
  var setItems = [
    { label: function () { return 'Effets sonores : ' + Math.round(DBR.App.save.settings.sfx * 100) + ' %'; }, adj: function (d) { vol('sfx', d); } },
    { label: function () { return 'Musique : ' + Math.round(DBR.App.save.settings.music * 100) + ' %'; }, adj: function (d) { vol('music', d); } },
    { label: function () { return 'Difficulté : ' + DBR.DIFFICULTIES[DBR.App.save.settings.difficulty].name; }, adj: function (d) { var s = DBR.App.save.settings; s.difficulty = (s.difficulty + d + 3) % 3; DBR.App.persist(); } },
    { label: function () { return 'Secousses d\'écran : ' + (DBR.App.save.settings.shake ? 'oui' : 'non'); }, adj: function () { var s = DBR.App.save.settings; s.shake = !s.shake; DBR.App.applySettings(); DBR.App.persist(); } },
    { label: 'Effacer la sauvegarde', act: function () { if (window.confirm('Effacer toute la progression (orbes, déblocages, bonus) ?')) { DBR.App.save = DBR.Meta.defaults(); DBR.App.applySettings(); DBR.App.persist(); } } },
    { label: 'Retour', act: function () { UI.go(UI.back || 'title'); } }
  ];
  S.settings = {
    update: function () { menuUpdate(setItems, 150, function () { UI.go(UI.back || 'title'); }); },
    draw: function () {
      backdrop('RÉGLAGES', '←/→ pour modifier une valeur');
      menuDraw(setItems, 150);
      R.label(R.ctx, 'La difficulté s\'applique au prochain run (dégâts subis ×' + DBR.DIFFICULTIES[DBR.App.save.settings.difficulty].mul + ').', W / 2, 420, '#b8c0d0', 11, 'center');
    }
  };

  /* ---------- Crédits ---------- */
  var credItems = [{ label: 'Retour', act: function () { UI.go('title'); } }];
  var CREDITS = [
    ['Dragon Roguelike', '#ff9a2e', 20], ['', '', 8],
    ['Conception, direction et réalisation', '#b8c0d0', 12], ['Charles GRATIAS', '#ffffff', 18], ['', '', 8],
    ['Code, pixel art, effets, sons et musique', '#b8c0d0', 12], ['100 % générés par le code — aucun fichier externe', '#ffffff', 13], ['JavaScript vanilla · Canvas 2D · WebAudio', '#ffffff', 13], ['', '', 8],
    ['Hommage à l\'œuvre d\'Akira Toriyama', '#ffd23e', 13], ['', '', 8],
    ['Fan game non commercial, non affilié à', '#b8c0d0', 12], ['Bird Studio / Shueisha / Toei Animation.', '#b8c0d0', 12], ['Dragon Ball et ses personnages appartiennent à leurs ayants droit.', '#b8c0d0', 12]
  ];
  S.credits = {
    update: function () { menuUpdate(credItems, 440, function () { UI.go('title'); }); },
    draw: function () {
      backdrop('CRÉDITS');
      var y = 126;
      for (var i = 0; i < CREDITS.length; i++) { var l = CREDITS[i]; if (l[0]) R.label(R.ctx, l[0], W / 2, y, l[1], l[2], 'center'); y += l[2] + 8; }
      menuDraw(credItems, 440);
    }
  };

  /* ---------- Pause ---------- */
  var pauseItems = [
    { label: 'Reprendre', act: function () { DBR.App.state = 'play'; } },
    { label: 'Réglages', act: function () { UI.back = 'pause'; UI.go('settings'); } },
    { label: 'Abandonner le run', act: function () { var g = DBR.App.game; g.over = true; g.phase = 'dead'; DBR.App.finishRun(); } }
  ];
  S.pause = {
    overGame: true,
    update: function () { if (In.hit('KeyP')) { DBR.App.state = 'play'; return; } menuUpdate(pauseItems, 200, function () { DBR.App.state = 'play'; }); },
    draw: function () {
      var c = R.ctx, g = DBR.App.game, p = g.player, counts = {}, ids = [], i;
      c.fillStyle = 'rgba(5,5,15,0.75)'; c.fillRect(0, 0, W, H);
      R.label(c, 'PAUSE', W / 2, 150, '#ffd23e', 36, 'center');
      R.label(c, 'Graine du run : ' + g.seed, W / 2, 176, '#b8c0d0', 11, 'center');
      for (i = 0; i < p.upgrades.length; i++) { if (!counts[p.upgrades[i]]) ids.push(p.upgrades[i]); counts[p.upgrades[i]] = (counts[p.upgrades[i]] || 0) + 1; }
      R.label(c, 'AMÉLIORATIONS', 40, 70, '#ffffff', 12);
      for (i = 0; i < ids.length && i < 24; i++) { var u = DBR.UPGRADES[ids[i]]; R.label(c, u.name + (counts[ids[i]] > 1 ? ' ×' + counts[ids[i]] : ''), 40, 90 + i * 16, DBR.RARITY[u.rar].color, 11); }
      if (!ids.length) R.label(c, 'aucune pour l\'instant', 40, 90, '#8088a0', 11);
      menuDraw(pauseItems, 200);
    }
  };

  /* ---------- Fin de run : défaite ou victoire ---------- */
  var endItems = [
    { label: 'Rejouer', act: function () { DBR.App.startRun(DBR.App.charId); } },
    { label: 'Changer de personnage', act: function () { UI.go('select'); } },
    { label: 'Menu principal', act: function () { UI.go('title'); } }
  ];
  function endScreen(win) {
    return {
      overGame: true,
      update: function () { menuUpdate(endItems, 404); },
      draw: function () {
        var c = R.ctx, App = DBR.App, g = App.game, st = g.stats, room = g.rooms[g.roomIndex];
        c.fillStyle = win ? 'rgba(20,16,4,0.86)' : 'rgba(15,4,4,0.86)'; c.fillRect(0, 0, W, H);
        c.font = 'bold 48px monospace'; c.textAlign = 'center';
        c.fillStyle = '#000000'; c.fillText(win ? 'VICTOIRE !' : 'DÉFAITE', W / 2 + 3, 73);
        c.fillStyle = win ? '#ffd23e' : '#ff5050'; c.fillText(win ? 'VICTOIRE !' : 'DÉFAITE', W / 2, 70);
        R.label(c, win ? 'Boo est vaincu : la Terre est sauvée. Merci d\'avoir joué !' : 'Mort définitive… mais tes Orbes du Dragon sont conservés.', W / 2, 100, '#ffffff', 13, 'center');
        if (win) for (var i = 0; i < 7; i++) orb(W / 2 - 108 + i * 36, 124 + Math.round(Math.sin(R.t * 3 + i) * 3), 10, i + 1);
        var rows = [
          ['Personnage', DBR.CHARS[g.player.char].name], ['Salle atteinte', (g.roomIndex + 1) + ' / ' + g.rooms.length + ' — ' + DBR.BIOMES[room.biome].name],
          ['Temps', fmtTime(g.time)], ['Éliminations', st.kills], ['Boss vaincus', st.bosses],
          ['Dégâts infligés / subis', st.dmgDealt + ' / ' + st.dmgTaken], ['Zeni récoltés', st.zeni], ['Améliorations', g.player.upgrades.length], ['Graine', g.seed]
        ], y0 = win ? 160 : 140;
        for (var k = 0; k < rows.length; k++) { R.label(c, rows[k][0], W / 2 - 16, y0 + k * 20, '#b8c0d0', 13, 'right'); R.label(c, String(rows[k][1]), W / 2 + 16, y0 + k * 20, '#ffffff', 13, 'left'); }
        orb(W / 2 - 118, y0 + 196, 10, 4);
        R.label(c, '+' + App.earned + ' orbes  (total : ' + App.save.orbs + ')', W / 2 + 10, y0 + 201, '#ffd23e', 15, 'center');
        R.label(c, 'Un jeu de Charles GRATIAS — fan game non commercial', W / 2, 392, '#b8c0d0', 11, 'center');
        menuDraw(endItems, 404);
      }
    };
  }
  S.gameover = endScreen(false);
  S.victory = endScreen(true);
})();
