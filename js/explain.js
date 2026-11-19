// Explanations of the symbols in the sheet music: tap a note, rest, clef, key or time signature
// or bar line in the sheet view to see what it means (and the keys light up on the keyboard).
// Also the "What the symbols mean" list in the settings. All texts are in js/i18n.js.
'use strict';

var Explain = (function () {
  var FRACTIONS = { 0.125: '⅛', 0.25: '¼', 0.375: '⅜', 0.5: '½', 0.625: '⅝', 0.75: '¾', 0.875: '⅞' };
  var CLEF_BOTTOM = { treble: 30, bass: 18 };   // diatonic number of the bottom line: E4, G2

  // 1.5 -> "1½", 0.25 -> "¼", 3 -> "3"
  function fmtBeats(x) {
    var whole = Math.floor(x + 1e-6), rest = Math.round((x - whole) * 1000) / 1000;
    if (!rest) return String(whole);
    if (FRACTIONS[rest]) return (whole || '') + FRACTIONS[rest];
    return String(Math.round(x * 100) / 100);
  }
  // Length in quarter-note beats -> beats of this time signature (in 6/8 an eighth is one beat).
  function beatsIn(len, meter) { return len * meter[1] / 4; }
  function beatsText(oneKey, manyKey, beats) {
    return t(beats <= 1 + 1e-6 ? oneKey : manyKey, { n: fmtBeats(beats) });
  }

  function diatonic(name) {
    var r = /^([A-G])[#b]?(-?\d+)$/.exec(name);
    return r ? 'CDEFGAB'.indexOf(r[1]) + 7 * +r[2] : null;
  }
  // Where a note sits on the staff, counted from the bottom: { key, n, ledger }.
  function staffPosition(name, clef) {
    var p = diatonic(name) - CLEF_BOTTOM[clef];
    if (p >= 0 && p <= 8) return p % 2 ? { key: 'posSpace', n: (p + 1) / 2 } : { key: 'posLine', n: p / 2 + 1 };
    if (p === -1) return { key: 'posJustBelow' };
    if (p === 9) return { key: 'posJustAbove' };
    if (p < 0) return p % 2 ? { key: 'posBelowLedger', n: (-p - 1) / 2, ledger: true } : { key: 'posLedgerBelow', n: -p / 2, ledger: true };
    return p % 2 ? { key: 'posAboveLedger', n: (p - 9) / 2, ledger: true } : { key: 'posLedgerAbove', n: (p - 8) / 2, ledger: true };
  }

  function symbolKey(rest, dur, dotted) { return 'sym_' + (rest ? 'rest' : 'note') + dur + (dotted ? 'd' : ''); }
  function handLine(hand) { return t(hand === 'L' ? 'handLineL' : 'handLineR'); }
  function dotLine(beats) {
    var base = beats / 1.5;
    return t('dotRule', { a: fmtBeats(base), b: fmtBeats(base / 2), c: fmtBeats(beats) });
  }
  // "F#" -> "F♯" (English) / "Fis" (German); "Bb" -> "B♭" / "B"; "B" -> "B" / "H"
  function accName(name) {
    var l = localNoteName(name);
    return l !== name ? l : name.replace('#', '♯').replace(/^([A-G])b/, '$1♭');
  }
  function noteName(n) {
    var s = n.s || midiToName(n.m);
    return localNoteName(s) + (n.m === 60 ? ' (' + t('middleC') + ')' : '');
  }

  // info comes from Sheet.render's hits; key is the song's key signature ("C" = none).
  // Returns { title, lines: [...], tips: [...], keys: { midi: hand }, noPlay }.
  function card(info, meter, key) {
    key = key || 'C';
    var lines = [], tips = [], keys = {}, title, noPlay = false;   // tips: general rules, shown smaller
    if (info.type === 'note') {
      var clef = info.hand === 'L' ? 'bass' : 'treble';
      var beats = beatsIn(info.len, meter), anyLedger = false, anyFinger = false;
      var notes = info.notes.slice().sort(function (a, b) { return b.m - a.m; });   // top note first, as on paper
      title = notes.length > 1 ? t('chordTitle', { n: notes.length }) : t(symbolKey(false, info.dur, info.dotted));
      if (notes.length > 1) lines.push(t('chordLine', { name: t(symbolKey(false, info.dur, info.dotted)), n: notes.length }));
      lines.push(beatsText('lastsBeat1', 'lastsBeats', beats));
      if (info.dotted) lines.push(dotLine(beats));
      notes.forEach(function (n) {
        var pos = staffPosition(n.s || midiToName(n.m), clef);
        if (pos.ledger) anyLedger = true;
        var line = t('noteLine', { name: noteName(n), pos: t(pos.key, { n: pos.n }) });
        if (n.f) { line += t('fingerPart', { f: n.f }); anyFinger = true; }
        lines.push(line);
        keys[n.m] = info.hand;
      });
      if (anyFinger) tips.push(t('fingerInfo'));
      if (anyLedger) tips.push(t('ledgerInfo'));
      // ♯/♭/♮ drawn in front of the note, or not drawn because the key signature or an earlier sign says it
      var acc = info.acc || {}, shown = {}, fromKey = [], carried = false, carriedNat = false, keyAcc = keyAccidentals(key);
      Object.keys(acc).forEach(function (i) { shown[acc[i]] = true; });
      info.notes.forEach(function (n, i) {   // info.notes is low -> high, like the accidental indexes
        if (acc[i]) return;
        var r = /^([A-G])([#b]?)/.exec(n.s || midiToName(n.m)), own = r[2] === '#' ? 1 : r[2] === 'b' ? -1 : 0;
        if (own && own === keyAcc[r[1]]) { if (fromKey.indexOf(r[0]) < 0) fromKey.push(r[0]); }
        else if (own) carried = true;
        else if (keyAcc[r[1]]) carriedNat = true;
      });
      if (shown['#']) lines.push(t('accSharp'));
      if (shown.b) lines.push(t('accFlat'));
      if (shown.n) lines.push(t('accNatural'));
      fromKey.forEach(function (nm) {
        lines.push(t('accKey', { sig: nm[1] === '#' ? '♯' : '♭', l: accName(nm[0]), name: accName(nm) }));
      });
      if (carried) lines.push(t('accCarry'));
      if (carriedNat) lines.push(t('accCarryNat'));
      if (!info.first) lines.push(t('tieEnd'));
      if (info.tieNext) lines.push(t('tieStart'));
      lines.push(handLine(info.hand));
      if (info.beam) tips.push(t('beamInfo'));
    } else if (info.type === 'rest') {
      var rb = beatsIn(info.len, meter);
      title = t(info.whole ? 'sym_restw' : symbolKey(true, info.dur, info.dotted));
      lines.push(beatsText('silentBeat1', 'silentBeats', rb));
      if (info.dotted) lines.push(dotLine(rb));
      if (info.whole) lines.push(t('restBar'));
      lines.push(handLine(info.hand));
    } else if (info.type === 'clef') {
      title = t(info.clef === 'bass' ? 'clefB' : 'clefT');
      lines.push(t(info.clef === 'bass' ? 'clefBInfo' : 'clefTInfo', { n: localNoteName(info.clef === 'bass' ? 'F3' : 'G4') }));
    } else if (info.type === 'time') {
      title = t('timeT', { a: meter[0], b: meter[1] });
      lines.push(t('timeTop', { a: meter[0] }));
      lines.push(t({ 2: 'timeBottom2', 8: 'timeBottom8', 16: 'timeBottom16' }[meter[1]] || 'timeBottom4'));
      var count = [];
      for (var i = 1; i <= meter[0]; i++) count.push(i);
      lines.push(t('timeCount', { c: count.join(' ') }));
    } else if (info.type === 'key') {
      var kc = keyCount(key), ka = keyAccidentals(key), sig = kc > 0 ? '♯' : '♭', pair = keyPair(key);
      var items = Object.keys(ka).map(function (L) { return t('keyAs', { a: accName(L), b: accName(L + (kc > 0 ? '#' : 'b')) }); });
      title = t('keyT', { k: localKeyName(key) });
      lines.push(t('keyLine', { n: Math.abs(kc), sig: sig,
        list: items.length > 1 ? items.slice(0, -1).join(', ') + t('and') + items[items.length - 1] : items[0] }));
      lines.push(t('keyAll', { sig: sig }));
      lines.push(t('keyCancel'));
      tips.push(t('keyPairInfo', { n: Math.abs(kc), sig: sig, maj: localKeyName(pair[0]), min: localKeyName(pair[1]) }));
      tips.push(t(kc > 0 ? 'keyOrderSharp' : 'keyOrderFlat'));
      // light every key the signature changes, all over the keyboard
      var pcs = Object.keys(ka).map(function (L) { return ({ C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[L] + ka[L] + 12) % 12; });
      for (var km = 21; km <= 108; km++) if (pcs.indexOf(km % 12) >= 0) keys[km] = km < 60 ? 'L' : 'R';
      noPlay = true;
    } else if (info.type === 'bar') {
      title = t(info.final ? 'endT' : 'barT');
      lines.push(info.final ? t('endInfo') : t('barInfo', { n: meter[0] }));
    } else if (info.type === 'brace') {
      title = t('braceT');
      lines.push(t('braceInfo'));
    }
    return { title: title, lines: lines, tips: tips, keys: keys, noPlay: noPlay };
  }

  // "What the symbols mean": [{ pic: drawing for Sheet.mini (or null), title, text }]
  function glossary() {
    function dur(rest, d, dotted, len, pic) {
      return { pic: pic, title: t(symbolKey(rest, d, dotted)),
        text: beatsText(rest ? 'silentBeat1' : 'lastsBeat1', rest ? 'silentBeats' : 'lastsBeats', len) };
    }
    function n(keys, d, more) { var o = { keys: keys, dur: d }; for (var k in more || {}) o[k] = more[k]; return o; }
    return [
      { pic: { clef: 'treble' }, title: t('clefT'), text: t('clefTInfo', { n: localNoteName('G4') }) },
      { pic: { clef: 'bass' }, title: t('clefB'), text: t('clefBInfo', { n: localNoteName('F3') }) },
      { pic: { time: '3/4' }, title: t('timeName'), text: t('timeGloss') },
      { pic: { clef: 'treble', key: 'G' }, title: t('keySigT'), text: t('keyGloss') },
      dur(false, 'w', false, 4, { notes: [n(['b/4'], 'w')] }),
      dur(false, 'h', false, 2, { notes: [n(['b/4'], 'h')] }),
      dur(false, 'q', false, 1, { notes: [n(['b/4'], 'q')] }),
      dur(false, '8', false, 0.5, { notes: [n(['b/4'], '8'), n(['b/4'], '8')], beam: true }),
      dur(false, '16', false, 0.25, { notes: [n(['b/4'], '16'), n(['b/4'], '16'), n(['b/4'], '16'), n(['b/4'], '16')], beam: true }),
      { pic: { notes: [n(['b/4'], 'h', { dot: true })] }, title: t('sym_notehd'), text: t('dotRule', { a: '2', b: '1', c: '3' }) },
      { pic: { notes: [n(['b/4'], 'q', { dot: true }), n(['b/4'], '8')] }, title: t('sym_noteqd'), text: t('dotRule', { a: '1', b: '½', c: '1½' }) },
      dur(true, 'w', false, 4, { notes: [n(['d/5'], 'w', { rest: true })] }),
      dur(true, 'h', false, 2, { notes: [n(['b/4'], 'h', { rest: true })] }),
      dur(true, 'q', false, 1, { notes: [n(['b/4'], 'q', { rest: true })] }),
      dur(true, '8', false, 0.5, { notes: [n(['b/4'], '8', { rest: true })] }),
      { pic: { notes: [n(['g/4'], 'q'), n(['g/4'], 'q')], tie: true }, title: t('tieT'), text: t('tieStart') },
      { pic: { notes: [n(['f/4'], 'q', { acc: '#' })] }, title: t('sharpT'), text: t('accSharp') },
      { pic: { notes: [n(['b/4'], 'q', { acc: 'b' })] }, title: t('flatT'), text: t('accFlat') },
      { pic: { notes: [n(['f/4'], 'q', { acc: 'n' })] }, title: t('naturalT'), text: t('accNatural') },
      { pic: { notes: [n(['c/4'], 'q')] }, title: t('ledgerT'), text: t('ledgerInfo') },
      { pic: { notes: [n(['b/4'], 'q'), n(['b/4'], 'q')], bar: true }, title: t('barT'), text: t('barGloss') },
      { pic: { notes: [n(['b/4'], 'h')], end: true }, title: t('endT'), text: t('endInfo') },
      { pic: null, title: t('fingerT'), text: t('fingerInfo') }
    ];
  }

  return { card: card, glossary: glossary, staffPosition: staffPosition, fmtBeats: fmtBeats };
})();

if (typeof module !== 'undefined') module.exports = { Explain: Explain };
