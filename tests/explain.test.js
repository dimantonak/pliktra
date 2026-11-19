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
    for (const key of ['G', 'F', 'D', 'Bb', 'Em', 'F#m', 'C#', 'Cb']) complete(Explain.card({ type: 'key' }, [4, 4], key));
    complete(Explain.card({ type: 'time' }, [3, 16]));
    complete(Explain.card({ type: 'note', dur: 'q', len: 1, hand: 'R', first: true, notes: [{ m: 66 }, { m: 70, s: 'Bb4' }], acc: {} }, [4, 4], 'G'));
    complete(Explain.card({ type: 'note', dur: 'q', len: 1, hand: 'R', first: true, notes: [{ m: 65 }], acc: {} }, [4, 4], 'G'));
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

  // key signatures
  const g = Explain.card({ type: 'key' }, [4, 4], 'G');
  assert.equal(g.title, 'Key signature: G major');
  assert.ok(g.lines.includes('1 ♯ right after the clef: play F as F♯.'), g.lines.join(' | '));
  assert.ok(g.tips.includes('1 ♯: the key signature of G major and E minor.'));
  assert.ok(g.noPlay);
  assert.equal(g.keys[66], 'R');
  assert.equal(g.keys[54], 'L');
  assert.equal(Object.keys(g.keys).length, 7);   // every F♯ on the keyboard
  assert.ok(Explain.card({ type: 'key' }, [4, 4], 'Bb').lines.includes('2 ♭ right after the clef: play B as B♭ and E as E♭.'));
  const fs = Explain.card({ type: 'note', dur: 'q', len: 1, hand: 'R', first: true, notes: [{ m: 66 }], acc: {} }, [4, 4], 'G');
  assert.ok(fs.lines.includes('♯ from the key signature: every F is played as F♯.'), fs.lines.join(' | '));
  assert.ok(!fs.lines.some(l => l.startsWith('No ♯ or ♭')));
  const fn = Explain.card({ type: 'note', dur: 'q', len: 1, hand: 'R', first: true, notes: [{ m: 65 }], acc: { 0: 'n' } }, [4, 4], 'G');
  assert.ok(fn.lines.some(l => l.startsWith('♮ Natural')));
  const fnLater = Explain.card({ type: 'note', dur: 'q', len: 1, hand: 'R', first: true, notes: [{ m: 65 }], acc: {} }, [4, 4], 'G');
  assert.ok(fnLater.lines.some(l => l.startsWith('No sign in front of it')));
  assert.ok(Explain.card({ type: 'time' }, [3, 16]).lines.includes('Bottom number 16: a sixteenth note is one beat.'));

  L.setLang('de');
  assert.equal(Explain.card({ type: 'key' }, [4, 4], 'F#m').title, 'Vorzeichen: fis-Moll');
  assert.ok(Explain.card({ type: 'key' }, [4, 4], 'F').lines.includes('1 ♭ direkt nach dem Schlüssel: spiele H als B.'));
  const de = Explain.card({ type: 'note', dur: 'h', len: 2, hand: 'L', first: true, notes: [{ m: 59, s: 'B3', f: 1 }], acc: {} }, [4, 4]);
  assert.equal(de.title, 'Halbe Note');
  assert.ok(de.lines.includes('H3: direkt über den Notenlinien, Finger 1'), de.lines.join(' | '));   // B3 in the bass staff
  L.setLang('en');
});
