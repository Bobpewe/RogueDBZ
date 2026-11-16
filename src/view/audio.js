/*
 * Dragon Roguelike — fan game non commercial
 * Auteur : Charles GRATIAS
 * audio.js : tout le son est synthétisé avec WebAudio (aucun fichier). Bruitages à base
 * d'oscillateurs et de bruit blanc ; musique générée par un petit séquenceur 16 pas dont
 * les motifs sont tirés d'un RNG à graine (une ambiance par biome, boss, menu, boutique).
 */
(function () {
  'use strict';
  var DBR = window.DBR;
  var A = DBR.Audio = { ctx: null, sfxVol: 0.6, musVol: 0.45, track: null, want: 'title' };
  var sfxGain, musGain, noiseBuf, last = {}, nextStep = 0, step = 0, pattern = null;

  /** Le contexte audio ne peut démarrer qu'après un geste de l'utilisateur. */
  A.unlock = function () {
    if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      A.ctx = new AC();
      sfxGain = A.ctx.createGain(); musGain = A.ctx.createGain();
      sfxGain.connect(A.ctx.destination); musGain.connect(A.ctx.destination);
      noiseBuf = A.ctx.createBuffer(1, A.ctx.sampleRate, A.ctx.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      A.setVolumes(A.sfxVol, A.musVol);
    } catch (e) { A.ctx = null; }
  };

  A.setVolumes = function (sfx, mus) {
    A.sfxVol = sfx; A.musVol = mus;
    if (A.ctx) { sfxGain.gain.value = sfx; musGain.gain.value = mus * 0.5; }
  };

  /** Note simple : oscillateur avec glissando et enveloppe décroissante. */
  function tone(f0, f1, dur, type, vol, when, out) {
    var c = A.ctx, t = (when || c.currentTime), o = c.createOscillator(), g = c.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(out || sfxGain);
    o.start(t); o.stop(t + dur + 0.02);
  }
  /** Souffle de bruit filtré (impacts, explosions, charleston). */
  function noise(dur, vol, freq, type, when, out) {
    var c = A.ctx, t = (when || c.currentTime), s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = noiseBuf; f.type = type || 'lowpass'; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(out || sfxGain);
    s.start(t, Math.random() * 0.5, dur + 0.02);
  }
  function arp(notes, gap, dur, type, vol) { for (var i = 0; i < notes.length; i++) tone(notes[i], 0, dur, type, vol, A.ctx.currentTime + i * gap); }

  var SFX = {
    shoot: function () { tone(900, 420, 0.07, 'square', 0.09); },
    hit: function () { noise(0.05, 0.2, 2400); tone(260, 180, 0.04, 'square', 0.08); },
    crit: function () { noise(0.08, 0.3, 3000); tone(520, 260, 0.1, 'sawtooth', 0.14); },
    kill: function () { noise(0.18, 0.3, 900); tone(200, 60, 0.16, 'sawtooth', 0.14); },
    bosskill: function () { noise(1.2, 0.6, 500); tone(160, 30, 1.2, 'sawtooth', 0.3); arp([523, 659, 784, 1047], 0.12, 0.3, 'square', 0.12); },
    hurt: function () { tone(220, 70, 0.28, 'sawtooth', 0.3); noise(0.15, 0.3, 1200); },
    dash: function () { noise(0.14, 0.2, 2600, 'highpass'); tone(300, 700, 0.1, 'triangle', 0.08); },
    special: function () { tone(180, 900, 0.5, 'sawtooth', 0.16); },
    beam: function () { tone(700, 240, 0.6, 'square', 0.12); noise(0.6, 0.25, 1500); },
    ultra: function () { arp([262, 330, 392, 523, 659, 784, 1047], 0.05, 0.4, 'sawtooth', 0.14); noise(0.8, 0.3, 800); },
    explode: function () { noise(0.35, 0.4, 500); tone(120, 40, 0.3, 'sine', 0.3); },
    pickup: function () { tone(1300, 1900, 0.06, 'square', 0.06); },
    heal: function () { arp([523, 659, 784], 0.07, 0.2, 'triangle', 0.16); },
    eshoot: function () { tone(320, 190, 0.09, 'triangle', 0.1); },
    windup: function () { tone(760, 760, 0.05, 'square', 0.04); },
    charge: function () { noise(0.25, 0.2, 700); tone(140, 260, 0.2, 'sawtooth', 0.1); },
    summon: function () { tone(200, 500, 0.4, 'triangle', 0.14); tone(300, 750, 0.4, 'triangle', 0.1); },
    clear: function () { arp([523, 659, 784, 1047], 0.09, 0.22, 'square', 0.12); },
    power: function () { arp([392, 523, 659, 784, 1047], 0.06, 0.25, 'square', 0.12); },
    buy: function () { arp([988, 1319], 0.08, 0.15, 'square', 0.1); },
    deny: function () { tone(160, 120, 0.15, 'square', 0.12); },
    select: function () { tone(660, 660, 0.04, 'square', 0.07); },
    confirm: function () { arp([660, 990], 0.05, 0.1, 'square', 0.09); },
    death: function () { arp([523, 415, 330, 262, 196, 131], 0.14, 0.4, 'sawtooth', 0.16); },
    victory: function () { arp([523, 523, 523, 659, 784, 659, 784, 1047], 0.13, 0.35, 'square', 0.14); },
    boss: function () { tone(90, 45, 0.9, 'sawtooth', 0.3); noise(0.9, 0.2, 300); },
    phase: function () { tone(400, 80, 0.6, 'sawtooth', 0.25); noise(0.5, 0.3, 1000); },
    teleport: function () { tone(1200, 300, 0.15, 'sine', 0.12); },
    door: function () { tone(200, 400, 0.2, 'triangle', 0.14); }
  };
  /** Délai minimal (ms) entre deux occurrences du même son, pour ne pas saturer. */
  var GAP = { shoot: 50, hit: 40, kill: 50, pickup: 40, eshoot: 60, windup: 80, explode: 60 };

  A.sfx = function (name) {
    if (!A.ctx || A.sfxVol <= 0 || !SFX[name]) return;
    var now = performance.now();
    if (last[name] && now - last[name] < (GAP[name] || 20)) return;
    last[name] = now;
    try { SFX[name](); } catch (e) { /* le son ne doit jamais casser le jeu */ }
  };

  var MAP = { shoot: 'shoot', hurt: 'hurt', dash: 'dash', special: 'special', beam: 'beam', ultra: 'ultra', explode: 'explode', pickup: 'pickup', heal: 'heal', revive: 'heal', eshoot: 'eshoot', windup: 'windup', charge: 'charge', summon: 'summon', roomClear: 'clear', upgrade: 'power', buy: 'buy', noZeni: 'deny', death: 'death', victory: 'victory', bossIntro: 'boss', bossPhase: 'phase', teleport: 'teleport', roomEnter: 'door', chest: 'power', swing: 'eshoot' };
  /** Associe un événement de simulation à un bruitage. */
  A.onEvent = function (e) {
    if (e.t === 'hit') A.sfx(e.crit ? 'crit' : 'hit');
    else if (e.t === 'kill') A.sfx(e.boss ? 'bosskill' : 'kill');
    else if (MAP[e.t]) A.sfx(MAP[e.t]);
  };

  /* ---------- Musique générative ---------- */
  var MINOR = [0, 2, 3, 5, 7, 8, 10], MAJOR = [0, 2, 4, 5, 7, 9, 11], PENTA = [0, 3, 5, 7, 10], PHRYG = [0, 1, 3, 5, 7, 8, 10];
  var TRACKS = {
    title: { bpm: 96, root: 45, scale: MAJOR, seed: 11, density: 0.45, drums: 1 },
    biome0: { bpm: 122, root: 48, scale: MAJOR, seed: 21, density: 0.55, drums: 2 },
    biome1: { bpm: 128, root: 45, scale: PHRYG, seed: 32, density: 0.5, drums: 2 },
    biome2: { bpm: 132, root: 43, scale: MINOR, seed: 43, density: 0.6, drums: 2 },
    biome3: { bpm: 138, root: 41, scale: PENTA, seed: 54, density: 0.6, drums: 2 },
    calm: { bpm: 84, root: 50, scale: MAJOR, seed: 65, density: 0.35, drums: 0 },
    boss: { bpm: 154, root: 40, scale: MINOR, seed: 76, density: 0.75, drums: 3 },
    final: { bpm: 168, root: 38, scale: PHRYG, seed: 87, density: 0.8, drums: 3 }
  };
  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  /** Construit 64 pas (4 mesures) de basse et de mélodie à partir de la graine du morceau. */
  function build(tr) {
    var r = new DBR.RNG(tr.seed), bass = [], lead = [], prog = [0, r.pick([3, 5]), r.pick([4, 2]), r.pick([4, 6])], deg = 0, i;
    for (i = 0; i < 64; i++) {
      var ch = prog[i >> 4], pos = i % 16;
      bass.push((pos % 4 === 0 || (pos % 4 === 2 && r.chance(0.6)) || (pos === 15 && r.chance(0.5))) ? tr.root + tr.scale[ch % tr.scale.length] + (pos % 8 === 6 ? 12 : 0) : -1);
      if (r.chance(tr.density) || pos === 0) {
        deg += r.int(-2, 2); deg = Math.max(-2, Math.min(9, deg));
        if (pos === 0) deg = ch + r.pick([0, 2, 4]);
        var d = ((deg % tr.scale.length) + tr.scale.length) % tr.scale.length, oct = Math.floor(deg / tr.scale.length);
        lead.push(tr.root + 24 + tr.scale[d] + oct * 12);
      } else lead.push(-1);
    }
    return { bass: bass, lead: lead, tr: tr };
  }

  A.setTrack = function (name) { A.want = name; };

  /** À appeler à chaque image : programme les notes un peu en avance (lookahead). */
  A.update = function () {
    if (!A.ctx || A.ctx.state !== 'running') return;
    var c = A.ctx, now = c.currentTime;
    if (A.want !== A.track) { A.track = A.want; pattern = TRACKS[A.track] ? build(TRACKS[A.track]) : null; step = 0; nextStep = now + 0.08; }
    if (!pattern || A.musVol <= 0) { nextStep = now + 0.05; return; }
    if (nextStep < now - 0.3) nextStep = now;          // onglet resté en arrière-plan : on se recale
    var tr = pattern.tr, len = 60 / tr.bpm / 4;
    while (nextStep < now + 0.12) {
      var s = step % 64, t = nextStep, pos = s % 16;
      if (pattern.bass[s] >= 0) tone(hz(pattern.bass[s]), 0, len * 1.8, 'triangle', 0.3, t, musGain);
      if (pattern.lead[s] >= 0) tone(hz(pattern.lead[s]), 0, len * 1.5, 'square', 0.085, t, musGain);
      if (tr.drums >= 1 && pos % 8 === 0) tone(130, 40, 0.14, 'sine', 0.5, t, musGain);                 // grosse caisse
      if (tr.drums >= 2 && pos % 8 === 4) noise(0.1, 0.22, 1800, 'bandpass', t, musGain);               // caisse claire
      if (tr.drums >= 2 && pos % 2 === 0) noise(0.03, 0.07, 7000, 'highpass', t, musGain);              // charleston
      if (tr.drums >= 3 && (pos === 6 || pos === 10 || pos % 2 === 1)) { if (pos % 2 === 1) noise(0.02, 0.05, 8000, 'highpass', t, musGain); else tone(130, 40, 0.12, 'sine', 0.4, t, musGain); }
      nextStep += len; step++;
    }
  };
})();
