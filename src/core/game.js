/*
 * Dragon Roguelike — fan game non commercial
 * Auteur : Charles GRATIAS
 * game.js : cœur de la simulation (état du jeu, joueur, pas de temps fixe).
 * AUCUN accès au DOM : ce fichier tourne tel quel sous Node (voir tests/smoke.js).
 *
 * Contrat : DBR.createGame(opts) -> g ; DBR.step(g, input) avance d'un pas de 1/60 s.
 * input = { mx, my, ax, ay, fire, dash, special, ultra, interact }
 *   (mx,my) direction de déplacement, (ax,ay) point visé en coordonnées monde.
 * La simulation publie des événements dans g.events ; la vue les lit puis vide le tableau.
 */
(function () {
  'use strict';
  var DBR = (typeof window !== 'undefined') ? (window.DBR = window.DBR || {}) : (globalThis.DBR = globalThis.DBR || {});
  var U = DBR.U;

  DBR.W = 960;      // largeur du monde (= écran)
  DBR.H = 540;      // hauteur du monde
  DBR.WALL = 32;    // épaisseur des murs
  DBR.DT = 1 / 60;  // pas de temps fixe

  /** Publie un événement destiné à la vue (sons, particules, secousses...). */
  DBR.emit = function (g, t, x, y, extra) {
    var e = extra || {};
    e.t = t; e.x = x; e.y = y;
    if (g.events.length < 400) g.events.push(e);
  };

  /** Crée le joueur à partir de la fiche de personnage et des bonus permanents (méta). */
  DBR.makePlayer = function (charId, perks) {
    var c = DBR.CHARS[charId] || DBR.CHARS.goku;
    perks = perks || {};
    var p = {
      char: c.id, x: DBR.W / 2, y: DBR.H - 90, r: 11, aim: -Math.PI / 2, moving: false,
      hp: c.hp, maxHp: c.hp, ki: c.kiMax, kiMax: c.kiMax, kiRegen: c.kiRegen, regen: c.regen || 0,
      speed: c.speed, dmg: c.dmg, fireRate: c.fireRate, bulletSpeed: c.bulletSpeed, range: c.range,
      // Modificateurs apportés par les améliorations (voir upgrades.js)
      multishot: 1, pierce: 0, homing: 0, bounce: 0, explode: 0, crit: 0, lifesteal: 0,
      dmgTaken: 1, zeniMul: 1, aura: 0, rage: 0, afterimage: 0, counter: 0, revive: 0,
      specialCost: 40, specialMul: 1, zenkai: 0, ultraGain: 1,
      // État instantané
      fireCd: 0, dashCd: 0, dashMax: 0.9, dashT: 0, dashX: 0, dashY: 0, invuln: 0, counterT: 0,
      specialT: 0, ultra: 0, ultraT: 0, ultraDur: 10, ultraDmg: c.ultraDmg || 1.5,
      zeni: 0, upgrades: [], flash: 0, prev: {}
    };
    // Bonus permanents achetés au Dojo (voir meta.js)
    if (perks.hp) { p.maxHp += 10 * perks.hp; p.hp = p.maxHp; }
    if (perks.dmg) p.dmg *= 1 + 0.05 * perks.dmg;
    if (perks.ki) { p.kiMax += 10 * perks.ki; p.ki = p.kiMax; p.kiRegen *= 1 + 0.05 * perks.ki; }
    if (perks.zeni) p.zeni = 25 * perks.zeni;
    if (perks.ultra) p.ultra = Math.min(100, 20 * perks.ultra);
    return p;
  };

  /** Crée une partie. opts = { seed, charId, perks, difficulty, noRun } */
  DBR.createGame = function (opts) {
    opts = opts || {};
    var seed = (opts.seed >>> 0) || 12345;
    var g = {
      seed: seed, rng: new DBR.RNG(seed), frame: 0, time: 0, events: [],
      difficulty: opts.difficulty || 1,   // multiplicateur des dégâts subis
      phase: 'combat',                    // combat | reward | open | dead | victory
      over: false, won: false,
      player: DBR.makePlayer(opts.charId, opts.perks),
      enemies: [], bullets: [], beams: [], zones: [], pickups: [], props: [], obstacles: [],
      stats: { kills: 0, dmgDealt: 0, dmgTaken: 0, rooms: 0, zeni: 0, bosses: 0 }
    };
    // opts.noRun : partie « bac à sable » sans salles (utilisée par les tests unitaires)
    if (DBR.buildRun && !opts.noRun) { DBR.buildRun(g); DBR.enterRoom(g, 0); }
    return g;
  };

  /** Empêche un cercle de sortir de la salle ou de traverser un obstacle. */
  DBR.collideWorld = function (g, o) {
    var m = DBR.WALL + o.r;
    o.x = U.clamp(o.x, m, DBR.W - m);
    o.y = U.clamp(o.y, m, DBR.H - m);
    for (var i = 0; i < g.obstacles.length; i++) {
      var ob = g.obstacles[i], dx = o.x - ob.x, dy = o.y - ob.y, d = Math.sqrt(dx * dx + dy * dy), min = o.r + ob.r;
      if (d < min) {
        if (d < 0.001) { dx = 1; dy = 0; d = 1; }
        o.x = ob.x + dx / d * min; o.y = ob.y + dy / d * min;
      }
    }
  };

  /** Déplacement et visée du joueur. */
  function stepPlayerMove(g, p, inp, dt) {
    var mx = inp.mx || 0, my = inp.my || 0, l = Math.sqrt(mx * mx + my * my);
    if (l > 1) { mx /= l; my /= l; }
    p.moving = l > 0.1;
    if (inp.ax !== undefined && (inp.ax !== p.x || inp.ay !== p.y)) p.aim = Math.atan2(inp.ay - p.y, inp.ax - p.x);
    var sp = DBR.playerSpeed ? DBR.playerSpeed(g, p) : p.speed;
    if (p.dashT > 0) {           // pendant le dash, la direction est verrouillée
      p.x += p.dashX * sp * 3.4 * dt; p.y += p.dashY * sp * 3.4 * dt;
    } else {
      p.x += mx * sp * dt; p.y += my * sp * dt;
    }
    DBR.collideWorld(g, p);
    return { mx: mx, my: my, l: l };
  }
  DBR._stepPlayerMove = stepPlayerMove;

  /** Avance la simulation d'un pas fixe. */
  DBR.step = function (g, inp) {
    inp = inp || {};
    var dt = DBR.DT, p = g.player;
    if (g.over || g.phase === 'reward') return;   // figé pendant le choix d'amélioration
    g.frame++; g.time += dt;
    var mv = stepPlayerMove(g, p, inp, dt);
    if (DBR.stepCombat) DBR.stepCombat(g, p, inp, mv, dt);
    if (DBR.stepRoom) DBR.stepRoom(g, inp, dt);
    p.prev = { dash: !!inp.dash, special: !!inp.special, ultra: !!inp.ultra, interact: !!inp.interact };
  };
})();
