// Note reading drills: endless, freshly generated rounds of single notes to read from the sheet music
// (so they can't be learnt by heart). Each round is ordinary song text, so the sheet music, reading
// mode, explanations and scores work as for any song. Uses notation.js and i18n.js.
'use strict';

var Drills = (function () {
  var ROUND = 16;   // notes per round (4 bars of quarter notes)
  var LETTERS = 'CDEFGAB';

  // R / L: the notes each hand reads. A range [low, high] means every white key in it;
  // a list means exactly these notes. keys: one of these key signatures is used per round.
  var LEVELS = [
    { id: 'landmarks', name: 'drillLandmarks', R: ['C4', 'G4', 'C5'], L: ['C3', 'F3'], leaps: true },
    { id: 'right5', name: 'drillRight5', R: { range: ['C4', 'G4'] } },
    { id: 'left5', name: 'drillLeft5', L: { range: ['C3', 'G3'] } },
    { id: 'treble', name: 'drillTreble', R: { range: ['C4', 'G5'] } },
    { id: 'bass', name: 'drillBass', L: { range: ['F2', 'C4'] } },
    { id: 'grand', name: 'drillGrand', R: { range: ['C4', 'G5'] }, L: { range: ['F2', 'B3'] } },
    { id: 'ledger', name: 'drillLedger', R: ['A3', 'B3', 'C4', 'D4', 'G5', 'A5', 'B5', 'C6', 'D6'],
      L: ['C2', 'D2', 'E2', 'F2', 'G2', 'A3', 'B3', 'C4', 'D4', 'E4'], leaps: true },
    { id: 'keys', name: 'drillKeys', R: { range: ['C4', 'G5'] }, keys: ['G', 'F'] }
  ];

  function level(id) { return LEVELS.filter(function (l) { return l.id === id; })[0] || null; }
  function diatonic(name) { var r = /^([A-G])(-?\d)$/.exec(name); return LETTERS.indexOf(r[1]) + 7 * +r[2]; }
  function fromDiatonic(d) { return LETTERS[((d % 7) + 7) % 7] + Math.floor(d / 7); }
  // The plain note names a hand reads in this level, low to high.
  function pool(spec) {
    if (!spec) return [];
    if (Array.isArray(spec)) return spec.slice();
    var out = [];
    for (var d = diatonic(spec.range[0]); d <= diatonic(spec.range[1]); d++) out.push(fromDiatonic(d));
    return out;
  }
  // In a key, the letters it changes get their ♯/♭: in G, F4 -> F#4.
  function inKey(name, key) {
    var a = keyAccidentals(key)[name[0]];
    return a ? name[0] + (a > 0 ? '#' : 'b') + name.slice(1) : name;
  }

  // Mostly steps and small leaps, as in real music; never the same note three times in a row.
  var MOVES = [[1, 5], [2, 4], [3, 2], [4, 1], [5, 0.5]];
  function walkStep(i, n, rnd) {
    var total = 0, k, pick;
    MOVES.forEach(function (mv) { total += mv[1]; });
    pick = rnd() * total;
    for (k = 0; k < MOVES.length - 1 && pick >= MOVES[k][1]; k++) pick -= MOVES[k][1];
    var d = MOVES[k][0] * (rnd() < 0.5 ? -1 : 1);
    var j = i + d;
    if (j < 0 || j >= n) j = i - d;           // bounce off the ends of the range
    return Math.max(0, Math.min(n - 1, j));
  }

  // -> [{ name, hand }] with ROUND notes.
  // opts: { random: () => 0..1, focus: [{ name, hand }] = notes to practise more (missed last round) }
  function notes(lv, opts) {
    var rnd = (opts && opts.random) || Math.random, focus = (opts && opts.focus) || [];
    var hands = ['R', 'L'].filter(function (h) { return lv[h]; });
    var pools = {}, pos = {}, out = [];
    hands.forEach(function (h) { pools[h] = pool(lv[h]); pos[h] = Math.floor(pools[h].length / 2); });
    var hand = hands[Math.floor(rnd() * hands.length)];
    for (var k = 0; k < ROUND; k++) {
      if (hands.length > 1 && k > 0 && rnd() < (lv.leaps ? 0.5 : 0.3)) hand = hand === 'R' ? 'L' : 'R';   // switch staves
      var p = pools[hand], i;
      if (lv.leaps) {   // any note of the list, but not the one just played
        do { i = Math.floor(rnd() * p.length); } while (p.length > 1 && out.length && out[out.length - 1].name === p[i]);
      } else {
        i = k === 0 || out[out.length - 1].hand !== hand ? Math.floor(rnd() * p.length) : walkStep(pos[hand], p.length, rnd);
        var a = out[out.length - 1], b = out[out.length - 2];
        if (a && b && a.name === p[i] && b.name === p[i]) i = walkStep(i, p.length, rnd);
      }
      pos[hand] = i;
      out.push({ name: p[i], hand: hand });
    }
    // Missed notes from the last round: put them in about every other place.
    if (focus.length) {
      for (var f = 0; f < ROUND; f += 2) {
        var fn = focus[Math.floor(rnd() * focus.length)];
        var at = Math.min(ROUND - 1, f + (rnd() < 0.5 ? 0 : 1)), old = out[at];
        out[at] = { name: fn.name, hand: fn.hand, focus: true };
        if (threeInARow(out, at)) out[at] = old;
      }
    }
    return out;
  }
  // True if the note at i is part of the same note three times in a row.
  function threeInARow(out, i) {
    for (var s = Math.max(0, i - 2); s <= i && s + 2 < out.length; s++) {
      if (out[s].name === out[s + 1].name && out[s].name === out[s + 2].name) return true;
    }
    return false;
  }

  // A round as song text, e.g. "key:G R:B4 D5 F#4 G4 | ...". Focus names are written as played (F#4);
  // other notes get the key's ♯/♭.
  function generate(id, opts) {
    var lv = level(id);
    if (!lv) return '';
    var rnd = (opts && opts.random) || Math.random;
    var key = lv.keys ? lv.keys[Math.floor(rnd() * lv.keys.length)] : 'C';
    if (opts && opts.key && lv.keys) key = opts.key;
    var words = notes(lv, opts).map(function (n, k) {
      var name = n.focus ? n.name : inKey(n.name, key);
      var autoHand = parseNoteName(name) >= 60 ? 'R' : 'L';
      return (k && k % 4 === 0 ? '| ' : '') + (n.hand !== autoHand ? n.hand + ':' : '') + name;
    });
    return (key !== 'C' ? 'key:' + key + ' ' : '') + words.join(' ');
  }

  // A level's description for the list, e.g. "C4 to G4" (note names in the app's language).
  function describe(lv) {
    function rangeText(spec) { return t('drillRange', { a: localNoteName(spec.range[0]), b: localNoteName(spec.range[1]) }); }
    if (lv.id === 'landmarks') return t('drillLandmarksDesc', { list: lv.L.concat(lv.R).map(localNoteName).join(', ') });
    if (lv.id === 'grand') return t('drillGrandDesc');
    if (lv.id === 'ledger') return t('drillLedgerDesc');
    if (lv.id === 'keys') return t('drillKeysDesc');
    return rangeText(lv.R || lv.L);
  }

  return { LEVELS: LEVELS, ROUND: ROUND, level: level, notes: notes, generate: generate, describe: describe };
})();

if (typeof module !== 'undefined') module.exports = { Drills: Drills };
