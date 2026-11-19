// Note names, typed-song parsing and step building. Plain script (no modules) so the
// app also works when index.html is opened straight from disk.
'use strict';

var NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
var BEAT_SEC = 0.5;           // how long one "beat" of a typed song is drawn in the note lane
var CHORD_TOLERANCE = 0.045;  // notes starting within 45 ms count as one chord/step

function isBlack(m) {
  var k = m % 12;
  return k === 1 || k === 3 || k === 6 || k === 8 || k === 10;
}

function midiToName(m) {
  return NOTE_NAMES[m % 12] + (Math.floor(m / 12) - 1);
}

// "C4" -> 60, "F#3" -> 54, "Bb2" -> 46, "e" -> 64 (octave defaults to 4). null if invalid.
// "H4" (German name for B) = "B4"; only plain H, since "Hb"/"H#" aren't used.
function parseNoteName(s) {
  var r = /^([A-Ha-h])([#♯b♭]?)(-?\d)?$/.exec(s);
  if (!r || (/h/i.test(r[1]) && r[2])) return null;
  var base = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11, h: 11 }[r[1].toLowerCase()];
  var acc = (r[2] === '#' || r[2] === '♯') ? 1 : (r[2] === 'b' || r[2] === '♭') ? -1 : 0;
  var oct = r[3] != null ? parseInt(r[3], 10) : 4;
  var m = (oct + 1) * 12 + base + acc;
  return (m >= 21 && m <= 108) ? m : null;
}

// ---- key signatures
// A key signature (key:G) only changes how the sheet music is written: F#4 is always the black key
// and F4 always the white one, so a song never changes pitch when its key line is changed or removed.
// Number of sharps (+) or flats (-) of each key, named as VexFlow names them.
var KEY_SIGS = { C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, 'C#': 7, F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6, Cb: -7,
  Am: 0, Em: 1, Bm: 2, 'F#m': 3, 'C#m': 4, 'G#m': 5, 'D#m': 6, 'A#m': 7, Dm: -1, Gm: -2, Cm: -3, Fm: -4, Bbm: -5, Ebm: -6, Abm: -7 };
var SHARP_ORDER = 'FCGDAEB';
var MAJOR_BY_COUNT = { '-7': 'Cb', '-6': 'Gb', '-5': 'Db', '-4': 'Ab', '-3': 'Eb', '-2': 'Bb', '-1': 'F',
  0: 'C', 1: 'G', 2: 'D', 3: 'A', 4: 'E', 5: 'B', 6: 'F#', 7: 'C#' };

// "G", "Bb", "F#m", "em", "2#", "3b", "1♯", "0" -> the key's name ("G", "Bb", "F#m", "Em", "D", "Eb", "G", "C");
// null if unknown.
function parseKey(s) {
  s = String(s).replace(/♯/g, '#').replace(/♭/g, 'b');
  var c = /^([0-7])([#b]?)$/.exec(s);
  if (c) return +c[1] === 0 || c[2] ? MAJOR_BY_COUNT[c[2] === 'b' ? -c[1] : +c[1]] : null;
  var r = /^([A-Ga-g])([#b]?)(m?)$/.exec(s);
  if (!r) return null;
  var k = r[1].toUpperCase() + r[2] + r[3];
  return KEY_SIGS.hasOwnProperty(k) ? k : null;
}
function keyCount(key) { return KEY_SIGS[key] || 0; }
// The letters a key changes: G -> { F: 1 }, Bb -> { B: -1, E: -1 }
function keyAccidentals(key) {
  var n = keyCount(key), out = {};
  for (var i = 0; i < Math.abs(n); i++) out[n > 0 ? SHARP_ORDER[i] : SHARP_ORDER[6 - i]] = n > 0 ? 1 : -1;
  return out;
}
// The major and minor key with the same signature: G -> ["G", "Em"], Dm -> ["F", "Dm"]
function keyPair(key) {
  var n = keyCount(key), minor = null;
  for (var k in KEY_SIGS) if (/m$/.test(k) && KEY_SIGS[k] === n) minor = k;
  return [MAJOR_BY_COUNT[n], minor];
}
// How a key played on the piano is written in a song with this key (recording): black keys are
// written as flats in flat keys (Bb4 in F major), otherwise as sharps.
function nameInKey(m, key) {
  var name = midiToName(m), up = /^([A-G])(-?\d+)$/.exec(midiToName(m + 1));
  return keyCount(key) < 0 && /#/.test(name) && up ? up[1] + 'b' + up[2] : name;
}
// Notes whose ♯/♭ differs from the key signature, so the sheet music shows a ♯, ♭ or ♮ in front of
// them (e.g. F4 in G major). Often a forgotten ♯/♭ when copying from a book. -> ["F4", "Fn4"...] (unique)
function offKeyNotes(notes, key) {
  var acc = keyAccidentals(key), out = [];
  if (!keyCount(key)) return out;
  notes.forEach(function (n) {
    var r = /^([A-G])([#b]?)(-?\d+)$/.exec(n.s || midiToName(n.m));
    var own = r[2] === '#' ? 1 : r[2] === 'b' ? -1 : 0;
    if (own !== (acc[r[1]] || 0) && out.indexOf(r[0]) < 0) out.push(r[0]);
  });
  return out;
}

// Typed song format (see help text in index.html):
//   C4 D4 E4          one step per word
//   C4+E4+G4          chord
//   L:C4 / R:C4       force hand (otherwise below C4 = left, C4 and above = right)
//   E4/3  G3/4+B3/2   finger to use (1 = thumb ... 5 = little finger)
//   C4_2  G4_0.5      length in beats (only affects spacing in the note lane)
//   -  -_2            rest
//   3/4               time signature (only at the start; default 4/4)
//   key:G  key:2b     key signature (only at the start; only changes how the sheet music looks)
//   |  and  // comments are ignored
function parseSongText(text) {
  var notes = [], errors = [], rests = [], meter = [4, 4], key = 'C', beat = 0, steps = 0;
  var lines = String(text || '').split(/\r?\n/);
  for (var li = 0; li < lines.length; li++) {
    var clean = lines[li].replace(/\/\/.*$/, '');
    var toks = clean.split(/[\s,]+/);
    for (var ti = 0; ti < toks.length; ti++) {
      var tok = toks[ti].replace(/\|/g, '');
      if (!tok) continue;
      var dur = 1, body = tok, u = tok.indexOf('_');
      if (u >= 0) {
        var ds = tok.slice(u + 1);
        dur = /^(\d+\.?\d*|\.\d+)$/.test(ds) ? parseFloat(ds) : NaN;   // "2", "0.5", ".5"; not "2abc"
        body = tok.slice(0, u);
        if (!(dur > 0)) { errors.push(msg('errLength', tok, 'the length after _ must be a number')); continue; }
      }
      if (body === '-') { rests.push(round3(beat * BEAT_SEC)); beat += dur; continue; }
      var tm = /^(\d+)\/(\d+)$/.exec(body);                   // time signature, e.g. 3/4
      if (tm) {
        if (beat > 0) errors.push(msg('errMeterPos', tok, 'a time signature can only be at the start'));
        else if (!(+tm[1] > 0) || [2, 4, 8, 16].indexOf(+tm[2]) < 0) errors.push(msg('errMeter', tok, 'is not a time signature'));
        else meter = [+tm[1], +tm[2]];
        continue;
      }
      var km = /^key:(.*)$/i.exec(body);                       // key signature, e.g. key:G
      if (km) {
        if (beat > 0) errors.push(msg('errKeyPos', tok, 'a key signature can only be at the start'));
        else if (parseKey(km[1]) == null) errors.push(msg('errKey', tok, 'is not a key signature'));
        else key = parseKey(km[1]);
        continue;
      }
      var parts = body.split('+'), stepNotes = [], bad = false;
      for (var pi = 0; pi < parts.length; pi++) {
        var hm = /^([LRlr]):(.*)$/.exec(parts[pi]);
        var name = hm ? hm[2] : parts[pi];
        var finger = null, fm = /^(.*)\/(.*)$/.exec(name);       // "E4/3" = E4 with finger 3
        if (fm) {
          if (!/^[1-5]$/.test(fm[2])) { errors.push(msg('errFinger', parts[pi], 'the finger after / must be 1 to 5')); bad = true; break; }
          name = fm[1]; finger = +fm[2];
        }
        var m = parseNoteName(name);
        if (m == null) { errors.push(msg('errNote', parts[pi], 'is not a note on the piano')); bad = true; break; }
        var dup = stepNotes.filter(function (x) { return x.m === m; })[0];   // same key twice in a chord
        if (dup) { if (!dup.f) dup.f = finger; continue; }
        stepNotes.push({ m: m, h: hm ? hm[1].toUpperCase() : (m >= 60 ? 'R' : 'L'), s: spelled(name), f: finger });
      }
      if (bad) continue;
      for (var si = 0; si < stepNotes.length; si++) {
        var note = {
          m: stepNotes[si].m,
          t: round3(beat * BEAT_SEC),
          d: round3(dur * BEAT_SEC * 0.92),
          h: stepNotes[si].h
        };
        if (stepNotes[si].s) note.s = stepNotes[si].s;
        if (stepNotes[si].f) note.f = stepNotes[si].f;
        notes.push(note);
      }
      beat += dur;
      steps++;
    }
  }
  sortNotes(notes);
  // rests: times (s) of "-" tokens; meter: [beats, unit]; key: e.g. "G" ("C" = none);
  // beats: total length in quarter-note beats
  return { notes: notes, errors: errors, steps: steps, rests: rests, meter: meter, key: key, beats: beat };
}

// Keeps the spelling of flats as written ("Bb3" stays "Bb3" instead of "A#3"), and of E# and B#
// (keys with many sharps). Returns null for other notes, which are shown with the default (sharp) names.
function spelled(name) {
  var r = /^([A-Ga-g])([b♭#♯])(-?\d)?$/.exec(name);
  if (!r) return null;
  var L = r[1].toUpperCase(), oct = r[3] != null ? r[3] : '4';
  if (r[2] === 'b' || r[2] === '♭') return L + 'b' + oct;
  return L === 'E' || L === 'B' ? L + '#' + oct : null;
}

function noteLabel(n) { return n.s || midiToName(n.m); }

// For playback: copies of the notes where a key that is struck again is released just before
// (otherwise the earlier note's release would cut the new one short). The same key struck twice
// at (almost) the same time, e.g. by both hands or two tracks, is played once.
// Each note gets `next`: when that key is struck again (null if never), so the player can make sure
// a minimum length never reaches into the next note.
var SAME_TIME = 0.03;   // seconds
function playbackNotes(notes) {
  var sorted = notes.map(function (n) { return { m: n.m, t: n.t, d: n.d, h: n.h, next: null }; })
    .sort(function (a, b) { return a.t - b.t; });
  var out = [], last = {};   // midi -> last kept note on that key
  sorted.forEach(function (n) {
    var p = last[n.m];
    if (p && n.t - p.t < SAME_TIME) { p.d = Math.max(p.d, n.t + n.d - p.t); return; }   // played once
    out.push(n);
    last[n.m] = n;
  });
  var next = {};   // midi -> start time of the next note on that key
  for (var i = out.length - 1; i >= 0; i--) {
    var n = out[i];
    n.next = next[n.m] != null ? next[n.m] : null;
    if (n.next != null && n.t + n.d > n.next - 0.01) n.d = Math.max(0.01, n.next - n.t - 0.01);
    next[n.m] = n.t;
  }
  return out;
}

// Error text in the app's language (js/i18n.js), or English when it isn't loaded (e.g. in tests).
function msg(key, tok, english) {
  if (typeof t === 'function') return t(key, { tok: tok });
  return '"' + tok + '"' + (english.indexOf('is ') === 0 ? ' ' : ': ') + english;
}

function round3(x) { return Math.round(x * 1000) / 1000; }

function sortNotes(notes) {
  notes.sort(function (a, b) { return a.t - b.t || a.m - b.m; });
  return notes;
}

// Groups notes (filtered by hand: 'B' both, 'R', 'L') into steps the player must play.
// Each step: { t, notes: [midi...], hands: {midi: 'R'|'L'}, fingers: {midi: 1-5} }
function buildSteps(notes, hand) {
  var steps = [];
  for (var i = 0; i < notes.length; i++) {
    var n = notes[i];
    if (hand !== 'B' && n.h !== hand) continue;
    var last = steps[steps.length - 1];
    if (last && n.t - last.t < CHORD_TOLERANCE) {
      if (last.notes.indexOf(n.m) < 0) {
        last.notes.push(n.m); last.hands[n.m] = n.h;
        if (n.f) last.fingers[n.m] = n.f;
      }
    } else {
      var hands = {}, fingers = {};
      hands[n.m] = n.h;
      if (n.f) fingers[n.m] = n.f;
      steps.push({ t: n.t, notes: [n.m], hands: hands, fingers: fingers });
    }
  }
  return steps;
}

if (typeof module !== 'undefined') {
  module.exports = { isBlack: isBlack, midiToName: midiToName, parseNoteName: parseNoteName,
    parseSongText: parseSongText, buildSteps: buildSteps, sortNotes: sortNotes,
    spelled: spelled, noteLabel: noteLabel, playbackNotes: playbackNotes, BEAT_SEC: BEAT_SEC, CHORD_TOLERANCE: CHORD_TOLERANCE,
    parseKey: parseKey, keyCount: keyCount, keyAccidentals: keyAccidentals, keyPair: keyPair, nameInKey: nameInKey,
    offKeyNotes: offKeyNotes };
}
