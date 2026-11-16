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

/* __TESTS_SUIVANTS__ */

console.log('== ' + passed + ' réussi(s), ' + failed + ' échec(s) ==');
process.exit(failed ? 1 : 0);
