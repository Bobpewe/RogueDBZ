/*
 * Dragon Roguelike — fan game non commercial
 * Auteur : Charles GRATIAS
 * tests/smoke.js : tests de fumée sous Node, sans dépendance.  Lancer : node tests/smoke.js
 */
'use strict';
var path = require('path'), fs = require('fs');
var CORE = ['rng', 'data', 'upgrades', 'game', 'combat', 'enemies', 'bosses', 'run', 'meta'];
CORE.forEach(function (f) {
  var p = path.join(__dirname, '..', 'src', 'core', f + '.js');
  if (fs.existsSync(p)) require(p);
});
var DBR = globalThis.DBR;

var passed = 0, failed = 0;
function test(name, fn) {
  var t0 = Date.now();
  try { var info = fn(); passed++; console.log('  OK   ' + name + (info ? ' — ' + info : '') + ' (' + (Date.now() - t0) + ' ms)'); }
  catch (e) { failed++; console.log('  FAIL ' + name + '\n       ' + (e && e.stack || e)); }
}
function assert(c, msg) { if (!c) throw new Error('Assertion : ' + msg); }

console.log('== Dragon Roguelike — tests de fumée ==');

test('chargement de la logique sans DOM', function () {
  assert(typeof DBR.createGame === 'function' && typeof DBR.step === 'function', 'API manquante');
  assert(typeof window === 'undefined', 'ne doit pas dépendre de window');
});

test('RNG déterministe', function () {
  var a = new DBR.RNG(42), b = new DBR.RNG(42), c = new DBR.RNG(43), same = true, diff = false;
  for (var i = 0; i < 100; i++) { var x = a.next(); if (x !== b.next()) same = false; if (x !== c.next()) diff = true; assert(x >= 0 && x < 1, 'hors [0,1['); }
  assert(same && diff, 'graine non respectée');
});

/** Entrée pseudo-aléatoire mais déterministe pour secouer la simulation. */
function noiseInput(r, g) {
  return { mx: r.int(-1, 1), my: r.int(-1, 1), ax: r.range(0, DBR.W), ay: r.range(0, DBR.H), fire: r.chance(0.7), dash: r.chance(0.1), special: r.chance(0.05), ultra: r.chance(0.05), interact: r.chance(0.2) };
}
function snapshot(g) { var p = g.player; return [g.frame, p.x.toFixed(3), p.y.toFixed(3), p.hp.toFixed(2), g.enemies.length, g.bullets.length, g.roomIndex | 0].join('|'); }

test('600 frames sans exception, joueur dans la salle', function () {
  var g = DBR.createGame({ seed: 7 }), r = new DBR.RNG(1);
  for (var i = 0; i < 600 && !g.over; i++) {
    DBR.step(g, noiseInput(r, g));
    if (g.phase === 'reward' && DBR.chooseUpgrade) DBR.chooseUpgrade(g, 0);
    var p = g.player;
    assert(isFinite(p.x) && isFinite(p.y), 'position invalide');
    assert(p.x >= DBR.WALL && p.x <= DBR.W - DBR.WALL && p.y >= DBR.WALL && p.y <= DBR.H - DBR.WALL, 'joueur hors de la salle');
    g.events.length = 0;
  }
  return 'frame ' + g.frame;
});

test('même graine + mêmes entrées = même état', function () {
  function run() {
    var g = DBR.createGame({ seed: 99 }), r = new DBR.RNG(5);
    for (var i = 0; i < 900 && !g.over; i++) { DBR.step(g, noiseInput(r, g)); if (g.phase === 'reward' && DBR.chooseUpgrade) DBR.chooseUpgrade(g, 0); g.events.length = 0; }
    return snapshot(g);
  }
  var a = run(), b = run();
  assert(a === b, 'divergence : ' + a + ' vs ' + b);
  return a;
});

/* ---------- Combat (M2) ---------- */
test('combat : tirs, dégâts, mort des ennemis, butin', function () {
  var g = DBR.createGame({ seed: 3, noRun: true });
  ['wolf', 'soldier', 'brute', 'tamer'].forEach(function (k, i) { DBR.spawnEnemy(g, k, 200 + i * 150, 120, { spawnT: 0 }); });
  g.player.dmg = 200; g.player.hp = g.player.maxHp = 1e6;
  for (var i = 0; i < 1800 && g.enemies.length; i++) {
    var e = g.enemies[0];
    DBR.step(g, { ax: e.x, ay: e.y, fire: true, dash: i % 90 === 0, special: i % 200 === 0, mx: Math.sin(i / 40), my: 0 });
    g.events.length = 0;
  }
  assert(g.enemies.length === 0, 'ennemis restants : ' + g.enemies.length);
  assert(g.stats.kills >= 4 && g.stats.dmgDealt > 0, 'stats de combat');
  g.phase = 'open';   // salle nettoyée : le butin est aimanté vers le joueur
  for (i = 0; i < 300; i++) DBR.step(g, {});
  assert(g.player.zeni > 0, 'aucun Zeni ramassé');
  return g.stats.kills + ' éliminations, ' + g.player.zeni + ' Zeni';
});

