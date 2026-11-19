// Play along: the music runs at a chosen speed and doesn't wait. This file holds the timing rules
// (count-in clicks, which note a key press belongs to, the score); app.js runs the clock.
// Times are song seconds (a typed song's beat is BEAT_SEC long) unless they say "real".
// Uses notation.js.
'use strict';

var Tempo = (function () {
  var SPEEDS = [0.4, 0.6, 0.8, 1];   // of the written speed (typed songs: 1 = 120 quarter notes a minute)
  var ON_TIME = 0.15;   // real seconds: a key this close to its note is "in time"
  var WINDOW = 0.35;    // real seconds: further away, the key doesn't belong to the note

  // Quarter notes per minute of a typed song at this speed.
  function bpm(speed) { return Math.round(60 / BEAT_SEC * speed); }

  // Metronome clicks [{ t, accent, countIn }] before the music starts at song time t0: at least one
  // whole bar, starting on a bar line (so a pickup is counted in as in a band: "1 2 3 1 2" + pickup).
  // With `all`, the clicks go on up to song time tEnd. info: { meter, pickup } of a typed song;
  // null for a MIDI file (no bars known): four clicks of 0.5 s, and none during the music.
  function clicks(info, t0, tEnd, all) {
    var s = t0 / BEAT_SEC, unit, bar, origin;
    if (info) { unit = 4 / info.meter[1]; bar = info.meter[0] * unit; origin = info.pickup || 0; }
    else { unit = 1; bar = 4; origin = s; all = false; }
    var lastBar = origin + Math.floor((s - origin) / bar + 1e-6) * bar;   // bar line at or before the start
    var start = lastBar - bar;
    var limit = all ? tEnd / BEAT_SEC + 1e-6 : s - 1e-6;
    var out = [];
    for (var k = 0; start + k * unit < limit; k++) {
      var b = start + k * unit, inBar = (((b - origin) % bar) + bar) % bar;
      out.push({ t: round(b * BEAT_SEC), accent: inBar < 1e-6 || bar - inBar < 1e-6, countIn: b < s - 1e-6 });
    }
    return out;
  }

  // The note a key press belongs to: the not yet judged target note on that key nearest to song
  // time T, within WINDOW. targets: [{ m, t, res }] (res null = not judged yet).
  // Returns { target, grade: 'ok' | 'early' | 'late', off: real seconds (+ = late) } or null.
  function judge(targets, m, T, speed) {
    var bestN = null, bestOff = 0;
    for (var i = 0; i < targets.length; i++) {
      var n = targets[i];
      if (n.res || n.m !== m) continue;
      var off = (T - n.t) / speed;
      if (Math.abs(off) <= WINDOW + 1e-9 && (!bestN || Math.abs(off) < Math.abs(bestOff))) { bestN = n; bestOff = off; }
    }
    if (!bestN) return null;
    return { target: bestN, grade: Math.abs(bestOff) <= ON_TIME ? 'ok' : bestOff < 0 ? 'early' : 'late', off: bestOff };
  }

  // True once a note can no longer be played in time (song time T).
  function expired(n, T, speed) { return !n.res && (T - n.t) / speed > WINDOW; }

  // Score 0-100: notes in time count fully, a bit early or late half, missed ones not at all.
  // r: { ok, early, late, total }
  function score(r) { return r.total ? Math.round(100 * (r.ok + 0.5 * (r.early + r.late)) / r.total) : 0; }

  function round(x) { return Math.round(x * 1000) / 1000; }

  return { SPEEDS: SPEEDS, ON_TIME: ON_TIME, WINDOW: WINDOW, bpm: bpm, clicks: clicks, judge: judge, expired: expired, score: score };
})();

if (typeof module !== 'undefined') module.exports = { Tempo: Tempo };
