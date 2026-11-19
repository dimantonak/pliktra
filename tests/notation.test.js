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

test('key signature: only changes how the music is written', () => {
  const r = N.parseSongText('key:G 3/4 F4 F#4 Bb3');
  assert.equal(r.key, 'G');
  assert.deepEqual(r.meter, [3, 4]);
  assert.deepEqual(r.notes.map(n => n.m), [65, 66, 58]);   // F4 stays the white key
  assert.deepEqual(N.offKeyNotes(r.notes, r.key), ['F4', 'Bb3']);
  assert.equal(N.parseSongText('C4').key, 'C');
  const keys = { G: 'G', bb: 'Bb', 'f#m': 'F#m', '2#': 'D', '3b': 'Eb', '1♭': 'F', 0: 'C', '8#': null, H: null, 'Cb': 'Cb', em: 'Em' };
  for (const [s, k] of Object.entries(keys)) assert.equal(N.parseKey(s), k, s);
  assert.deepEqual(N.keyAccidentals('Bb'), { B: -1, E: -1 });
  assert.deepEqual(N.keyAccidentals('A'), { F: 1, C: 1, G: 1 });
  assert.deepEqual(N.keyPair('G'), ['G', 'Em']);
  assert.deepEqual(N.keyPair('Dm'), ['F', 'Dm']);
  assert.equal(N.parseSongText('C4 key:G').errors.length, 1);   // only at the start
  assert.equal(N.parseSongText('key:X C4').errors.length, 1);
  // recording: flat keys write black keys as flats
  assert.equal(N.nameInKey(70, 'F'), 'Bb4');
  assert.equal(N.nameInKey(66, 'G'), 'F#4');
  assert.equal(N.nameInKey(65, 'G'), 'F4');
  for (let m = 21; m <= 108; m++) assert.equal(N.parseNoteName(N.nameInKey(m, 'Eb')), m);
  assert.equal(N.spelled('E#4'), 'E#4');   // keys with many sharps
  assert.equal(N.spelled('F#4'), null);
});

test('pickup', () => {
  assert.equal(N.parseSongText('3/4 pickup:1 C4 | D4 E4 F4').pickup, 1);
  assert.equal(N.parseSongText('C4').pickup, 0);
  assert.equal(N.parseSongText('C4 pickup:1').errors.length, 1);       // only at the start
  assert.equal(N.parseSongText('pickup:x C4').errors.length, 1);
  const long = N.parseSongText('3/4 pickup:3 C4');                     // not shorter than a bar
  assert.equal(long.errors.length, 1);
  assert.equal(long.pickup, 0);
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