test('combat : dash invulnérable, Ki consommé, ultime, mort définitive', function () {
  var g = DBR.createGame({ seed: 4, noRun: true }), p = g.player;
  DBR.step(g, { dash: true, mx: 1 });
  assert(p.dashT > 0 && p.invuln > 0, 'dash sans invulnérabilité');
  assert(DBR.hurtPlayer(g, 10) === false && p.hp === p.maxHp, 'touché pendant le dash');
  for (var i = 0; i < 60; i++) DBR.step(g, {});
  var ki = p.ki; DBR.step(g, { special: true, ax: 0, ay: 0 });
  assert(p.ki < ki && g.beams.length === 1, 'spécial non lancé');
  p.ultra = 100; for (i = 0; i < 70; i++) DBR.step(g, {});
  DBR.step(g, { ultra: true });
  assert(p.ultraT > 0 && DBR.playerDamage(g, p) > p.dmg, 'transformation inactive');
  p.invuln = 0; DBR.hurtPlayer(g, 99999);
  assert(g.over && g.phase === 'dead' && p.hp === 0, 'la mort doit terminer le run');
  var f = g.frame; DBR.step(g, {}); assert(g.frame === f, 'la simulation doit se figer après la mort');
});

/* ---------- IA de test : joue « correctement » sans tricher ---------- */
var W = DBR.W, H = DBR.H, WALL = DBR.WALL;
function botInput(g) {
  var p = g.player, inp = { mx: 0, my: 0, ax: p.x, ay: p.y - 50, fire: false, dash: false, special: false, ultra: false, interact: false };
  var fx = 0, fy = 0, i, d, e, danger = false;
  function push(x, y, w) { var dx = p.x - x, dy = p.y - y, l = Math.sqrt(dx * dx + dy * dy) || 1; fx += dx / l * w; fy += dy / l * w; }
  if (g.phase === 'open') {                     // hors combat : objets utiles puis porte
    var tx = W / 2, ty = WALL, best = 1e9;
    for (i = 0; i < g.props.length; i++) {
      var o = g.props[i];
      if (o.used || (o.cost && o.cost > p.zeni) || (o.kind === 'senzu' && p.hp >= p.maxHp) || (o.kind === 'shopHeal' && p.hp > p.maxHp * 0.7)) continue;
      d = DBR.U.dist(p.x, p.y, o.x, o.y);
      if (d < best) { best = d; tx = o.x; ty = o.y; }
    }
    d = DBR.U.dist(p.x, p.y, tx, ty) || 1;
    inp.mx = (tx - p.x) / d; inp.my = (ty - p.y) / d; inp.interact = g.frame % 20 < 10;
    if (ty === WALL && Math.abs(tx - p.x) < 20) { inp.mx = 0; inp.my = -1; }
    return inp;
  }
  var t = DBR.nearestEnemy(g, p.x, p.y, 1e9);
  if (t) {
    d = DBR.U.dist(p.x, p.y, t.x, t.y);
    inp.ax = t.x; inp.ay = t.y; inp.fire = true;
    inp.special = p.ki >= p.specialCost && g.frame % 2 === 0;
    inp.ultra = p.ultra >= 100 && g.frame % 2 === 0;
    var want = t.def.boss ? 250 : 210;         // garde ses distances et tourne autour de la cible
    var k = (d - want) / 100, dx = (t.x - p.x) / d, dy = (t.y - p.y) / d;
    fx += dx * k - dy * 0.6; fy += dy * k + dx * 0.6;
  }
  for (i = 0; i < g.enemies.length; i++) {      // s'écarte des ennemis proches
    e = g.enemies[i]; d = DBR.U.dist(p.x, p.y, e.x, e.y);
    if (d < 150) { push(e.x, e.y, (150 - d) / 50); if (e.state === 'windup' && d < 90) danger = true; }
    if ((e.state === 'windup' || e.state === 'dash') && (e.def.ai === 'charger' || e.atk === 'charge')) {   // sort de l'axe de charge
      var ex = e.x + Math.cos(e.ang) * 500, ey = e.y + Math.sin(e.ang) * 500;
      if (DBR.U.segDist(p.x, p.y, e.x, e.y, ex, ey) < 50) { fx += -Math.sin(e.ang) * 3; fy += Math.cos(e.ang) * 3; if (e.state === 'dash' && d < 120) danger = true; }
    }
  }
  for (i = 0; i < g.bullets.length; i++) {      // esquive les tirs ennemis
    var b = g.bullets[i];
    if (b.owner !== 'e') continue;
    d = DBR.U.dist(p.x, p.y, b.x, b.y);
    if (d < 110) {
      var sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy) || 1, nx = -b.vy / sp, ny = b.vx / sp;
      var side = ((p.x - b.x) * nx + (p.y - b.y) * ny) >= 0 ? 1 : -1;
      var w = (110 - d) / 30; fx += nx * side * w; fy += ny * side * w;
      if (d < 34) danger = true;
    }
  }
  for (i = 0; i < g.zones.length; i++) {        // sort des zones d'impact
    var z = g.zones[i]; d = DBR.U.dist(p.x, p.y, z.x, z.y);
    if (z.owner === 'e' && d < z.r + 40) { push(z.x, z.y, 4); if (z.warn < 0.25 && d < z.r + 6) danger = true; }
  }
  for (i = 0; i < g.beams.length; i++) {        // s'écarte des rayons
    var bm = g.beams[i];
    if (bm.owner !== 'e') continue;
    var bx = bm.x + Math.cos(bm.ang) * bm.len, by = bm.y + Math.sin(bm.ang) * bm.len;
    if (DBR.U.segDist(p.x, p.y, bm.x, bm.y, bx, by) < bm.w / 2 + 50) {
      var sd = (-(p.x - bm.x) * Math.sin(bm.ang) + (p.y - bm.y) * Math.cos(bm.ang)) >= 0 ? 1 : -1;
      fx += -Math.sin(bm.ang) * sd * 4; fy += Math.cos(bm.ang) * sd * 4;
      if (bm.warn < 0.2) danger = true;
    }
  }
  for (i = 0; i < g.obstacles.length; i++) { var ob = g.obstacles[i]; d = DBR.U.dist(p.x, p.y, ob.x, ob.y); if (d < ob.r + 40) push(ob.x, ob.y, 1.5); }
  // reste à l'écart des murs
  if (p.x < 130) fx += (130 - p.x) / 40; if (p.x > W - 130) fx -= (p.x - W + 130) / 40;
  if (p.y < 120) fy += (120 - p.y) / 40; if (p.y > H - 120) fy -= (p.y - H + 120) / 40;
  var l = Math.sqrt(fx * fx + fy * fy);
  if (l > 0.05) { inp.mx = fx / l; inp.my = fy / l; }
  inp.dash = danger && p.dashCd <= 0 && g.frame % 2 === 0;
  return inp;
}
/** Choix d'amélioration de l'IA : la plus rare proposée. */
function botChoose(g) {
  var best = 0;
  for (var i = 1; i < g.choice.length; i++) if (DBR.UPGRADES[g.choice[i]].rar > DBR.UPGRADES[g.choice[best]].rar) best = i;
  DBR.chooseUpgrade(g, best);
}
/** Joue un run entier avec l'IA. Retourne la partie terminée (ou interrompue à maxFrames). */
function playRun(opts, maxFrames, idle) {
  var g = DBR.createGame(opts), n = 0;
  while (!g.over && n++ < maxFrames) {
    if (g.phase === 'reward') botChoose(g);
    DBR.step(g, idle ? {} : botInput(g));
    g.events.length = 0;
  }
  return g;
}
function fmt(g) { return 'salle ' + (g.roomIndex + 1) + '/' + g.rooms.length + ', ' + (g.time / 60).toFixed(1) + ' min simulées, ' + g.stats.kills + ' éliminations, PV ' + Math.ceil(g.player.hp) + '/' + g.player.maxHp; }

