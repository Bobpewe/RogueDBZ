/*
 * Dragon Roguelike — fan game non commercial
 * Auteur : Charles GRATIAS
 * rng.js : générateur pseudo-aléatoire à graine (mulberry32) + utilitaires mathématiques.
 * Aucune dépendance au DOM : utilisable sous Node.
 */
(function () {
  'use strict';
  var DBR = (typeof window !== 'undefined') ? (window.DBR = window.DBR || {}) : (globalThis.DBR = globalThis.DBR || {});

  /** Générateur déterministe : même graine => même suite => même run. */
  function RNG(seed) { this.s = (seed >>> 0) || 1; }
  RNG.prototype.next = function () {
    var t = (this.s += 0x6D2B79F5) >>> 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  RNG.prototype.range = function (a, b) { return a + (b - a) * this.next(); };
  RNG.prototype.int = function (a, b) { return a + Math.floor(this.next() * (b - a + 1)); }; // bornes incluses
  RNG.prototype.chance = function (p) { return this.next() < p; };
  RNG.prototype.pick = function (arr) { return arr[Math.floor(this.next() * arr.length)]; };
  RNG.prototype.shuffle = function (arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(this.next() * (i + 1)), t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  };
  DBR.RNG = RNG;

  /** Transforme une chaîne en graine entière (pour saisir une seed lisible). */
  DBR.hashSeed = function (str) {
    var h = 2166136261;
    str = String(str);
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0) || 1;
  };

  /** Petits utilitaires géométriques partagés par toute la simulation. */
  DBR.U = {
    clamp: function (v, a, b) { return v < a ? a : (v > b ? b : v); },
    dist: function (ax, ay, bx, by) { var dx = bx - ax, dy = by - ay; return Math.sqrt(dx * dx + dy * dy); },
    /** Différence d'angle ramenée dans [-PI, PI]. */
    angDiff: function (a, b) {
      var d = (b - a) % (Math.PI * 2);
      if (d > Math.PI) d -= Math.PI * 2; else if (d < -Math.PI) d += Math.PI * 2;
      return d;
    },
    /** Distance d'un point (px,py) au segment [a,b]. */
    segDist: function (px, py, ax, ay, bx, by) {
      var dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
      var t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
      t = t < 0 ? 0 : (t > 1 ? 1 : t);
      var cx = ax + dx * t - px, cy = ay + dy * t - py;
      return Math.sqrt(cx * cx + cy * cy);
    }
  };
})();
