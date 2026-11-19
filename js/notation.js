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

// Typed song format (see help text in index.html):
//   C4 D4 E4          one step per word
//   C4+E4+G4          chord
//   L:C4 / R:C4       force hand (otherwise below C4 = left, C4 and above = right)
//   E4/3  G3/4+B3/2   finger to use (1 = thumb ... 5 = little finger)
//   C4_2  G4_0.5      length in beats (only affects spacing in the note lane)
//   -  -_2            rest
//   3/4               time signature (only at the start; default 4/4)
//   |  and  // comments are ignored
function parseSongText(text) {
  var notes = [], errors = [], rests = [], meter = [4, 4], beat = 0, steps = 0;
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
  // rests: times (s) of "-" tokens; meter: [beats, unit]; beats: total length in quarter-note beats
  return { notes: notes, errors: errors, steps: steps, rests: rests, meter: meter, beats: beat };
}

// Keeps the spelling of flats as written ("Bb3" stays "Bb3" instead of "A#3").
// Returns null for other notes, which are shown with the default (sharp) names.
function spelled(name) {
  var r = /^([A-Ga-g])([b♭])(-?\d)?$/.exec(name);
  return r ? r[1].toUpperCase() + 'b' + (r[3] != null ? r[3] : '4') : null;
}

function noteLabel(n) { return n.s || midiToName(n.m); }

// For playback: copies of the notes where a key that is struck again is released just before
// (otherwise the earlier note's release would cut the new one short). Notes must be sorted by time.
function playbackNotes(notes) {
  var out = notes.map(function (n) { return { m: n.m, t: n.t, d: n.d, h: n.h }; });
  var next = {};   // midi -> start time of the next note on that key
  for (var i = out.length - 1; i >= 0; i--) {
    var n = out[i];
    if (next[n.m] != null && n.t + n.d > next[n.m] - 0.01) n.d = Math.max(0.02, next[n.m] - n.t - 0.01);
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
    spelled: spelled, noteLabel: noteLabel, playbackNotes: playbackNotes, BEAT_SEC: BEAT_SEC, CHORD_TOLERANCE: CHORD_TOLERANCE };
}