/* ---------- Progression (M3) ---------- */
test('run : plan des salles reproductible par la graine', function () {
  var a = DBR.createGame({ seed: 123 }), b = DBR.createGame({ seed: 123 }), c = DBR.createGame({ seed: 124 });
  var ka = a.rooms.map(function (r) { return r.kind + r.seed; }).join(','), kb = b.rooms.map(function (r) { return r.kind + r.seed; }).join(',');
  assert(ka === kb, 'plan différent pour la même graine');
  assert(ka !== c.rooms.map(function (r) { return r.kind + r.seed; }).join(','), 'plan identique pour deux graines');
  assert(a.rooms.length === DBR.BIOMES.length * 6, 'nombre de salles');
  return a.rooms.length + ' salles';
});

test('run : l\'IA nettoie la première salle et franchit la porte', function () {
  var g = DBR.createGame({ seed: 11 }), n = 0;
  g.player.hp = g.player.maxHp = 5000;
  while (g.roomIndex < 2 && !g.over && n++ < 60 * 240) { if (g.phase === 'reward') botChoose(g); DBR.step(g, botInput(g)); g.events.length = 0; }
  assert(g.roomIndex >= 2, 'bloqué en ' + fmt(g) + ' phase=' + g.phase);
  return fmt(g);
});

