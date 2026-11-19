// Minimal Standard MIDI File (.mid) reader: returns note "parts" (one per track+channel)
// with times converted to seconds using the file's tempo map.
'use strict';

function parseMidiFile(buffer) {
  var d = new DataView(buffer), p = 0;
  function u8() { return d.getUint8(p++); }
  function u16() { var v = d.getUint16(p); p += 2; return v; }
  function u32() { var v = d.getUint32(p); p += 4; return v; }
  function str(n) { var s = ''; for (var i = 0; i < n; i++) s += String.fromCharCode(d.getUint8(p + i)); p += n; return s; }
  // Track names: UTF-8 if valid, otherwise Latin-1 (older files)
  function text(at, n) {
    var bytes = new Uint8Array(d.buffer, d.byteOffset + at, Math.max(0, Math.min(n, d.byteLength - at)));
    try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
    catch (e) { var r = ''; for (var i = 0; i < bytes.length; i++) r += String.fromCharCode(bytes[i]); return r; }
  }
  function vlq() { var v = 0, b, guard = 0; do { b = d.getUint8(p++); v = (v * 128) + (b & 0x7f); } while ((b & 0x80) && ++guard < 4); return v; }

  if (buffer.byteLength < 14 || str(4) !== 'MThd') throw new Error('This is not a MIDI file.');
  var hlen = u32();
  var format = u16(), ntrks = u16(), division = u16();
  p = 8 + hlen;

  var tempos = [], raw = [], trackNames = [], trackChannels = [], truncated = false;

  for (var tr = 0; tr < ntrks && p + 8 <= d.byteLength; tr++) {
    var id = str(4), len = u32();
    while (id !== 'MTrk' && p + len + 8 <= d.byteLength) { p += len; id = str(4); len = u32(); } // skip unknown chunks
    if (id !== 'MTrk') break;
    var end = Math.min(p + len, d.byteLength), tick = 0, running = 0, open = {};
    trackChannels[tr] = {};
    try {
    while (p < end) {
      tick += vlq();
      var status = d.getUint8(p);
      if (status < 0x80) {
        if (!running) throw new Error('The MIDI file looks damaged.');
        status = running;
      } else {
        p++;
        if (status < 0xF0) running = status;
      }
      if (status === 0xFF) {
        var type = u8(), mlen = vlq();
        if (type === 0x51 && mlen >= 3) {
          tempos.push({ tick: tick, us: (d.getUint8(p) << 16) | (d.getUint8(p + 1) << 8) | d.getUint8(p + 2) });
        } else if ((type === 0x03) && !trackNames[tr]) {
          trackNames[tr] = text(p, mlen).trim();
        }
        p += mlen;
      } else if (status === 0xF0 || status === 0xF7) {
        p += vlq();
      } else {
        var kind = status & 0xF0, ch = status & 0x0F;
        var a = u8(), b = (kind === 0xC0 || kind === 0xD0) ? 0 : u8();
        var key = ch * 128 + a;
        if (kind === 0x90 && b > 0) {
          (open[key] = open[key] || []).push({ tick: tick, vel: b });
          trackChannels[tr][ch] = true;
        } else if (kind === 0x80 || (kind === 0x90 && b === 0)) {
          var list = open[key];
          if (list && list.length) {
            var s = list.shift();
            raw.push({ track: tr, ch: ch, m: a, on: s.tick, off: tick, v: s.vel });
          }
        }
      }
    }
    } catch (err) {   // file cut short: keep the notes read so far
      if (!(err instanceof RangeError)) throw err;
      truncated = true;
    }
    for (var k in open) { // notes never released: end them at the end of the track
      for (var j = 0; j < open[k].length; j++) {
        raw.push({ track: tr, ch: Math.floor(k / 128), m: k % 128, on: open[k][j].tick, off: tick, v: open[k][j].vel });
      }
    }
    p = end;
    if (truncated) break;
  }

  // ---- ticks -> seconds
  var toSec;
  if (division & 0x8000) {
    var fps = 256 - (division >> 8), tpf = division & 0xff;
    toSec = function (t) { return t / (fps * tpf); };
  } else {
    var tpq = division || 480;
    tempos.sort(function (x, y) { return x.tick - y.tick; });
    var map = [{ tick: 0, us: 500000, sec: 0 }];
    for (var ti = 0; ti < tempos.length; ti++) {
      var lastE = map[map.length - 1], te = tempos[ti];
      if (te.tick === lastE.tick) { lastE.us = te.us; continue; }
      map.push({ tick: te.tick, us: te.us, sec: lastE.sec + (te.tick - lastE.tick) * lastE.us / 1e6 / tpq });
    }
    toSec = function (t) {
      var lo = 0, hi = map.length - 1;
      while (lo < hi) { var mid = (lo + hi + 1) >> 1; if (map[mid].tick <= t) lo = mid; else hi = mid - 1; }
      var e = map[lo];
      return e.sec + (t - e.tick) * e.us / 1e6 / tpq;
    };
  }

  // ---- group into parts (skip channel 10 = drums)
  var parts = {}, order = [];
  for (var r = 0; r < raw.length; r++) {
    var n = raw[r];
    if (n.ch === 9 || n.m < 21 || n.m > 108) continue;
    var pk = n.track + ':' + n.ch;
    if (!parts[pk]) {
      var multiCh = Object.keys(trackChannels[n.track] || {}).length > 1;
      var base = trackNames[n.track] || ('Track ' + (n.track + 1));
      parts[pk] = { name: multiCh ? base + ' (channel ' + (n.ch + 1) + ')' : base, notes: [] };
      order.push(pk);
    }
    var t0 = toSec(n.on);
    parts[pk].notes.push({ m: n.m, t: t0, d: Math.max(0.05, toSec(n.off) - t0) });
  }

  return {
    format: format,
    parts: order.map(function (k) {
      var ps = parts[k];
      ps.notes.sort(function (x, y) { return x.t - y.t || x.m - y.m; });
      var sum = 0, min = 127, max = 0;
      ps.notes.forEach(function (q) { sum += q.m; if (q.m < min) min = q.m; if (q.m > max) max = q.m; });
      ps.avg = sum / ps.notes.length; ps.min = min; ps.max = max;
      return ps;
    })
  };
}

if (typeof module !== 'undefined') module.exports = { parseMidiFile: parseMidiFile };
