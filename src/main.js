/*
 * Dragon Roguelike — fan game non commercial
 * Auteur : Charles GRATIAS
 * main.js : point d'entrée navigateur. Boucle à pas de temps fixe (1/60 s) avec accumulateur,
 * découplée du rafraîchissement de l'écran, et machine à états de l'application
 * (title, select, dojo, settings, credits, play, pause, gameover, victory).
 */
(function () {
  'use strict';
  var DBR = window.DBR, R = DBR.Render, In = DBR.Input, UI = DBR.UI, Audio = DBR.Audio;
  var App = DBR.App = { state: 'title', game: null, hitstop: 0, acc: 0, last: 0, save: null, charId: 'goku', seedText: '', endT: 0, earned: 0 };

  /** localStorage peut être indisponible (navigation privée, file:// restreint) : on s'en passe alors. */
  function storage() { try { return window.localStorage; } catch (e) { return null; } }
  App.persist = function () { DBR.Meta.save(storage(), App.save); };
  App.applySettings = function () {
    var s = App.save.settings;
    Audio.setVolumes(s.sfx, s.music);
    R.shakeOff = !s.shake;
  };

  /** Démarre un nouveau run. seed optionnelle (sinon graine saisie, sinon aléatoire). */
  App.startRun = function (charId, seed) {
    App.charId = charId || App.charId;
    var sd = seed !== undefined ? seed : (App.seedText ? DBR.hashSeed(App.seedText) : ((Math.random() * 4294967295) >>> 0));
    App.game = DBR.createGame({ seed: sd, charId: App.charId, perks: App.save.perks, difficulty: DBR.DIFFICULTIES[App.save.settings.difficulty].mul });
    App.state = 'play'; App.endT = 0; App.hitstop = 0;
    R.parts.length = 0; R.texts.length = 0; R.fade = 1;
  };

  /** Clôt le run : crédite les orbes, sauvegarde, affiche l'écran de fin. */
  App.finishRun = function () {
    App.earned = DBR.Meta.finishRun(App.save, App.game);
    App.persist();
    UI.go(App.game.won ? 'victory' : 'gameover');
  };

  /** Un pas logique (1/60 s). */
  App.update = function () {
    var g = App.game;
    if (App.state !== 'play') { UI.screens[App.state].update(); return; }
    if ((In.hit('Escape') || In.hit('KeyP')) && !g.over && g.phase !== 'reward') { UI.go('pause'); return; }
    if (g.over) {                                   // on laisse l'animation de fin se jouer
      R.consume(g, App);
      if (++App.endT > (g.won ? 170 : 110)) App.finishRun();
      return;
    }
    if (App.hitstop > 0) { App.hitstop--; return; } // hit-stop : la simulation se fige quelques images
    if (g.phase === 'reward') { UI.updateReward(g); return; }
    DBR.step(g, In.gameInput(g));
    R.consume(g, App);
    if (g.phase === 'reward') UI.openReward();
  };

  /** Musique selon le contexte. */
  function pickTrack() {
    var g = App.game, st = App.state;
    if (st === 'gameover') return 'calm';
    if (!g || (st !== 'play' && st !== 'pause' && !(st === 'settings' && UI.back === 'pause'))) return 'title';
    var room = g.room;
    if (room.kind === 'boss') return room.biome === DBR.BIOMES.length - 1 ? 'final' : 'boss';
    if (room.kind === 'miniboss') return 'boss';
    if (room.kind === 'shop' || room.kind === 'heal' || room.kind === 'treasure') return 'calm';
    return 'biome' + room.biome;
  }

  App.draw = function () {
    var scr = UI.screens[App.state], g = App.game;
    if (App.state === 'play' || (scr && scr.overGame)) {
      R.noReticle = App.state !== 'play' || g.phase === 'reward';
      R.draw(g);
      if (App.state === 'play' && g.phase === 'reward') UI.drawReward(g);
    }
    if (scr) scr.draw();
    Audio.setTrack(pickTrack());
    Audio.update();
  };

  function frame(now) {
    var dt = Math.min(0.1, (now - App.last) / 1000);   // plafonné : pas de spirale après une pause d'onglet
    App.last = now;
    App.acc += dt;
    while (App.acc >= DBR.DT) {
      App.acc -= DBR.DT;
      App.update();
      In.endFrame();
    }
    App.draw();
    requestAnimationFrame(frame);
  }

  window.addEventListener('load', function () {
    var cv = document.getElementById('game');
    In.init(cv);
    R.init(cv);
    App.save = DBR.Meta.load(storage());
    App.applySettings();
    // Mettre le jeu en pause quand l'onglet passe en arrière-plan
    document.addEventListener('visibilitychange', function () { if (document.hidden && App.state === 'play' && !App.game.over && App.game.phase !== 'reward') UI.go('pause'); });
    App.last = performance.now();
    requestAnimationFrame(frame);
  });
})();
