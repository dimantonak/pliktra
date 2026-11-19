// Run all tests with:  node --test tests/
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const N = require('../js/notation.js');

test('note names', () => {
  assert.equal(N.parseNoteName('C4'), 60);
  assert.equal(N.parseNoteName('F#3'), 54);
  assert.equal(N.parseNoteName('Bb2'), 46);
  assert.equal(N.parseNoteName('b3'), 59);
  assert.equal(N.parseNoteName('H4'), 71);    // German name for B
  assert.equal(N.parseNoteName('Hb4'), null);
  assert.equal(N.parseNoteName('X4'), null);
  assert.equal(N.midiToName(61), 'C#4');
  assert.equal(N.spelled('Eb4'), 'Eb4');
});

test('typed song: steps, hands, rests, comments, errors', () => {
  const r = N.parseSongText('C3+C4 C4 | E4_2 - G4_0.5 // comment\nL:C4+R:E4 X9');
  assert.equal(r.errors.length, 1);           // X9
  assert.equal(r.steps, 5);
  assert.equal(r.rests.length, 1);
  assert.equal(N.buildSteps(r.notes, 'L').length, 2);
  const c3 = r.notes.find(n => n.m === 48);
  assert.equal(c3.h, 'L');
  assert.equal(r.notes.find(n => n.m === 60 && n.t > 0 && n.t < 1).h, 'R');
});

test('fingers and time signature', () => {
  const r = N.parseSongText('3/4 E4/3 G3/4+B3/2');
  assert.deepEqual(r.meter, [3, 4]);
  assert.equal(r.notes.find(n => n.m === 64).f, 3);
  assert.equal(r.errors.length, 0);
  assert.equal(N.parseSongText('E4/6').errors.length, 1);
  assert.equal(N.parseSongText('C4 3/4').errors.length, 1);   // only at the start
});

test('lengths must be numbers', () => {
  assert.equal(N.parseSongText('C4_2abc').errors.length, 1);
  assert.equal(N.parseSongText('C4_2_3').errors.length, 1);
  assert.equal(N.parseSongText('C4_0').errors.length, 1);
  assert.equal(N.parseSongText('C4_.5 D4_0.5 E4_2').errors.length, 0);
});

test('same key twice in a chord counts once, finger kept', () => {
  const r = N.parseSongText('C4+C4/1+E4');
  assert.equal(r.notes.length, 2);
  assert.equal(r.notes.find(n => n.m === 60).f, 1);
});

test('playback: a key struck again is released just before', () => {
  const notes = [{ m: 60, t: 0, d: 1, h: 'R' }, { m: 64, t: 0, d: 2, h: 'R' }, { m: 60, t: 0.5, d: 0.4, h: 'R' }];
  const p = N.playbackNotes(notes);
  assert.ok(p[0].t + p[0].d < 0.5, 'first C4 ends before the second starts');
  assert.equal(p[1].d, 2);              // other keys unchanged
  assert.equal(p[2].d, 0.4);
  assert.equal(notes[0].d, 1);          // the song itself is not changed
  assert.equal(p[0].next, 0.5);         // the player won't stretch it past this
  assert.equal(p[1].next, null);
});

test('playback: the same key at the same time is played once', () => {
  const p = N.playbackNotes([{ m: 60, t: 0, d: 1, h: 'L' }, { m: 60, t: 0.01, d: 2, h: 'R' }, { m: 62, t: 0, d: 1, h: 'R' }]);
  assert.equal(p.filter(n => n.m === 60).length, 1);
  assert.ok(Math.abs(p.find(n => n.m === 60).d - 2.01) < 1e-9);   // as long as the longer one
  assert.equal(p.length, 2);
});

test('steps group chords and follow the chosen hand', () => {
  const r = N.parseSongText('C3+E4 D4 L:G2');
  const both = N.buildSteps(r.notes, 'B');
  assert.deepEqual(both.map(s => s.notes), [[48, 64], [62], [43]]);
  assert.deepEqual(N.buildSteps(r.notes, 'R').map(s => s.notes), [[64], [62]]);
});
