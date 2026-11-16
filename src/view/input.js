/*
 * Dragon Roguelike — fan game non commercial
 * Auteur : Charles GRATIAS
 * input.js : clavier + souris. On lit les touches par position physique (event.code),
 * donc ZQSD (AZERTY) et WASD (QWERTY) fonctionnent sans réglage, ainsi que les flèches.
 */
(function () {
  'use strict';
  var DBR = window.DBR = window.DBR || {};

  var keys = {}, pressed = {}, mouse = { x: DBR.W / 2, y: DBR.H / 2, l: false, r: false, clicked: false, moved: 0 };
  var canvas = null;

  function init(cv) {
    canvas = cv;
    window.addEventListener('keydown', function (e) {
      if (!keys[e.code]) pressed[e.code] = true;
      keys[e.code] = true;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].indexOf(e.code) >= 0) e.preventDefault();
      if (DBR.Audio) DBR.Audio.unlock();
    });
    window.addEventListener('keyup', function (e) { keys[e.code] = false; });
    window.addEventListener('blur', function () { keys = {}; mouse.l = mouse.r = false; });
    cv.addEventListener('mousemove', function (e) { setMouse(e); mouse.moved = performance.now(); });
    cv.addEventListener('mousedown', function (e) {
      setMouse(e);
      if (e.button === 0) { mouse.l = true; mouse.clicked = true; }
      if (e.button === 2) mouse.r = true;
      if (DBR.Audio) DBR.Audio.unlock();
      e.preventDefault();
    });
    window.addEventListener('mouseup', function (e) {
      if (e.button === 0) mouse.l = false;
      if (e.button === 2) mouse.r = false;
    });
    cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  /** Convertit la position écran en coordonnées du canvas logique 960×540. */
  function setMouse(e) {
    var r = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) * DBR.W / r.width;
    mouse.y = (e.clientY - r.top) * DBR.H / r.height;
  }

  function down(code) { return !!keys[code]; }
  /** Vrai une seule fois par appui (consommé par endFrame). */
  function hit(code) { return !!pressed[code]; }
  function endFrame() { pressed = {}; mouse.clicked = false; }

  /** Construit l'entrée de simulation à partir de l'état clavier/souris. */
  function gameInput(g) {
    var mx = (down('KeyD') || down('ArrowRight') ? 1 : 0) - (down('KeyA') || down('ArrowLeft') ? 1 : 0);
    var my = (down('KeyS') || down('ArrowDown') ? 1 : 0) - (down('KeyW') || down('ArrowUp') ? 1 : 0);
    var ax = mouse.x, ay = mouse.y;
    // Jeu 100 % clavier (J/K) : si la souris est immobile depuis 2 s, visée automatique
    // sur l'ennemi le plus proche.
    var kb = (down('KeyJ') || down('KeyK')) && performance.now() - mouse.moved > 2000;
    if (kb && g && g.enemies && g.enemies.length) {
      var best = null, bd = 1e9, p = g.player;
      for (var i = 0; i < g.enemies.length; i++) {
        var e = g.enemies[i], d = DBR.U.dist(p.x, p.y, e.x, e.y);
        if (d < bd && !(e.spawnT > 0)) { bd = d; best = e; }
      }
      if (best) { ax = best.x; ay = best.y; mouse.x = ax; mouse.y = ay; }
    }
    return {
      mx: mx, my: my, ax: ax, ay: ay,
      fire: mouse.l || down('KeyJ'),
      dash: down('Space'),
      special: mouse.r || down('KeyK'),
      ultra: down('KeyF') || down('KeyL') || down('ShiftLeft'),
      interact: down('KeyE')
    };
  }

  DBR.Input = { init: init, down: down, hit: hit, endFrame: endFrame, mouse: mouse, gameInput: gameInput };
})();
