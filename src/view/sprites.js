/*
 * Dragon Roguelike — fan game non commercial
 * Auteur : Charles GRATIAS
 * sprites.js : pixel art généré par le code. Chaque sprite = lignes de caractères + palette.
 * '.' = transparent. Les sprites sont rendus une fois dans des canvas hors écran (cache).
 */
(function () {
  'use strict';
  var DBR = window.DBR = window.DBR || {};

  var DEFS = {};
  /** Déclare un sprite : rows = tableau de chaînes, pal = { caractère: couleur }. */
  function def(name, pal, rows) { DEFS[name] = { pal: pal, rows: rows }; }

  // Palette commune : K noir, s peau, w blanc, e œil
  def('goku', { K: '#16161d', s: '#f2c08c', e: '#16161d', o: '#f07a1c', b: '#2b4fb0', d: '#b3540f' }, [
    '....K..K...K....',
    '..K.KK.KK.KK....',
    '..KKKKKKKKKK.K..',
    '.KKKKKKKKKKKK...',
    '..KKKsKKsKKK....',
    '..KKssssssKK....',
    '...sesssses.....',
    '...ssssssss.....',
    '....ssssss......',
    '..oobbssbboo....',
    '.sooooooooos....',
    '.s.oooddooo.s...',
    '.b.oobbbboo.b...',
    '...ooo..ooo.....',
    '...ood..doo.....',
    '...bbb..bbb.....'
  ]);

  /* --- Ennemis de base (recolorés selon le biome via "swap") --- */
  // Bête à quatre pattes, vue de profil (regarde à droite)
  def('beast', { G: '#8d8f9c', D: '#5d5f6c', e: '#ff3030', w: '#ffffff', K: '#16161d' }, [
    '...........G.G..',
    '..........GGGGG.',
    'G........GGGeGGw',
    'GG..GGGGGGGGGGGK',
    '.GGGGGGGGGGGGww.',
    '..GGGGGGGGGGG...',
    '..GGGGGGGGGG....',
    '..GG.GG..GG.GG..',
    '..GG.GG..GG.GG..',
    '..DD.DD..DD.DD..'
  ]);
  // Soldat casqué avec pistolet
  def('soldier', { H: '#b33a3a', s: '#f2c08c', e: '#16161d', u: '#5a6a4a', G: '#2a2a33', b: '#2a2a33', K: '#16161d' }, [
    '....HHHHHH......',
    '...HHHHHHHH.....',
    '...HssssssH.....',
    '...sesssses.....',
    '...ssssssss.....',
    '....ssssss......',
    '...uuuuuuuu.....',
    '..uuuuuuuuuu.GG.',
    '..suuuuuuuusGGGG',
    '..s.uuuuuu.s.G..',
    '....uubbuu......',
    '....uu..uu......',
    '....uu..uu......',
    '....KK..KK......'
  ]);
  // Colosse
  def('brute', { H: '#3a2a1e', s: '#d9a070', e: '#16161d', a: '#a5653a', b: '#ffe066', p: '#4a4a5a', K: '#16161d' }, [
    '.....HHHHHH.....',
    '....HHHHHHHH....',
    '....sesssses....',
    '....ssssssss....',
    '..aaasssssaaa...',
    '.aaaaaaaaaaaaa..',
    'saaaaaaaaaaaaas.',
    'ss.aaaaaaaaa.ss.',
    'ss.aaabbbaaa.ss.',
    'ss.aaaaaaaaa.ss.',
    '...aaaaaaaaa....',
    '...ppp...ppp....',
    '...ppp...ppp....',
    '...ppp...ppp....',
    '...KKK...KKK....'
  ]);
  // Petit alien à grosse tête (Saibaman, Cell Jr...)
  def('imp', { g: '#5fae3c', v: '#3c7a26', R: '#e02020', w: '#ffffff', d: '#3c7a26' }, [
    '...gggggg...',
    '..gggggggg..',
    '.gggvggvggg.',
    '.gRRggggRRg.',
    '.gggggggggg.',
    '..ggwwwwgg..',
    '...gggggg...',
    '..gddddddg..',
    '.gg.dddd.gg.',
    '.g..dddd..g.',
    '....d..d....',
    '...gg..gg...'
  ]);
  // Robot / drone
  def('robot', { a: '#c9ccd6', m: '#7d8496', R: '#ff4040', d: '#444a5a' }, [
    '.....aa.....',
    '.....aa.....',
    '..mmmmmmmm..',
    '.mmmmmmmmmm.',
    '.mRRmmmmRRm.',
    '.mRRmmmmRRm.',
    '.mmmmmmmmmm.',
    '.mmddddddmm.',
    '..mmmmmmmm..',
    '.mm.mmmm.mm.',
    '.mm.m..m.mm.',
    '....m..m....',
    '...dd..dd...'
  ]);
  // Invocateur encapuchonné
  def('mage', { h: '#5b3f8a', K: '#16161d', e: '#ffe23e', s: '#f2c08c' }, [
    '.....hhhh.....',
    '....hhhhhh....',
    '...hhhhhhhh...',
    '...hKKKKKKh...',
    '...hKeKKeKh...',
    '...hhKKKKhh...',
    '..hhhhhhhhhh..',
    '.hhhhhhhhhhhh.',
    '.hhsshhhhsshh.',
    '..hhhhhhhhhh..',
    '..hhhhhhhhhh..',
    '..hhhhhhhhhh..',
    '.hhhhhhhhhhhh.',
    '.hhhhhhhhhhhh.'
  ]);

  var cache = {};
  /**
   * Retourne un canvas pour (nom, échelle, variante de palette, mode).
   * swap = { caractère: couleur } pour recolorer (ex. cheveux dorés du Super Saiyan).
   * white = true : silhouette blanche (flash de dégâts).
   */
  function get(name, scale, swap, white) {
    var key = name + '|' + scale + '|' + (swap ? JSON.stringify(swap) : '') + '|' + (white ? 1 : 0);
    if (cache[key]) return cache[key];
    var d = DEFS[name] || DEFS.goku, h = d.rows.length, w = 0, y, x;
    for (y = 0; y < h; y++) w = Math.max(w, d.rows[y].length);
    var c = document.createElement('canvas');
    c.width = w * scale; c.height = h * scale;
    var ctx = c.getContext('2d');
    for (y = 0; y < h; y++) for (x = 0; x < d.rows[y].length; x++) {
      var ch = d.rows[y][x];
      if (ch === '.' || ch === ' ') continue;
      ctx.fillStyle = white ? '#ffffff' : ((swap && swap[ch]) || d.pal[ch] || '#ff00ff');
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
    cache[key] = c;
    return c;
  }

  DBR.Sprites = { def: def, get: get, DEFS: DEFS };
})();
