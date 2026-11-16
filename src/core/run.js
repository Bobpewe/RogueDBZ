/*
 * Dragon Roguelike — fan game non commercial
 * Auteur : Charles GRATIAS
 * run.js : structure d'un run. Génère la suite de salles (par biome), les obstacles,
 * les vagues d'ennemis, et gère le cycle : combat -> salle nettoyée -> récompense -> porte.
 */
(function () {
  'use strict';
  var DBR = (typeof window !== 'undefined') ? (window.DBR = window.DBR || {}) : (globalThis.DBR = globalThis.DBR || {});
  var U = DBR.U, W = DBR.W, H = DBR.H, WALL = DBR.WALL;

  /** Plan d'un biome : 6 salles. 'special' devient soin ou trésor. */
  var PLAN = ['combat', 'combat', 'special', 'miniboss', 'shop', 'boss'];
  DBR.ROOM_NAMES = { combat: 'Combat', miniboss: 'Mini-boss', boss: 'Boss', shop: 'Boutique', heal: 'Soin', treasure: 'Trésor' };

  /** Construit la liste complète des salles du run à partir de la graine. */
  DBR.buildRun = function (g) {
    var rooms = [], rng = g.rng;
    for (var b = 0; b < DBR.BIOMES.length; b++) {
      for (var i = 0; i < PLAN.length; i++) {
        var kind = PLAN[i], depth = rooms.length;
        if (kind === 'special') kind = rng.chance(0.5) ? 'heal' : 'treasure';
        rooms.push({
          idx: depth, biome: b, pos: i, kind: kind, depth: depth,
          hpMul: 1.5 + depth * 0.3, dmgMul: 1 + depth * 0.04,
          waves: [], wave: 0, waveT: 0, clearT: 0, seed: rng.int(1, 1e9)
        });
      }
    }
    g.rooms = rooms;
  };

  /** Compose une vague en dépensant un budget parmi les ennemis du biome. */
  function makeWave(rng, pool, budget) {
    var out = [], guard = 0;
    while (budget > 0.5 && out.length < 9 && guard++ < 50) {
      var k = rng.pick(pool), c = DBR.ENEMIES[k].cost;
      if (c > budget + 0.5) continue;
      out.push(k); budget -= c;
    }
    if (!out.length) out.push(pool[0]);
    return out;
  }

  /** Obstacles circulaires symétriques, loin de la porte et du point d'entrée. */
  function makeObstacles(g, rng, n) {
    g.obstacles = [];
    for (var i = 0; i < n; i++) {
      var r = rng.int(16, 28), x = rng.int(WALL + 70, W / 2 - 110), y = rng.int(WALL + 90, H - WALL - 110);
      g.obstacles.push({ x: x, y: y, r: r }, { x: W - x, y: y, r: r });
    }
  }

  function spawnWave(g, room) {
    var list = room.waves[room.wave++], p = g.player;
    for (var i = 0; i < list.length; i++) {
      var x, y, tries = 0;
      do { x = g.rng.range(WALL + 40, W - WALL - 40); y = g.rng.range(WALL + 40, H - WALL - 40); }
      while (U.dist(x, y, p.x, p.y) < 200 && tries++ < 20);
      DBR.spawnEnemy(g, list[i], x, y);
    }
    DBR.emit(g, 'wave', W / 2, H / 2, { n: room.wave, of: room.waves.length });
  }

  /** Entre dans la salle idx : remet le terrain à zéro et prépare son contenu. */
  DBR.enterRoom = function (g, idx) {
    var room = g.rooms[idx], p = g.player, rng = new DBR.RNG(room.seed), biome = DBR.BIOMES[room.biome];
    g.roomIndex = idx; g.room = room;
    g.enemies = []; g.bullets = []; g.beams = []; g.zones = []; g.pickups = []; g.props = []; g.obstacles = [];
    p.x = W / 2; p.y = H - WALL - 40; p.dashT = 0; p.specialT = 0;
    p.invuln = Math.max(p.invuln, 0.8);
    g.phase = 'combat';
    var pool = biome.pool.slice(0, Math.min(biome.pool.length, 2 + room.pos + (room.biome > 0 ? 1 : 0)));
    var budget = 6 + room.depth * 0.7;
    if (room.kind === 'combat') {
      makeObstacles(g, rng, rng.int(0, 3));
      var n = room.depth < 1 ? 3 : (room.biome < 2 ? 5 : 6);
      for (var i = 0; i < n; i++) room.waves.push(makeWave(rng, pool, budget * (0.8 + i * 0.12)));
    } else if (room.kind === 'miniboss' && DBR.ENEMIES[biome.miniboss]) {
      makeObstacles(g, rng, 1);
      room.waves.push([biome.miniboss].concat(makeWave(rng, pool, budget * 0.5)));
    } else if (room.kind === 'boss' && DBR.ENEMIES[biome.boss]) {
      room.waves.push([biome.boss]);
    } else if (room.kind === 'miniboss' || room.kind === 'boss') {   // repli tant que les boss n'existent pas
      for (var j = 0; j < 3; j++) room.waves.push(makeWave(rng, biome.pool, budget * 1.2));
    } else {                                                        // salles spéciales : pas de combat
      g.phase = 'open';
      if (DBR.setupSpecial) DBR.setupSpecial(g, room, rng);
    }
    room.wave = 0; room.waveT = 0.6;
    DBR.emit(g, 'roomEnter', p.x, p.y, { kind: room.kind, biome: room.biome });
  };

  /** Salle vidée : petite pause (le butin vole vers le joueur), puis récompense ou victoire. */
  function finishRoom(g) {
    var room = g.room, p = g.player;
    g.stats.rooms++;
    if (p.zenkai > 0) { p.dmg *= 1 + p.zenkai; p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.08); }
    if (g.roomIndex >= g.rooms.length - 1) {
      g.phase = 'victory'; g.over = true; g.won = true;
      DBR.emit(g, 'victory', p.x, p.y);
    } else if (DBR.rollChoices) {
      g.choice = DBR.rollChoices(g, room.kind === 'boss' ? 2 : (room.kind === 'miniboss' ? 1 : 0));
      g.phase = 'reward';
      DBR.emit(g, 'reward', p.x, p.y);
    } else g.phase = 'open';
  }

  /** Vrai si le joueur se tient dans l'encadrement de la porte (en haut, au centre). */
  DBR.atDoor = function (p) { return p.y <= WALL + p.r + 6 && Math.abs(p.x - W / 2) < 34; };

  /** Pas de la logique de salle, appelé par DBR.step. */
  DBR.stepRoom = function (g, inp, dt) {
    var room = g.room, p = g.player;
    if (!room) return;
    if (g.phase === 'combat') {
      // Les vagues se chevauchent : la suivante arrive dès qu'il reste au plus 2 ennemis
      if (room.wave < room.waves.length && g.enemies.length <= (room.wave === 0 ? 0 : 2)) {
        if ((room.waveT -= dt) <= 0) { spawnWave(g, room); room.waveT = 1.2; }
      } else if (g.enemies.length === 0 && room.wave >= room.waves.length) {
        g.phase = 'cleared'; room.clearT = (room.kind === 'boss' ? 2.2 : 1.1);
        DBR.clearEnemyBullets(g);
        DBR.emit(g, 'roomClear', p.x, p.y, { kind: room.kind });
      }
    } else if (g.phase === 'cleared') {
      if ((room.clearT -= dt) <= 0) finishRoom(g);
    } else if (g.phase === 'open') {
      if (DBR.stepProps) DBR.stepProps(g, inp, dt);
      if (DBR.atDoor(p) && (inp.my || 0) < 0) DBR.enterRoom(g, g.roomIndex + 1);
    }
  };
})();