/* ---------- Améliorations et objets (M4) ---------- */
test('améliorations : chacune s\'applique sans erreur et reste jouable', function () {
  var ids = DBR.UPGRADE_IDS, rar = [0, 0, 0];
  assert(ids.length >= 20, 'il faut ~20 améliorations, trouvé ' + ids.length);
  ids.forEach(function (id) { rar[DBR.UPGRADES[id].rar]++; });
  assert(rar[0] && rar[1] && rar[2], 'les 3 raretés doivent exister');
  var g = DBR.createGame({ seed: 21 });
  g.player.hp = g.player.maxHp = 1e6;
  ids.forEach(function (id) { DBR.applyUpgrade(g, id); DBR.applyUpgrade(g, id); });   // tout cumulé deux fois
  var p = g.player;
  ['dmg', 'speed', 'fireRate', 'kiMax', 'range', 'dashMax', 'specialCost'].forEach(function (k) { assert(isFinite(p[k]) && p[k] > 0, 'stat invalide : ' + k); });
  for (var i = 0; i < 1200 && !g.over; i++) { if (g.phase === 'reward') botChoose(g); DBR.step(g, botInput(g)); g.events.length = 0; }
  assert(g.stats.kills > 0, 'aucune élimination avec le build complet');
  return ids.length + ' améliorations (' + rar[0] + ' communes, ' + rar[1] + ' rares, ' + rar[2] + ' légendaires), toutes combinées';
});

test('récompense : 3 choix distincts, le choix rouvre la porte', function () {
  var g = DBR.createGame({ seed: 31 });
  g.choice = DBR.rollChoices(g, 0); g.phase = 'reward';
  assert(g.choice.length === 3 && new Set(g.choice).size === 3, 'choix invalides : ' + g.choice);
  var f = g.frame; DBR.step(g, { mx: 1 }); assert(g.frame === f, 'la simulation doit attendre le choix');
  var id = g.choice[1]; assert(DBR.chooseUpgrade(g, 1), 'choix refusé');
  assert(g.phase === 'open' && g.player.upgrades[0] === id, 'amélioration non appliquée');
  return DBR.UPGRADES[id].name;
});

test('salles spéciales : Senzu, coffre et boutique', function () {
  var g = DBR.createGame({ seed: 41 }), p = g.player, room = { kind: 'heal', biome: 0 };
  function setup(kind) { g.props = []; g.phase = 'open'; room.kind = kind; DBR.setupSpecial(g, room, g.rng); }
  setup('heal'); p.hp = 10; p.x = g.props[0].x; p.y = g.props[0].y; DBR.stepProps(g, {}, DBR.DT);
  assert(p.hp === 60 && g.props[0].used, 'le Senzu doit rendre 50 % des PV');
  setup('treasure'); p.x = g.props[0].x; p.y = g.props[0].y; DBR.stepProps(g, {}, DBR.DT);
  assert(g.phase === 'reward' && g.choice.length === 3, 'le coffre doit proposer un choix'); DBR.chooseUpgrade(g, 0);
  setup('shop'); var it = g.props[0]; p.x = it.x; p.y = it.y; p.zeni = 0; p.prev = {};
  DBR.stepProps(g, { interact: true }, DBR.DT); assert(!it.used, 'achat sans Zeni');
  p.zeni = it.cost + 5; var n = p.upgrades.length; DBR.stepProps(g, { interact: true }, DBR.DT);
  assert(it.used && p.zeni === 5 && p.upgrades.length === n + 1, 'achat non effectué');
  return 'OK';
});

/* __TESTS_SUIVANTS__ */

console.log('== ' + passed + ' réussi(s), ' + failed + ' échec(s) ==');
process.exit(failed ? 1 : 0);
