// Lessons: short courses written for Pliktra, one skill each. A lesson is a row of steps:
//   learn  a card: what it is and why, a keyboard picture (keys light up as you press them), Listen
//   find   a card: find keys on your piano (e.g. every C)
//   play   a short piece on the practice screen (wait mode), with an optional check of the skill:
//          hold: 'L' / 'R'  long notes of that hand must be held for their whole length
//          dyn: ['p', 'f', ...] loud (f) or soft (p) per bar, or 'cresc' (louder and louder)
// Texts are i18n keys: lx_<lesson>_<step>_t (title), _x (text), _h (hint while playing, play steps).
// A lesson is learnt when every play step is passed (and was, before lessons had steps, with 95%+).
// A lesson "song" (id "lesson:<id>") is never stored. Uses notation.js.
'use strict';

var Lessons = (function () {
  var PASS = 80;     // % of the steps right first time that passes a play step
  var LEGACY = 95;   // old best score ("lesson:<id>:B") that ticked a lesson off
  var DYN_GAP = 20;  // loud notes must be this much stronger than soft ones (MIDI velocity 1-127)

  var LIST = [
    { id: 'keys', name: 'lessonKeys', desc: 'lessonKeysDesc', steps: [
      { id: 'groups', type: 'learn', pic: { from: 'C3', to: 'B4', names: 'c', marks: 'C3 C4' } },
      { id: 'c', type: 'find', find: 'C', need: 4, pic: { from: 'A0', to: 'C8' } },
      { id: 'middle', type: 'learn', pic: { from: 'C3', to: 'C5', names: 'c', marks: 'C4/1' } },
      { id: 'mid', type: 'find', find: 'C4', need: 1, pic: { from: 'C2', to: 'C6' } },
      { id: 'f', type: 'learn', pic: { from: 'C3', to: 'B4', names: 'all', marks: 'F3 F4' } },
      { id: 'findf', type: 'find', find: 'F', need: 3, pic: { from: 'A0', to: 'C8' } },
      { id: 'jump', type: 'play',
        text: 'C3/3 C4/3 C5/3 C4/3 | F3/3 F4/3 F5/3 F4/3 | C3/3 F3/3 C4/3 F4/3 | C5/3 F5/3 C5/3_2' }
    ] },
    { id: 'five', name: 'lessonFive', desc: 'lessonFiveDesc', steps: [
      { id: 'pos', type: 'learn', pic: { from: 'C4', to: 'C5', names: 'all', marks: 'C4/1 D4/2 E4/3 F4/4 G4/5' } },
      { id: 'up', type: 'play', text: 'C4/1 D4/2 E4/3 F4/4 | G4/5 F4/4 E4/3 D4/2 | C4/1_4' },
      { id: 'shape', type: 'learn', pic: { from: 'C4', to: 'C5', marks: 'C4/1 D4/2 E4/3 F4/4 G4/5' } },
      { id: 'skips', type: 'play', text: 'C4/1 E4/3 D4/2 F4/4 | E4/3 G4/5 C4/1_2 | G4/5 E4/3 F4/4 D4/2 | E4/3 D4/2 C4/1_2' },
      { id: 'left', type: 'learn', pic: { from: 'C3', to: 'C4', names: 'all', marks: 'C3/5 D3/4 E3/3 F3/2 G3/1' } },
      { id: 'lplay', type: 'play', text: 'C3/5 D3/4 E3/3 F3/2 | G3/1 F3/2 E3/3 D3/4 | C3/5 E3/3 D3/4 F3/2 | E3/3 G3/1 C3/5_2' },
      { id: 'both', type: 'play', pic: { from: 'C3', to: 'C5', marks: 'C3/5 D3/4 E3/3 F3/2 G3/1 C4/1 D4/2 E4/3 F4/4 G4/5' },
        text: 'C3/5+C4/1 D3/4+D4/2 E3/3+E4/3 F3/2+F4/4 | G3/1+G4/5 F3/2+F4/4 E3/3+E4/3 D3/4+D4/2 | C3/5+C4/1_4' }
    ] },
    { id: 'hold', name: 'lessonHold', desc: 'lessonHoldDesc', steps: [
      { id: 'long', type: 'learn', listen: 'C4_4 | E4_2 G4_2 | C4 D4 E4 F4 | G4_4' },
      { id: 'whole', type: 'play', hold: 'L',
        text: 'C3/5+C4/1 D4/2 E4/3 F4/4 | G3/1+G4/5 F4/4 E4/3 D4/2 | C3/5+C4/1 D4/2 E4/3 F4/4 | G3/1+G4/5_4' },
      { id: 'halves', type: 'learn' },
      { id: 'half', type: 'play', hold: 'L',
        text: 'C3/5+E4/3 D4/2 E3/3+C4/1 D4/2 | F3/2+F4/4 E4/3 E3/3+G4/5 E4/3 | D3/4+D4/2 F4/4 G3/1+G4/5 F4/4 | C3/5+E4/3 D4/2 C4/1_2' },
      { id: 'piece', type: 'play', hold: 'L',
        text: 'C3/5+C4/1 D4/2 E4/3 F4/4 | G3/1+G4/5 F4/4 E4/3 D4/2 | E3/3+E4/3 D4/2 C4/1 D4/2 | G3/1+E4/3 F4/4 G4/5_2 |\n' +
              'C3/5+E4/3 D4/2 E3/3+C4/1 D4/2 | F3/2+F4/4 E4/3 E3/3+G4/5 E4/3 | D3/4+D4/2 F4/4 G3/1+G4/5 F4/4 | C3/5+E4/3 D4/2 C4/1_2' }
    ] },
    { id: 'dynamics', name: 'lessonDyn', desc: 'lessonDynDesc', steps: [
      { id: 'pf', type: 'learn' },
      { id: 'softloud', type: 'play', dyn: ['p', 'p', 'f', 'f'],
        text: 'C4/1 D4/2 E4/3 F4/4 | G4/5_4 | C4/1 D4/2 E4/3 F4/4 | G4/5_4' },
      { id: 'echo', type: 'play', dyn: ['f', 'f', 'p', 'p', 'f', 'f', 'p', 'p'],
        // "Hänschen klein" (German folk song, traditional)
        text: 'G4/5 E4/3 E4/3_2 | F4/4 D4/2 D4/2_2 | G4/5 E4/3 E4/3_2 | F4/4 D4/2 D4/2_2 |\n' +
              'C4/1 D4/2 E4/3 F4/4 | G4/5 G4/5 G4/5_2 | C4/1 D4/2 E4/3 F4/4 | G4/5 G4/5 G4/5_2' },
      { id: 'cresc', type: 'learn' },
      { id: 'louder', type: 'play', dyn: 'cresc',
        text: 'C4/1 D4/2 E4/3 F4/4 | G4/5 F4/4 E4/3 D4/2 | C4/1 D4/2 E4/3 F4/4 | G4/5_4' }
    ] },
    { id: 'alternate', name: 'lessonAlt', desc: 'lessonAltDesc', steps: [
      { id: 'ready', type: 'learn', pic: { from: 'C3', to: 'C5', marks: 'C3/5 D3/4 E3/3 F3/2 G3/1 C4/1 D4/2 E4/3 F4/4 G4/5' } },
      { id: 'pass', type: 'play', exact: true,
        text: 'C3/5 D3/4 E3/3 F3/2 | G3/1 C4/1 D4/2 E4/3 | F4/4 G4/5 F4/4 E4/3 | D4/2 C4/1 G3/1 F3/2 | E3/3 D3/4 C3/5_2' },
      { id: 'turns', type: 'play', exact: true,
        text: 'C3/5 C4/1 E3/3 E4/3 | G3/1 G4/5 E3/3 E4/3 | C3/5 C4/1_3' },
      { id: 'piece', type: 'play', exact: true,
        text: 'C3/5 D3/4 E3/3 F3/2 | G3/1 C4/1 D4/2 E4/3 | F4/4 G4/5 F4/4 E4/3 | D4/2 C4/1 G3/1 F3/2 |\n' +
              'E3/3 D3/4 C3/5_2 | C3/5 C4/1 E3/3 E4/3 | G3/1 G4/5 E3/3 E4/3 | C3/5 C4/1_3' }
    ] },
    { id: 'thumb', name: 'lessonThumb', desc: 'lessonThumbDesc', oldHand: 'R', steps: [
      { id: 'why', type: 'learn', pic: { from: 'C4', to: 'C5', names: 'all', marks: 'C4/1 D4/2 E4/3 F4/1 G4/2 A4/3 B4/4 C5/5' },
        listen: 'C4 D4 E4 F4 | G4 A4 B4 C5_2' },
      { id: 'prep', type: 'play', text: 'C4/1 D4/2 E4/3 F4/1 | G4/2_4 | C4/1 D4/2 E4/3 F4/1 | G4/2_4' },
      { id: 'up', type: 'play', text: 'C4/1 D4/2 E4/3 F4/1 | G4/2 A4/3 B4/4 C5/5' },
      { id: 'over', type: 'learn', pic: { from: 'C4', to: 'C5', names: 'all', marks: 'C4/1 D4/2 E4/3 F4/1 G4/2 A4/3 B4/4 C5/5' } },
      { id: 'down', type: 'play', text: 'C5/5 B4/4 A4/3 G4/2 | F4/1 E4/3 D4/2 C4/1' },
      { id: 'scale', type: 'play',
        text: 'C4/1 D4/2 E4/3 F4/1 | G4/2 A4/3 B4/4 C5/5 | B4/4 A4/3 G4/2 F4/1 | E4/3 D4/2 C4/1_2' }
    ] },
    { id: 'contrary', name: 'lessonContrary', desc: 'lessonContraryDesc', steps: [
      { id: 'mirror', type: 'learn', pic: { from: 'F2', to: 'G4', marks: 'F2/5 G2/4 A2/3 B2/2 C3/1 C4/1 D4/2 E4/3 F4/4 G4/5' } },
      { id: 'five', type: 'play',
        text: 'C3/1+C4/1 B2/2+D4/2 A2/3+E4/3 G2/4+F4/4 | F2/5+G4/5 G2/4+F4/4 A2/3+E4/3 B2/2+D4/2 | C3/1+C4/1_4' },
      { id: 'cross', type: 'learn', pic: { from: 'C2', to: 'C5', marks: 'C2/5 D2/4 E2/3 F2/2 G2/1 A2/3 B2/2 C3/1 C4/1 D4/2 E4/3 F4/1 G4/2 A4/3 B4/4 C5/5' },
        listen: 'C3+C4 B2+D4 A2+E4 G2+F4 | F2+G4 E2+A4 D2+B4 C2+C5_2' },
      { id: 'scale', type: 'play',
        text: 'C3/1+C4/1 B2/2+D4/2 A2/3+E4/3 G2/1+F4/1 | F2/2+G4/2 E2/3+A4/3 D2/4+B4/4 C2/5+C5/5 |\n' +
              'D2/4+B4/4 E2/3+A4/3 F2/2+G4/2 G2/1+F4/1 | A2/3+E4/3 B2/2+D4/2 C3/1+C4/1_2' }
    ] },
    { id: 'triads', name: 'lessonTriads', desc: 'lessonTriadsDesc', steps: [
      { id: 'triad', type: 'learn', pic: { from: 'C4', to: 'C5', names: 'all', marks: 'C4/1+E4/3+G4/5' },
        listen: 'C4 E4 G4 - | C4+E4+G4_2' },
      { id: 'c', type: 'play', text: 'C4/1 E4/3 G4/5 E4/3 | C4/1+E4/3+G4/5_4 | G4/5 E4/3 C4/1 E4/3 | C4/1+E4/3+G4/5_4' },
      { id: 'minor', type: 'learn', pic: { from: 'C4', to: 'C5', names: 'all', marks: 'C4/1+Eb4/3+G4/5' },
        listen: 'C4+E4+G4_2 C4+Eb4+G4_2' },
      { id: 'cm', type: 'play', text: 'C4/1+E4/3+G4/5_2 C4/1+Eb4/3+G4/5_2 | C4/1+E4/3+G4/5_2 C4/1+Eb4/3+G4/5_2 | C4/1+E4/3+G4/5_4' },
      { id: 'move', type: 'learn', pic: { from: 'C4', to: 'E5', names: 'all', marks: 'F4/1+A4/3+C5/5' },
        listen: 'C4+E4+G4_2 F4+A4+C5_2 | G4+B4+D5_2 C4+E4+G4_2' },
      { id: 'fg', type: 'play',
        text: 'F4/1+A4/3+C5/5_2 F4/1+Ab4/3+C5/5_2 | G4/1+B4/3+D5/5_2 G4/1+Bb4/3+D5/5_2 | C4/1+E4/3+G4/5_4' },
      { id: 'both', type: 'play', pic: { from: 'C3', to: 'C5', marks: 'C3/5+E3/3+G3/1 C4/1+E4/3+G4/5' },
        text: 'C3/5+E3/3+G3/1_2 C3/5+Eb3/3+G3/1_2 | C3/5+E3/3+G3/1_4 |\n' +
              'C3/5+E3/3+G3/1+C4/1+E4/3+G4/5_2 C3/5+Eb3/3+G3/1+C4/1+Eb4/3+G4/5_2 | C3/5+E3/3+G3/1+C4/1+E4/3+G4/5_4' }
    ] }
  ];

  function get(id) { return LIST.filter(function (l) { return l.id === id; })[0] || null; }
  function next(id) { var i = LIST.indexOf(get(id)); return i >= 0 ? LIST[i + 1] || null : null; }
  function stepIndex(l, sid) { for (var i = 0; i < l.steps.length; i++) if (l.steps[i].id === sid) return i; return -1; }
  function key(l, s, part) { return 'lx_' + l.id + '_' + s.id + '_' + part; }   // text key: t / x / h
  function plays(l) { return l.steps.filter(function (s) { return s.type === 'play'; }); }

  // A play step as a song for the practice screen (id "lesson:<id>"), or null.
  function song(id, sid) {
    var l = get(id), i = l ? stepIndex(l, sid) : -1, s = i >= 0 ? l.steps[i] : null;
    if (!s || s.type !== 'play') return null;
    return { id: 'lesson:' + l.id, title: '', kind: 'text', text: s.text, notes: parseSongText(s.text).notes,
      lesson: l.id, lessonStep: s.id, exact: !!s.exact };
  }
  // The play step to practise when a lesson is opened again at step `sid`: that one, the next one after it,
  // or the last one.
  function playFrom(l, sid) {
    var i = Math.max(0, stepIndex(l, sid)), ps = plays(l);
    for (var k = i; k < l.steps.length; k++) if (l.steps[k].type === 'play') return l.steps[k];
    return ps[ps.length - 1];
  }

  // The hands a song text uses: 'B', or 'R' / 'L' when it is for one hand only.
  function hands(text) {
    var hs = {};
    parseSongText(text).notes.forEach(function (n) { hs[n.h] = true; });
    return hs.R && hs.L ? 'B' : hs.R ? 'R' : 'L';
  }

  // The bar (1, 2, ...) of time t (seconds) in a song text; a pickup is bar 1.
  function barOf(text, t) {
    var p = parseSongText(text), barLen = p.meter[0] * 4 / p.meter[1], pick = p.pickup || 0;
    return Math.max(0, Math.floor((t / BEAT_SEC - pick) / barLen + 1e-6) + (pick ? 1 : 0)) + 1;
  }

  // The keyboard picture of a step: its own, or for a play step the keys it uses, each with its
  // (first) finger, from the C below the lowest key to the C above the highest.
  function picFor(step) {
    if (step.pic) return step.pic;
    if (step.type !== 'play') return null;
    var seen = {}, marks = [], lo = 127, hi = 0;
    parseSongText(step.text).notes.forEach(function (n) {
      lo = Math.min(lo, n.m); hi = Math.max(hi, n.m);
      if (seen[n.m]) return;
      seen[n.m] = true;
      marks.push(n.h + ':' + midiToName(n.m) + (n.f ? '/' + n.f : ''));
    });
    if (!marks.length) return null;
    var from = lo - lo % 12, to = hi + (12 - hi % 12) % 12;
    if (to - from < 12) to = from + 12;
    return { from: midiToName(from), to: midiToName(to), marks: marks.join(' ') };
  }

  // Progress of one lesson: { p: { <play step id>: 1 }, at: <step id last opened> }.
  // 'new', 'tried' or 'done'. best: the app's best scores (old lessons: "lesson:<id>:<hand>" -> %).
  function passedCount(l, pr) {
    return plays(l).filter(function (s) { return pr && pr.p && pr.p[s.id]; }).length;
  }
  function status(l, pr, best) {
    var legacy = false, any = false;
    ['B', 'R', 'L'].forEach(function (x) {
      var v = best && best['lesson:' + l.id + ':' + x];
      if (v == null) return;
      any = true;
      if (v >= LEGACY && (x === 'B' || x === l.oldHand)) legacy = true;
    });
    if (legacy || passedCount(l, pr) === plays(l).length) return 'done';
    return any || (pr && (pr.at || passedCount(l, pr))) ? 'tried' : 'new';
  }
  var MARK = { 'new': '○', tried: '◐', done: '✓' };

  // ---- the "hold" check: long notes must stay down until they end
  // Notes of hand h that last 2 beats or more: [{ m, t, end }] (seconds). A note lasts until that hand's
  // next note or the bar line, as in the sheet music.
  function holdSpans(text, h) {
    var p = parseSongText(text), barLen = p.meter[0] * 4 / p.meter[1], pick = p.pickup || 0;
    var ns = p.notes.filter(function (n) { return n.h === h; });
    var out = [];
    ns.forEach(function (n) {
      var b = n.t / BEAT_SEC, nextT = Infinity;
      ns.forEach(function (x) { if (x.t > n.t + 0.01 && x.t < nextT) nextT = x.t; });
      var barEnd = (Math.floor((b - pick) / barLen + 1e-6) + 1) * barLen + pick;
      var end = Math.min(nextT / BEAT_SEC, barEnd);
      if (end - b >= 2 - 1e-6) out.push({ m: n.m, t: n.t, end: end * BEAT_SEC, h: h });
    });
    return out;
  }
  // Key m was let go while the step at time `now` (seconds) is to be played: the span it was cut short, or null.
  function holdBroken(spans, m, now) {
    for (var i = 0; i < spans.length; i++) {
      var s = spans[i];
      if (s.m === m && s.t < now - 0.01 && now < s.end - 0.01) return s;
    }
    return null;
  }

  // ---- the "loud and soft" check (MIDI velocity)
  // The dynamic wanted at time t (seconds): 'p', 'f', 'cresc' or null.
  function dynAt(step, t) {
    if (!step || !step.dyn) return null;
    if (step.dyn === 'cresc') return 'cresc';
    return step.dyn[Math.min(barOf(step.text, t), step.dyn.length) - 1];
  }
  function mean(a) { return a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : 0; }
  // recs: [{ t, v }] (v = velocity, null from the screen or computer keys).
  // -> { ok, noPiano, soft, loud } for p/f, { ok, noPiano, first, last } for cresc.
  function dynCheck(step, recs) {
    if (!recs.length || recs.some(function (r) { return r.v == null; })) return { ok: false, noPiano: true };
    if (step.dyn === 'cresc') {
      var rs = recs.slice().sort(function (a, b) { return a.t - b.t; }), k = Math.max(1, Math.floor(rs.length / 3));
      var first = mean(rs.slice(0, k).map(function (r) { return r.v; })), last = mean(rs.slice(-k).map(function (r) { return r.v; }));
      return { ok: last - first >= DYN_GAP, first: Math.round(first), last: Math.round(last) };
    }
    var soft = [], loud = [];
    recs.forEach(function (r) { (dynAt(step, r.t) === 'p' ? soft : loud).push(r.v); });
    var ms = mean(soft), ml = mean(loud), mid = (ms + ml) / 2;
    var right = soft.filter(function (v) { return v < mid; }).length + loud.filter(function (v) { return v > mid; }).length;
    return { ok: soft.length > 0 && loud.length > 0 && ml - ms >= DYN_GAP && right >= 0.8 * recs.length,
      soft: Math.round(ms), loud: Math.round(ml) };
  }

  // ---- keyboard picture (SVG text): keys from..to, marks (song text: keys with finger numbers, hand colours),
  // names: 'all' (white keys) / 'c' (only C) / none, lit: { midi: 'on' | 'ok' | 'bad' | 'play' }
  function keysSvg(pic, lit) {
    var lo = parseNoteName(pic.from), hi = parseNoteName(pic.to), W = 20, H = 92, BW = 12, BH = 56;
    var marks = {};
    if (pic.marks) parseSongText(pic.marks).notes.forEach(function (n) { marks[n.m] = n; });
    lit = lit || {};
    var whites = [], x = {}, out = [];
    for (var m = lo; m <= hi; m++) if (!isBlack(m)) { x[m] = whites.length * W; whites.push(m); }
    for (var b = lo; b <= hi; b++) if (isBlack(b)) x[b] = (x[b - 1] != null ? x[b - 1] + W : 0) - BW / 2;
    var w = whites.length * W, dense = whites.length > 30;
    out.push('<svg class="kpic" viewBox="-1 -1 ' + (w + 2) + ' ' + (H + 2) + '" role="img" aria-hidden="true">');
    var mark = function (m, cx, cy, white) {
      var n = marks[m];
      if (!n) return '';
      var r = dense ? 4 : 7;
      return '<circle class="km ' + n.h + '" cx="' + cx + '" cy="' + cy + '" r="' + r + '"/>' +
        (n.f && !dense ? '<text class="kf' + (white ? '' : ' on-black') + '" x="' + cx + '" y="' + (cy + 4) + '">' + n.f + '</text>' : '');
    };
    whites.forEach(function (m) {
      out.push('<rect class="kw' + (lit[m] ? ' ' + lit[m] : '') + '" x="' + x[m] + '" y="0" width="' + W + '" height="' + H + '" rx="2"/>');
    });
    whites.forEach(function (m) {
      var name = midiToName(m), letter = name.replace(/-?\d+$/, '');
      out.push(mark(m, x[m] + W / 2, H - 26, true));
      if (pic.names === 'all' || (pic.names === 'c' && letter === 'C')) {
        out.push('<text class="kn" x="' + (x[m] + W / 2) + '" y="' + (H - 6) + '">' +
          (letter === 'C' && pic.names === 'c' ? localNoteName(name) : localNoteName(letter)) + '</text>');
      }
    });
    for (var k = lo; k <= hi; k++) {
      if (!isBlack(k)) continue;
      out.push('<rect class="kb' + (lit[k] ? ' ' + lit[k] : '') + '" x="' + x[k] + '" y="0" width="' + BW + '" height="' + BH + '" rx="1.5"/>');
      out.push(mark(k, x[k] + BW / 2, BH - 12, false));
    }
    out.push('</svg>');
    return out.join('');
  }

  // ---- "find" steps: does key m count? (find: 'C' = any C, 'C4' = that key)
  function findMatch(step, m) {
    if (/\d/.test(step.find)) return m === parseNoteName(step.find);
    return (m - parseNoteName(step.find + '4') + 1200) % 12 === 0;
  }

  return { LIST: LIST, PASS: PASS, MARK: MARK, get: get, next: next, stepIndex: stepIndex, key: key, plays: plays,
    song: song, playFrom: playFrom, hands: hands, barOf: barOf, picFor: picFor, passedCount: passedCount, status: status,
    holdSpans: holdSpans, holdBroken: holdBroken, dynAt: dynAt, dynCheck: dynCheck, keysSvg: keysSvg, findMatch: findMatch };
})();

if (typeof module !== 'undefined') module.exports = { Lessons: Lessons };
