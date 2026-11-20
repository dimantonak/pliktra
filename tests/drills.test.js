'use strict';
const test = require('node:test');
const assert = require('node:assert');
// drills.js is a browser script that uses the globals of i18n.js and notation.js.
const L = require('../js/i18n.js');
Object.assign(globalThis, L, require('../js/notation.js'));
const { Drills } = require('../js/drills.js');
const { Sheet } = require('../js/sheet.js');

// Repeatable "random" numbers, so a failing round can be reproduced.
function seeded(seed) {
  return () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
}

for (const lv of Drills.LEVELS) {
  test('note reading rounds: ' + lv.id, () => {
    for (let s = 1; s <= 40; s++) {
      const text = Drills.generate(lv.id, { random: seeded(s) });
      const p = parseSongText(text);
      assert.deepEqual(p.errors, [], text);
      assert.equal(buildSteps(p.notes, 'B').length, Drills.ROUND, text);   // one note per step
      assert.deepEqual(offKeyNotes(p.notes, p.key), [], 'notes against the key signature: ' + text);
      // every note belongs to the level, in the right hand
      for (const n of p.notes) assert.ok(lv[n.h], n.h + ' hand is not part of ' + lv.id + ': ' + text);
      // never the same note three times in a row
      for (let i = 2; i < p.notes.length; i++) {
        assert.ok(!(p.notes[i].m === p.notes[i - 1].m && p.notes[i].m === p.notes[i - 2].m), 'three in a row: ' + text);
      }
      // the sheet music adds up: 4 bars of 4 quarter notes
      const lay = Sheet.layoutBars(p, true);
      assert.equal(lay.bars.length, 4);
      lay.bars.forEach(bar => ['R', 'L'].forEach(h => {   // quarter notes; rests fill the rest of each bar
        assert.equal(bar[h].reduce((a, it) => a + it.len, 0), 4);
        bar[h].forEach(it => { if (!it.rest) assert.equal(it.len, 1, 'not a quarter note: ' + text); });
      }));
    }
  });
}

test('the key signature level uses G and F major', () => {
  const keys = new Set();
  for (let s = 1; s <= 30; s++) keys.add(parseSongText(Drills.generate('keys', { random: seeded(s) })).key);
  assert.deepEqual([...keys].sort(), ['F', 'G']);
  assert.ok(/F#/.test(Drills.generate('keys', { key: 'G', random: seeded(3) }) + Drills.generate('keys', { key: 'G', random: seeded(4) })));
});

test('missed notes come back more often', () => {
  const focus = [{ name: 'F3', hand: 'L' }, { name: 'B4', hand: 'R' }];
  for (let s = 1; s <= 20; s++) {
    const p = parseSongText(Drills.generate('grand', { random: seeded(s), focus }));
    const n = p.notes.filter(x => (x.m === 53 && x.h === 'L') || (x.m === 71 && x.h === 'R')).length;
    assert.ok(n >= 7, 'only ' + n + ' focus notes');
    for (let i = 2; i < p.notes.length; i++) assert.ok(!(p.notes[i].m === p.notes[i - 1].m && p.notes[i].m === p.notes[i - 2].m), 'three in a row');
  }
  for (let s = 1; s <= 40; s++) {   // one missed note: often, but never three times in a row
    const p = parseSongText(Drills.generate('treble', { random: seeded(s), focus: [{ name: 'A4', hand: 'R' }] }));
    for (let i = 2; i < p.notes.length; i++) assert.ok(!(p.notes[i].m === p.notes[i - 1].m && p.notes[i].m === p.notes[i - 2].m), 'three in a row');
    assert.ok(p.notes.filter(x => x.m === 69).length >= 5);
  }
  // a missed F#4 in G major is written as played
  const k = parseSongText(Drills.generate('keys', { key: 'G', random: seeded(2), focus: [{ name: 'F#4', hand: 'R' }] }));
  assert.ok(k.notes.some(x => x.m === 66));
});

for (const lang of Object.keys(L.LANGS)) {
  test('note reading texts in ' + lang, () => {
    L.setLang(lang);
    const KEYS = new Set(Object.keys(L.I18N.en));
    for (const lv of Drills.LEVELS) {
      for (const s of [L.t(lv.name), Drills.describe(lv)]) {
        assert.ok(s && !KEYS.has(s) && !/\{\w+\}/.test(s), lv.id + ': ' + s);
      }
    }
    L.setLang('en');
  });
}

test('a focus round of the key signature level keeps the round’s key', () => {
  // F#4 read wrong in G major: the next round must be G major again, not F major with an F#
  const focus = [{ name: 'F#4', hand: 'R' }];
  for (let seed = 1; seed <= 20; seed++) {
    const text = Drills.generate('keys', { focus: focus, key: 'G', random: seeded(seed) });
    assert.equal(parseSongText(text).key, 'G', text);
    assert.deepEqual(offKeyNotes(parseSongText(text).notes, 'G'), [], 'no ♯/♭ against the key: ' + text);
  }
});

test('tricky notes: read wrong -> kept; read right in two rounds -> gone', () => {
  const f4 = { name: 'F#4', hand: 'R' }, b3 = { name: 'B3', hand: 'L' }, c4 = { name: 'C4', hand: 'R' };
  let list = Drills.updateTricky([], [f4, c4], [f4], 'G');
  assert.deepEqual(list, [{ name: 'F#4', hand: 'R', key: 'G', left: 2 }]);
  list = Drills.updateTricky(list, [c4], [], 'G');              // not in the round: unchanged
  assert.equal(list[0].left, 2);
  list = Drills.updateTricky(list, [f4, c4], [b3], 'G');        // F#4 right once, B3 wrong
  assert.deepEqual(list.map(e => [e.name, e.left]), [['F#4', 1], ['B3', 2]]);
  list = Drills.updateTricky(list, [f4], [f4], 'G');            // wrong again: back to 2
  assert.equal(list[0].left, 2);
  list = Drills.updateTricky(list, [f4, b3], [], 'G');
  list = Drills.updateTricky(list, [f4, b3], [], 'G');
  assert.deepEqual(list, []);
  const many = Drills.updateTricky([], [], [...Array(20)].map((_, i) => ({ name: 'N' + i, hand: 'R' })), 'C');
  assert.equal(many.length, 12);
});

test('a tricky-notes round uses one key signature', () => {
  const r = Drills.trickyRound([{ name: 'F#4', hand: 'R', key: 'G', left: 2 }, { name: 'Bb4', hand: 'R', key: 'F', left: 2 }, { name: 'F#5', hand: 'R', key: 'G', left: 1 }]);
  assert.equal(r.key, 'G');
  assert.deepEqual(r.focus.map(n => n.name), ['F#4', 'F#5']);
  assert.equal(Drills.trickyRound([]), null);
  const text = Drills.generate('keys', { focus: r.focus, key: r.key, random: seeded(3) });
  assert.ok(parseSongText(text).notes.some(n => n.m === parseNoteName('F#4') || n.m === parseNoteName('F#5')), text);
});
