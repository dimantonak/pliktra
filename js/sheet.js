// Sheet music view: turns a typed song into a grand staff (treble = right hand, bass = left hand),
// drawn with VexFlow, and reports where each step's notes are so the app can highlight them.
//
// Rhythm per hand is derived from the song text: a note lasts until the same hand's next note,
// a rest ("-"), or the bar line, whichever comes first. Gaps are filled with rests.
'use strict';

var Sheet = (function () {
  var EPS = 1e-6;
  // [length in quarter-note beats, VexFlow duration, dotted]
  var DURS = [
    [4, 'w', false], [3, 'h', true], [2, 'h', false], [1.5, 'q', true], [1, 'q', false],
    [0.75, '8', true], [0.5, '8', false], [0.375, '16', true], [0.25, '16', false], [0.125, '32', false]
  ];

  function available() { return typeof Vex !== 'undefined' && !!(Vex.Flow && Vex.Flow.Renderer); }
  function snap(b) { return Math.round(b * 32) / 32; }
  function beatKey(b) { return snap(b).toFixed(4); }

  // Splits a length into note values that can be written (e.g. 2.5 -> half + eighth, tied).
  function splitLength(len) {
    var out = [], guard = 0;
    while (len > EPS && guard++ < 64) {
      var i = 0;
      while (i < DURS.length && DURS[i][0] > len + EPS) i++;
      if (i === DURS.length) break;
      out.push(DURS[i]);
      len -= DURS[i][0];
    }
    return out;
  }

  function pushRests(items, b, len) {
    splitLength(len).forEach(function (d) {
      items.push({ rest: true, b: b, len: d[0], dur: d[1], dotted: d[2] });
      b += d[0];
    });
  }

  // Parsed song -> bars; each bar has, per hand, a list of notes/chords/rests in order.
  function layoutBars(p) {
    var barLen = p.meter[0] * 4 / p.meter[1];
    var nBars = Math.max(1, Math.ceil(Math.max(p.beats, barLen) / barLen - EPS));
    var rests = p.rests.map(function (t) { return snap(t / BEAT_SEC); });
    var bars = [];
    for (var i = 0; i < nBars; i++) bars.push({ start: i * barLen, R: [], L: [] });

    ['R', 'L'].forEach(function (h) {
      var chords = [];
      p.notes.forEach(function (n) {
        if (n.h !== h) return;
        var b = snap(n.t / BEAT_SEC), last = chords[chords.length - 1];
        if (last && Math.abs(last.b - b) < EPS) {
          if (!last.notes.some(function (x) { return x.m === n.m; })) last.notes.push(n);
        } else chords.push({ b: b, notes: [n] });
      });
      chords.forEach(function (c, k) {
        var end = (Math.floor(c.b / barLen + EPS) + 1) * barLen;            // bar line
        if (chords[k + 1]) end = Math.min(end, chords[k + 1].b);            // next note, same hand
        for (var r = 0; r < rests.length; r++) {                            // next rest
          if (rests[r] > c.b + EPS) { end = Math.min(end, rests[r]); break; }
        }
        c.len = Math.max(0.125, end - c.b);
      });

      var ci = 0;
      bars.forEach(function (bar) {
        var cursor = bar.start, barEnd = bar.start + barLen, items = bar[h];
        while (ci < chords.length && chords[ci].b < barEnd - EPS) {
          var c = chords[ci++];
          if (c.b > cursor + EPS) pushRests(items, cursor, c.b - cursor);
          var parts = splitLength(c.len), b = c.b;
          parts.forEach(function (d, k) {
            items.push({ b: b, len: d[0], dur: d[1], dotted: d[2], notes: c.notes,
              first: k === 0, tieNext: k < parts.length - 1 });
            b += d[0];
          });
          cursor = c.b + c.len;
        }
        if (cursor <= bar.start + EPS) items.push({ rest: true, whole: true, b: bar.start, len: barLen, dur: 'w' });
        else if (cursor < barEnd - EPS) pushRests(items, cursor, barEnd - cursor);
      });
    });
    return { bars: bars, meter: p.meter };
  }

  function vfKey(n) {
    var r = /^([A-G])([#b]?)(-?\d+)$/.exec(n.s || midiToName(n.m));
    return r[1].toLowerCase() + r[2] + '/' + r[3];
  }

  function makeNote(VF, it, clef, hand, opts) {
    if (it.rest) {
      var rk = it.whole ? (clef === 'treble' ? 'd/5' : 'f/3') : (clef === 'treble' ? 'b/4' : 'd/3');
      var rn = new VF.StaveNote({ clef: clef, keys: [rk], duration: it.dur + 'r', align_center: !!it.whole });
      if (it.dotted) VF.Dot.buildAndAttach([rn], { all: true });
      return rn;
    }
    var sorted = it.notes.slice().sort(function (a, b) { return a.m - b.m; });
    var sn = new VF.StaveNote({ clef: clef, keys: sorted.map(vfKey), duration: it.dur, auto_stem: true });
    if (it.dotted) VF.Dot.buildAndAttach([sn], { all: true });
    return sn;
  }

  // Finger numbers as in printed music: right hand above the treble staff, left hand below
  // the bass staff, stacked for chords (top number = top note).
  function drawFingers(ctx, note, it, hand, stave) {
    var fingers = it.notes.slice().sort(function (a, b) { return a.m - b.m; })
      .map(function (n) { return n.f ? String(n.f) : ''; });
    if (!fingers.some(Boolean)) return;
    var bb = note.getBoundingBox();
    var x = (note.getNoteHeadBeginX() + note.getNoteHeadEndX()) / 2;
    var LINE = 12;
    ctx.save();
    ctx.setFont('Arial, sans-serif', 12, 'bold');
    ctx.setFillStyle('#2a2f38');
    if (hand === 'R') {
      var top = Math.min(bb.getY(), stave.getYForLine(0)) - 6;
      fingers.forEach(function (f, i) { if (f) ctx.fillText(f, x - 3.5, top - i * LINE); });          // low -> high upward
    } else {
      var bottom = Math.max(bb.getY() + bb.getH(), stave.getYForLine(4)) + 16;
      fingers.slice().reverse().forEach(function (f, i) { if (f) ctx.fillText(f, x - 3.5, bottom + i * LINE); }); // high -> low downward
    }
    ctx.restore();
  }

  // Draws the whole song as one long grand staff into `container`.
  // Returns { width, height, marks: { beatKey: [{ hand, x, el }] } } (x in px, already scaled).
  function render(container, text, opts) {
    var VF = Vex.Flow;
    var lay = layoutBars(parseSongText(text));
    var YT = 45, YB = 160, H = 290, s = opts.scale || 1;   // treble / bass stave tops, total height
    var widths = lay.bars.map(function (bar, i) {
      var n = Math.max(bar.R.length, bar.L.length);
      return Math.max(150, 50 + 40 * n) + (i === 0 ? 75 : 0);
    });
    var total = widths.reduce(function (a, b) { return a + b; }, 0) + 30;

    container.innerHTML = '';
    var renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);
    renderer.resize(Math.ceil(total * s), Math.ceil(H * s));
    var ctx = renderer.getContext();
    ctx.scale(s, s);

    var marks = {}, pending = [], x = 15, last = lay.bars.length - 1;
    lay.bars.forEach(function (bar, i) {
      var w = widths[i];
      var sT = new VF.Stave(x, YT, w), sB = new VF.Stave(x, YB, w);
      if (i === 0) {
        var ts = lay.meter[0] + '/' + lay.meter[1];
        sT.addClef('treble').addTimeSignature(ts);
        sB.addClef('bass').addTimeSignature(ts);
      }
      if (i === last) { sT.setEndBarType(VF.Barline.type.END); sB.setEndBarType(VF.Barline.type.END); }
      var startX = Math.max(sT.getNoteStartX(), sB.getNoteStartX());
      sT.setNoteStartX(startX); sB.setNoteStartX(startX);
      sT.setContext(ctx).draw(); sB.setContext(ctx).draw();
      if (i === 0) {
        new VF.StaveConnector(sT, sB).setType('brace').setContext(ctx).draw();
        new VF.StaveConnector(sT, sB).setType('singleLeft').setContext(ctx).draw();
      }
      new VF.StaveConnector(sT, sB).setType(i === last ? 'boldDoubleRight' : 'singleRight').setContext(ctx).draw();

      var voices = [], extras = [], fingerJobs = [];
      [['R', 'treble', sT], ['L', 'bass', sB]].forEach(function (cfg) {
        var hand = cfg[0], items = bar[hand];
        var notes = items.map(function (it) { return makeNote(VF, it, cfg[1], hand, opts); });
        notes.forEach(function (n) { n.setStave(cfg[2]); });
        var voice = new VF.Voice({ num_beats: lay.meter[0], beat_value: lay.meter[1] }).setMode(VF.Voice.Mode.SOFT);
        voice.addTickables(notes);
        VF.Accidental.applyAccidentals([voice], 'C');
        extras = extras.concat(VF.Beam.generateBeams(notes));
        items.forEach(function (it, k) {
          if (it.tieNext && notes[k + 1]) {
            var idx = it.notes.map(function (_, j) { return j; });
            extras.push(new VF.StaveTie({ first_note: notes[k], last_note: notes[k + 1], first_indices: idx, last_indices: idx }));
          }
          if (!it.rest && it.first) {
            pending.push({ key: beatKey(it.b), hand: hand, note: notes[k] });
            if (opts.fingers) fingerJobs.push({ note: notes[k], it: it, hand: hand, stave: cfg[2] });
          }
        });
        voices.push({ voice: voice, stave: cfg[2] });
      });
      var fmt = new VF.Formatter();
      voices.forEach(function (v) { fmt.joinVoices([v.voice]); });
      fmt.format(voices.map(function (v) { return v.voice; }), x + w - startX - 14);
      voices.forEach(function (v) { v.voice.draw(ctx, v.stave); });
      extras.forEach(function (e) { e.setContext(ctx).draw(); });
      fingerJobs.forEach(function (j) { drawFingers(ctx, j.note, j.it, j.hand, j.stave); });
      x += w;
    });

    pending.forEach(function (p) {
      (marks[p.key] = marks[p.key] || []).push({ hand: p.hand, x: p.note.getAbsoluteX() * s, el: p.note.getSVGElement() });
    });
    return { width: total * s, height: H * s, marks: marks };
  }

  return { available: available, render: render, beatKey: beatKey, layoutBars: layoutBars };
})();

if (typeof module !== 'undefined') module.exports = { Sheet: Sheet };
