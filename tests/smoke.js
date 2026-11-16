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
  for (var i = 0; i < 600; i++) {
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
  var g = DBR.createGame({ seed: 3 });
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
  var g = DBR.createGame({ seed: 4 }), p = g.player;
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

/* __TESTS_SUIVANTS__ */

console.log('== ' + passed + ' réussi(s), ' + failed + ' échec(s) ==');
process.exit(failed ? 1 : 0);
