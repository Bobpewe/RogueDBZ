/*
 * Dragon Roguelike — fan game non commercial
 * Auteur : Charles GRATIAS
 * main.js : point d'entrée navigateur. Boucle à pas de temps fixe (1/60 s) avec accumulateur,
 * découplée du rafraîchissement de l'écran.
 */
(function () {
  'use strict';
  var DBR = window.DBR;
  var App = DBR.App = { state: 'play', game: null, hitstop: 0, acc: 0, last: 0 };

  /** Démarre un nouveau run. */
  App.startRun = function (charId, seed) {
    App.game = DBR.createGame({ seed: seed || ((Math.random() * 4294967295) >>> 0), charId: charId || 'goku' });
    App.state = 'play';
    var g = App.game;
    if (!DBR.enterRoom) {   // démo M2 : quelques ennemis tant que les salles n'existent pas
      ['wolf', 'wolf', 'soldier', 'brute', 'tamer'].forEach(function (k, i) { DBR.spawnEnemy(g, k, 200 + i * 140, 120); });
    }
  };

  function frame(now) {
    var dt = Math.min(0.1, (now - App.last) / 1000);   // plafonné : pas de spirale après une pause d'onglet
    App.last = now;
    App.acc += dt;
    while (App.acc >= DBR.DT) {
      App.acc -= DBR.DT;
      if (App.update) App.update();                     // menus + jeu (défini par ui.js)
      else if (App.hitstop > 0) App.hitstop--;
      else {
        DBR.step(App.game, DBR.Input.gameInput(App.game));
        DBR.Render.consume(App.game, App);
      }
      DBR.Input.endFrame();
    }
    if (App.draw) App.draw(); else DBR.Render.draw(App.game);
    requestAnimationFrame(frame);
  }

  window.addEventListener('load', function () {
    var cv = document.getElementById('game');
    DBR.Input.init(cv);
    DBR.Render.init(cv);
    if (App.boot) App.boot(); else App.startRun('goku');
    App.last = performance.now();
    requestAnimationFrame(frame);
  });
})();
