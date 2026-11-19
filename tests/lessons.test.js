'use strict';
const test = require('node:test');
const assert = require('node:assert');
// lessons.js is a browser script that uses the globals of notation.js.
const L = require('../js/i18n.js');
Object.assign(globalThis, L, require('../js/notation.js'));
const { Lessons } = require('../js/lessons.js');
const { Sheet } = require('../js/sheet.js');

for (const ls of Lessons.LIST) {
  test('lesson: ' + ls.id, () => {
    const p = parseSongText(ls.text);
    assert.deepEqual(p.errors, []);
    // every bar adds up in both hands
    const lay = Sheet.layoutBars(p, ls.exact);
    const barLen = p.meter[0] * 4 / p.meter[1];
    lay.bars.forEach((bar, i) => {
      assert.ok(Math.abs(bar.len - barLen) < 1e-6, `bar ${i + 1} is ${bar.len} beats long`);
      ['R', 'L'].forEach(h => assert.ok(Math.abs(bar[h].reduce((a, it) => a + it.len, 0) - barLen) < 1e-6, `bar ${i + 1} ${h}`));
    });
    // every note has a finger; in a chord the fingers follow the keys (right hand: thumb lowest,
    // left hand: thumb highest)
    for (const n of p.notes) assert.ok(n.f >= 1 && n.f <= 5, 'no finger: ' + noteLabel(n));
    for (const s of buildSteps(p.notes, 'B')) {
      for (const h of ['R', 'L']) {
        const ns = p.notes.filter(n => Math.abs(n.t - s.t) < 0.01 && n.h === h).sort((a, b) => a.m - b.m);
        for (let i = 1; i < ns.length; i++) {
          assert.ok(h === 'R' ? ns[i].f > ns[i - 1].f : ns[i].f < ns[i - 1].f, `${h} fingers at ${s.t}s`);
        }
      }
    }
    // as a song
    const song = Lessons.song(ls.id);
    assert.equal(song.id, 'lesson:' + ls.id);
    assert.equal(song.notes.length, p.notes.length);
  });
}

test('the thumb-under lesson is for the right hand, the others for both', () => {
  assert.deepEqual(Lessons.LIST.map(l => Lessons.hands(l)), ['B', 'B', 'R', 'B', 'B', 'B']);
});

test('lesson progress: new, tried, done', () => {
  const five = Lessons.get('five'), thumb = Lessons.get('thumb');
  assert.equal(Lessons.status(five, {}), 'new');
  assert.equal(Lessons.status(five, { 'lesson:five:R': 100 }), 'tried');     // one hand of a two-hand lesson
  assert.equal(Lessons.status(five, { 'lesson:five:B': 94 }), 'tried');
  assert.equal(Lessons.status(five, { 'lesson:five:B': 95 }), 'done');
  assert.equal(Lessons.status(thumb, { 'lesson:thumb:R': 96 }), 'done');    // its only hand
  assert.equal(Lessons.status(thumb, { 'lesson:five:B': 100 }), 'new');
  assert.equal(Lessons.next('five').id, 'alternate');
  assert.equal(Lessons.next('triads'), null);
  assert.equal(Lessons.song('nope'), null);
});

for (const lang of Object.keys(L.LANGS)) {
  test('lesson texts in ' + lang, () => {
    L.setLang(lang);
    const KEYS = new Set(Object.keys(L.I18N.en));
    for (const ls of Lessons.LIST) {
      for (const k of [ls.name, ls.desc, ls.tip]) {
        assert.ok(KEYS.has(k), 'unknown text key ' + k);
        const s = L.t(k);
        assert.ok(s && s !== k && !/\{\w+\}/.test(s), ls.id + ': ' + s);
      }
    }
    L.setLang('en');
  });
}
