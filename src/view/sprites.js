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
