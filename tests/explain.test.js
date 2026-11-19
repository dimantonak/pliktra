'use strict';
const test = require('node:test');
const assert = require('node:assert');
// explain.js is a browser script that uses the globals of i18n.js and notation.js.
const L = require('../js/i18n.js');
Object.assign(globalThis, L, require('../js/notation.js'));
const { Explain } = require('../js/explain.js');

// A text is complete when it isn't a key name (t() returns the key when a text is missing)
// and no {placeholder} is left in it.
const KEYS = new Set(Object.keys(L.I18N.en));
function complete(c) {
  for (const s of [c.title].concat(c.lines, c.tips || [])) {
    assert.ok(s, 'empty text');
    assert.ok(!KEYS.has(s), 'missing text: ' + s);
    assert.ok(!/\{\w+\}/.test(s), 'placeholder left: ' + s);
  }
}

test('where a note sits on the staff', () => {
  const p = (n, c) => { const r = Explain.staffPosition(n, c); return r.key + (r.n != null ? r.n : ''); };
  assert.equal(p('E4', 'treble'), 'posLine1');
  assert.equal(p('F4', 'treble'), 'posSpace1');
  assert.equal(p('G4', 'treble'), 'posLine2');      // the G line the clef circles
  assert.equal(p('F5', 'treble'), 'posLine5');
  assert.equal(p('D4', 'treble'), 'posJustBelow');
  assert.equal(p('C4', 'treble'), 'posLedgerBelow1'); // middle C
  assert.equal(p('B3', 'treble'), 'posBelowLedger1');
  assert.equal(p('A3', 'treble'), 'posLedgerBelow2');
  assert.equal(p('G5', 'treble'), 'posJustAbove');
  assert.equal(p('A5', 'treble'), 'posLedgerAbove1');
  assert.equal(p('G2', 'bass'), 'posLine1');
  assert.equal(p('F3', 'bass'), 'posLine4');          // the F line between the clef's dots
  assert.equal(p('C4', 'bass'), 'posLedgerAbove1');   // middle C from below
  assert.equal(p('Bb3', 'bass'), 'posJustAbove');
});

test('beats are written with fractions', () => {
  assert.equal(Explain.fmtBeats(1), '1');
  assert.equal(Explain.fmtBeats(1.5), '1½');
  assert.equal(Explain.fmtBeats(0.25), '¼');
  assert.equal(Explain.fmtBeats(0.75), '¾');
  assert.equal(Explain.fmtBeats(3), '3');
});

const DURS = [['w', false, 4], ['h', true, 3], ['h', false, 2], ['q', true, 1.5], ['q', false, 1],
  ['8', true, 0.75], ['8', false, 0.5], ['16', true, 0.375], ['16', false, 0.25], ['32', false, 0.125]];

for (const lang of Object.keys(L.LANGS)) {
  test('every symbol has a complete explanation in ' + lang, () => {
    L.setLang(lang);
    for (const [dur, dotted, len] of DURS) {
      complete(Explain.card({ type: 'note', dur, dotted, len, hand: 'R', first: true, notes: [{ m: 64, s: 'E4', f: 3 }], acc: {} }, [4, 4]));
      complete(Explain.card({ type: 'rest', dur, dotted, len, hand: 'L' }, [4, 4]));
    }
    complete(Explain.card({ type: 'rest', dur: 'w', len: 3, whole: true, hand: 'R' }, [3, 4]));
    complete(Explain.card({ type: 'note', dur: 'q', len: 1, hand: 'L', first: false, tieNext: true, beam: false,
      notes: [{ m: 48, s: 'C3' }, { m: 54, s: 'F#3', f: 2 }, { m: 60, s: 'C4', f: 1 }], acc: { 1: '#' } }, [4, 4]));
    complete(Explain.card({ type: 'note', dur: '8', len: 0.5, hand: 'R', first: true, beam: true, notes: [{ m: 70, s: 'Bb4' }], acc: {} }, [6, 8]));
    for (const info of [{ type: 'clef', clef: 'treble' }, { type: 'clef', clef: 'bass' }, { type: 'time' }, { type: 'bar' },
      { type: 'bar', final: true }, { type: 'brace' }]) complete(Explain.card(info, [3, 4]));
    for (const g of Explain.glossary()) complete({ title: g.title, lines: [g.text] });
    L.setLang('en');
  });
}

test('what a card says', () => {
  L.setLang('en');
  const c = Explain.card({ type: 'note', dur: 'q', dotted: true, len: 1.5, hand: 'R', first: true, tieNext: false,
    notes: [{ m: 60, s: 'C4', f: 1 }], acc: {} }, [4, 4]);
  assert.equal(c.title, 'Dotted quarter note');
  assert.ok(c.lines.includes('Lasts 1½ beats.'));
  assert.ok(c.lines.includes('The dot adds half the length: 1 + ½ = 1½ beats.'));
  assert.ok(c.lines.includes('C4 (middle C): on ledger line 1 below the staff, finger 1'));
  assert.deepEqual(c.keys, { 60: 'R' });

  // 6/8: an eighth note is one beat, so a quarter lasts 2
  assert.ok(Explain.card({ type: 'note', dur: 'q', len: 1, hand: 'R', first: true, notes: [{ m: 64 }], acc: {} }, [6, 8]).lines.includes('Lasts 2 beats.'));
  const time = Explain.card({ type: 'time' }, [3, 4]);
  assert.equal(time.title, 'Time signature 3/4');
  assert.ok(time.lines.includes('Count: 1 2 3'));

  // a sharp shown on the note, and one carried over from earlier in the bar
  const shown = Explain.card({ type: 'note', dur: 'q', len: 1, hand: 'R', first: true, notes: [{ m: 66, s: 'F#4' }], acc: { 0: '#' } }, [4, 4]);
  assert.ok(shown.lines.some(l => l.startsWith('♯ Sharp')));
  const carried = Explain.card({ type: 'note', dur: 'q', len: 1, hand: 'R', first: true, notes: [{ m: 66, s: 'F#4' }], acc: {} }, [4, 4]);
  assert.ok(carried.lines.some(l => l.startsWith('No ♯ or ♭')));

  L.setLang('de');
  const de = Explain.card({ type: 'note', dur: 'h', len: 2, hand: 'L', first: true, notes: [{ m: 59, s: 'B3', f: 1 }], acc: {} }, [4, 4]);
  assert.equal(de.title, 'Halbe Note');
  assert.ok(de.lines.includes('H3: direkt über den Notenlinien, Finger 1'), de.lines.join(' | '));   // B3 in the bass staff
  L.setLang('en');
});
