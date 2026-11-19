'use strict';
const test = require('node:test');
const assert = require('node:assert');
// tempo.js is a browser script that uses the globals of notation.js.
Object.assign(globalThis, require('../js/notation.js'));
const { Tempo } = require('../js/tempo.js');

const beats = cl => cl.map(c => c.t / BEAT_SEC);
const accents = cl => cl.filter(c => c.accent).map(c => c.t / BEAT_SEC);

test('count-in: one bar before a song that starts on a bar line', () => {
  const cl = Tempo.clicks({ meter: [4, 4], pickup: 0 }, 0, 10, false);
  assert.deepEqual(beats(cl), [-4, -3, -2, -1]);
  assert.deepEqual(accents(cl), [-4]);
  assert.ok(cl.every(c => c.countIn));
});

test('count-in: a pickup is counted in from the bar line before it', () => {
  // 3/4, pickup of one beat (Happy Birthday): "1 2 3 1 2" and the pickup comes on 3
  const cl = Tempo.clicks({ meter: [3, 4], pickup: 1 }, 0, 10, false);
  assert.deepEqual(beats(cl), [-5, -4, -3, -2, -1]);
  assert.deepEqual(accents(cl), [-5, -2]);
});

test('count-in: eighth-note metres click in eighths', () => {
  const cl = Tempo.clicks({ meter: [6, 8], pickup: 0 }, 0, 10, false);
  assert.deepEqual(beats(cl), [-3, -2.5, -2, -1.5, -1, -0.5]);
  assert.deepEqual(accents(cl), [-3]);
});

test('count-in: starting in the middle of a bar', () => {
  // from beat 6 of a 4/4 song (bar 2, beat 3): the clicks start on the bar line before the last one
  const cl = Tempo.clicks({ meter: [4, 4], pickup: 0 }, 6 * BEAT_SEC, 20, false);
  assert.deepEqual(beats(cl), [0, 1, 2, 3, 4, 5]);
  assert.deepEqual(accents(cl), [0, 4]);
});

test('metronome: clicks go on through the music', () => {
  const cl = Tempo.clicks({ meter: [4, 4], pickup: 0 }, 0, 3 * BEAT_SEC, true);
  assert.deepEqual(beats(cl), [-4, -3, -2, -1, 0, 1, 2, 3]);
  assert.deepEqual(cl.map(c => c.countIn), [true, true, true, true, false, false, false, false]);
});

test('MIDI files: four clicks, no metronome during the music', () => {
  const cl = Tempo.clicks(null, 3, 20, true);
  assert.deepEqual(cl.map(c => c.t), [1, 1.5, 2, 2.5]);
  assert.deepEqual(cl.map(c => c.accent), [true, false, false, false]);
});

test('a key belongs to the nearest note on that key', () => {
  const targets = [{ m: 60, t: 1, res: null }, { m: 62, t: 1.5, res: null }, { m: 60, t: 2, res: null }];
  let j = Tempo.judge(targets, 60, 1.05, 1);
  assert.equal(j.target, targets[0]); assert.equal(j.grade, 'ok');
  j = Tempo.judge(targets, 60, 1.75, 1);   // 0.25 s early for the second C
  assert.equal(j.target, targets[2]); assert.equal(j.grade, 'early');
  j = Tempo.judge(targets, 62, 1.8, 1);
  assert.equal(j.grade, 'late');
  assert.equal(Tempo.judge(targets, 64, 1, 1), null);        // no such note
  assert.equal(Tempo.judge(targets, 62, 2.2, 1), null);      // too late
  targets[0].res = 'ok';
  assert.equal(Tempo.judge(targets, 60, 1, 1), null);        // already played
});

test('the timing windows are real seconds: wider in song time when slower', () => {
  const targets = [{ m: 60, t: 1, res: null }];
  // 0.12 song seconds late is 0.24 real seconds at half speed: late, not in time
  assert.equal(Tempo.judge(targets, 60, 1.12, 0.5).grade, 'late');
  assert.equal(Tempo.judge(targets, 60, 1.12, 1).grade, 'ok');
  assert.ok(!Tempo.expired(targets[0], 1.15, 0.5));
  assert.ok(Tempo.expired(targets[0], 1.2, 0.5));
});

test('score and beats a minute', () => {
  assert.equal(Tempo.score({ ok: 8, early: 1, late: 1, total: 10 }), 90);
  assert.equal(Tempo.score({ ok: 0, early: 0, late: 0, total: 0 }), 0);
  assert.deepEqual(Tempo.SPEEDS.map(Tempo.bpm), [48, 72, 96, 120]);
});
