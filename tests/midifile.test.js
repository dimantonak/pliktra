'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { parseMidiFile } = require('../js/midifile.js');

function vlq(n) { const b = [n & 0x7f]; while ((n >>= 7)) b.unshift((n & 0x7f) | 0x80); return b; }
function chunk(id, bytes) { const l = bytes.length; return [...Buffer.from(id), l >>> 24, (l >> 16) & 255, (l >> 8) & 255, l & 255, ...bytes]; }
function toArrayBuffer(bytes) { return new Uint8Array(bytes).buffer; }

// Format 1, 480 ticks per beat. Tempo 120 bpm, then 60 bpm from beat 2.
// Track 1: right hand C5 D5 E5 (running status, note-on velocity 0 as note-off).
// Track 2: left hand C3 on channel 2, plus a drum note on channel 10 (skipped).
function sampleFile() {
  const t0 = [...vlq(0), 0xFF, 0x51, 3, 0x07, 0xA1, 0x20, ...vlq(960), 0xFF, 0x51, 3, 0x0F, 0x42, 0x40, ...vlq(0), 0xFF, 0x2F, 0];
  const name = Buffer.from('Klavier – rechte Hand', 'utf8');
  const t1 = [...vlq(0), 0xFF, 0x03, ...vlq(name.length), ...name,
    ...vlq(0), 0x90, 72, 80, ...vlq(480), 72, 0, ...vlq(0), 74, 80, ...vlq(480), 74, 0,
    ...vlq(0), 76, 80, ...vlq(480), 0x80, 76, 0, ...vlq(0), 0xFF, 0x2F, 0];
  const t2 = [...vlq(0), 0x91, 48, 70, ...vlq(1440), 0x81, 48, 0, ...vlq(0), 0x99, 36, 100, ...vlq(10), 0x89, 36, 0, ...vlq(0), 0xFF, 0x2F, 0];
  return [...chunk('MThd', [0, 1, 0, 3, 480 >> 8, 480 & 255]), ...chunk('MTrk', t0), ...chunk('MTrk', t1), ...chunk('MTrk', t2)];
}

test('tempo map, parts, drums skipped, UTF-8 names', () => {
  const mf = parseMidiFile(toArrayBuffer(sampleFile()));
  assert.equal(mf.parts.length, 2);
  const rh = mf.parts[0];
  assert.equal(rh.name, 'Klavier – rechte Hand');
  assert.equal(rh.notes[2].t, 1.0);   // E5 at beat 2 = 1.0 s at 120 bpm
  assert.equal(rh.notes[2].d, 1.0);   // one beat at 60 bpm
  assert.equal(mf.parts[1].notes[0].d, 2.0);   // 2 beats at 120 + 1 beat at 60
});

test('a file cut short keeps the notes read so far', () => {
  const bytes = sampleFile();
  const mf = parseMidiFile(toArrayBuffer(bytes.slice(0, bytes.length - 30)));
  assert.ok(mf.parts.length >= 1);
  assert.equal(mf.parts[0].notes.length, 3);
});

test('not a MIDI file', () => {
  assert.throws(() => parseMidiFile(new ArrayBuffer(20)), /not a MIDI/);
});
