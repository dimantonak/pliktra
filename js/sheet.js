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
  // Positions snap to the shortest written value (a 32nd note = 1/8 beat), so every gap and
  // length can be written exactly and each bar adds up. Triplets come out as 16th/dotted 16th.
  function snap(b) { return Math.round(b * 8) / 8; }
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
  // With a pickup the first bar is short (bar.pickup), and so is the last one if the music
  // ends that much early, as in printed music.
  // exact: each note lasts only its typed length (note reading drills: every note a quarter note,
  // with rests in the other hand) instead of until the hand's next note.
  function layoutBars(p, exact) {
    var barLen = p.meter[0] * 4 / p.meter[1], pick = p.pickup || 0;
    var rests = p.rests.map(function (t) { return snap(t / BEAT_SEC); });
    var bars = [];
    if (pick) bars.push({ start: 0, len: pick, pickup: true, R: [], L: [] });
    var body = p.beats - pick, nBars = Math.max(1, Math.ceil(Math.max(body, pick ? EPS : barLen) / barLen - EPS));
    for (var i = 0; i < nBars; i++) bars.push({ start: pick + i * barLen, len: barLen, R: [], L: [] });
    var lastLen = body - (nBars - 1) * barLen;
    if (pick && Math.abs(lastLen - (barLen - pick)) < EPS) bars[bars.length - 1].len = lastLen;
    function barEnd(b) {
      for (var k = 0; k < bars.length; k++) if (b < bars[k].start + bars[k].len - EPS) return bars[k].start + bars[k].len;
      return bars[bars.length - 1].start + bars[bars.length - 1].len;
    }

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
        var end = barEnd(c.b);                                               // bar line
        if (chords[k + 1]) end = Math.min(end, chords[k + 1].b);            // next note, same hand
        for (var r = 0; r < rests.length; r++) {                            // next rest
          if (rests[r] > c.b + EPS) { end = Math.min(end, rests[r]); break; }
        }
        if (exact) end = Math.min(end, c.b + snap(Math.max.apply(null, c.notes.map(function (n) { return n.d; })) / 0.92 / BEAT_SEC));
        c.len = Math.max(0.125, end - c.b);
      });

      var ci = 0;
      bars.forEach(function (bar) {
        var cursor = bar.start, endB = bar.start + bar.len, items = bar[h];
        while (ci < chords.length && chords[ci].b < endB - EPS) {
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
        if (cursor <= bar.start + EPS && Math.abs(bar.len - barLen) < EPS) items.push({ rest: true, whole: true, b: bar.start, len: barLen, dur: 'w' });
        else if (cursor < endB - EPS) pushRests(items, cursor, endB - cursor);
      });
    });
    return { bars: bars, meter: p.meter, key: p.key || 'C', pickup: pick };
  }

  function vfKey(n) {
    var r = /^([A-G])([#b]?)(-?\d+)$/.exec(n.s || midiToName(n.m));
    return r[1].toLowerCase() + r[2] + '/' + r[3];
  }

  function makeNote(VF, it, clef, hand, opts) {
    if (it.rest) {
      var rk = it.whole ? (clef === 'treble' ? 'd/5' : 'f/3') : (clef === 'treble' ? 'b/4' : 'd/3');
      var rn = new VF.StaveNote({ clef: clef, keys: [rk], duration: it.dur + (it.dotted ? 'd' : '') + 'r', align_center: !!it.whole });
      if (it.whole) rn.setIntrinsicTicks(it.len * VF.RESOLUTION / 4);   // whole-bar rest lasts one bar (e.g. 3 beats in 3/4)
      if (it.dotted) VF.Dot.buildAndAttach([rn], { all: true });
      return rn;
    }
    var sorted = it.notes.slice().sort(function (a, b) { return a.m - b.m; });
    var sn = new VF.StaveNote({ clef: clef, keys: sorted.map(vfKey), duration: it.dur + (it.dotted ? 'd' : ''),   // 'd' = dotted length; the dot itself is drawn by Dot.buildAndAttach
      auto_stem: true });
    if (it.dotted) VF.Dot.buildAndAttach([sn], { all: true });
    return sn;
  }

  // Finger numbers as in printed music: right hand above the treble staff, left hand below
  // the bass staff, stacked for chords (top number = top note).
  // Returns the vertical extent used [top, bottom] so the score can grow to fit.
  function drawFingers(ctx, note, it, hand, stave) {
    var fingers = it.notes.slice().sort(function (a, b) { return a.m - b.m; })
      .map(function (n) { return n.f ? String(n.f) : ''; });
    if (!fingers.some(Boolean)) return null;
    var bb = note.getBoundingBox();
    var x = (note.getNoteHeadBeginX() + note.getNoteHeadEndX()) / 2;
    var LINE = 12;
    ctx.save();
    ctx.setFont('Arial, sans-serif', 12, 'bold');
    ctx.setFillStyle('#2a2f38');
    var n = fingers.length, ext;
    if (hand === 'R') {
      var top = Math.min(bb.getY(), stave.getYForLine(0)) - 6;
      fingers.forEach(function (f, i) { if (f) ctx.fillText(f, x - 3.5, top - i * LINE); });          // low -> high upward
      ext = [top - (n - 1) * LINE - LINE, top];
    } else {
      var bottom = Math.max(bb.getY() + bb.getH(), stave.getYForLine(4)) + 16;
      fingers.slice().reverse().forEach(function (f, i) { if (f) ctx.fillText(f, x - 3.5, bottom + i * LINE); }); // high -> low downward
      ext = [bottom - LINE, bottom + (n - 1) * LINE + 3];
    }
    ctx.restore();
    return ext;
  }

  // Draws the whole song as one long grand staff into `container`.
  // Returns { width, height, marks: { beatKey: [{ hand, x, el }] } } (x in px, already scaled).
  function render(container, text, opts) {
    var VF = Vex.Flow;
    var lay = layoutBars(parseSongText(text), opts.exact);
    var YT = 45, YB = 160, H = 290, s = opts.scale || 1;   // treble / bass stave tops, total height
    var widths = lay.bars.map(function (bar, i) {
      var n = Math.max(bar.R.length, bar.L.length);
      return Math.max(150, 50 + 40 * n) + (i === 0 ? 75 + 11 * Math.abs(keyCount(lay.key)) : 0);   // clef, key and time signature
    });
    var total = widths.reduce(function (a, b) { return a + b; }, 0) + 30;

    container.innerHTML = '';
    var renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);
    renderer.resize(Math.ceil(total * s), Math.ceil(H * s));
    var ctx = renderer.getContext();
    ctx.scale(s, s);

    var marks = {}, pending = [], hits = [], x = 15, last = lay.bars.length - 1, minY = 0, maxY = H;
    // Compound meters (3/8, 6/8, 9/8, 12/8): eighth notes are beamed in groups of three.
    var compound = lay.meter[1] === 8 && lay.meter[0] % 3 === 0;
    var beamOpts = compound ? { groups: [new VF.Fraction(3, 8)] } : undefined;
    lay.bars.forEach(function (bar, i) {
      var w = widths[i];
      var sT = new VF.Stave(x, YT, w), sB = new VF.Stave(x, YB, w);
      if (i === 0) {
        var ts = lay.meter[0] + '/' + lay.meter[1];
        sT.addClef('treble'); sB.addClef('bass');
        if (lay.key !== 'C') { sT.addKeySignature(lay.key); sB.addKeySignature(lay.key); }
        sT.addTimeSignature(ts); sB.addTimeSignature(ts);
      }
      if (i === last) { sT.setEndBarType(VF.Barline.type.END); sB.setEndBarType(VF.Barline.type.END); }
      var startX = Math.max(sT.getNoteStartX(), sB.getNoteStartX());
      sT.setNoteStartX(startX); sB.setNoteStartX(startX);
      sT.setContext(ctx).draw(); sB.setContext(ctx).draw();
      if (i === 0) {
        new VF.StaveConnector(sT, sB).setType('brace').setContext(ctx).draw();
        new VF.StaveConnector(sT, sB).setType('singleLeft').setContext(ctx).draw();
        // what can be tapped for an explanation (js/explain.js): clefs, key and time signatures, the brace
        [[sT, 'treble'], [sB, 'bass']].forEach(function (c) {
          var top = c[0].getYForLine(0), bot = c[0].getYForLine(4);
          c[0].getModifiers().forEach(function (m) {
            var cat = m.getCategory();
            if (cat === 'Clef') hits.push({ x: m.getX(), y: top - 20, w: m.getWidth(), h: bot - top + 40, info: { type: 'clef', clef: c[1] } });
            if (cat === 'TimeSignature') hits.push({ x: m.getX(), y: top, w: m.getWidth(), h: bot - top, info: { type: 'time' } });
            if (cat === 'KeySignature') hits.push({ x: m.getX(), y: top - 10, w: m.getWidth(), h: bot - top + 20, info: { type: 'key', clef: c[1] } });
          });
        });
        hits.push({ x: x - 15, y: sT.getYForLine(0), w: 14, h: sB.getYForLine(4) - sT.getYForLine(0), info: { type: 'brace' } });
      }
      hits.push({ x: x + w - 5, y: sT.getYForLine(0), w: 10, h: sB.getYForLine(4) - sT.getYForLine(0),
        info: { type: 'bar', final: i === last, pickup: !!bar.pickup, len: bar.len } });
      new VF.StaveConnector(sT, sB).setType(i === last ? 'boldDoubleRight' : 'singleRight').setContext(ctx).draw();

      var voices = [], extras = [], fingerJobs = [], noteJobs = [];
      [['R', 'treble', sT], ['L', 'bass', sB]].forEach(function (cfg) {
        var hand = cfg[0], items = bar[hand];
        var notes = items.map(function (it) { return makeNote(VF, it, cfg[1], hand, opts); });
        notes.forEach(function (n) { n.setStave(cfg[2]); });
        var voice = new VF.Voice({ num_beats: lay.meter[0], beat_value: lay.meter[1] }).setMode(VF.Voice.Mode.SOFT);
        voice.addTickables(notes);
        VF.Accidental.applyAccidentals([voice], lay.key);   // ♯/♭/♮ only where the key signature doesn't already say it
        extras = extras.concat(VF.Beam.generateBeams(notes, beamOpts));
        items.forEach(function (it, k) {
          if (it.tieNext && notes[k + 1]) {
            var idx = it.notes.map(function (_, j) { return j; });
            extras.push(new VF.StaveTie({ first_note: notes[k], last_note: notes[k + 1], first_indices: idx, last_indices: idx }));
          }
          var job = { note: notes[k], it: it, hand: hand };
          noteJobs.push(job);
          if (!it.rest && it.first) {
            pending.push({ key: beatKey(it.b), hand: hand, note: notes[k] });
            if (opts.fingers) fingerJobs.push({ note: notes[k], it: it, hand: hand, stave: cfg[2], job: job });
          }
        });
        voices.push({ voice: voice, stave: cfg[2] });
      });
      var fmt = new VF.Formatter();
      voices.forEach(function (v) { fmt.joinVoices([v.voice]); });
      fmt.format(voices.map(function (v) { return v.voice; }), x + w - startX - 14);
      voices.forEach(function (v) {
        v.voice.draw(ctx, v.stave);
        v.voice.getTickables().forEach(function (t) {   // very high / low notes and their stems
          var b = t.getBoundingBox && t.getBoundingBox();
          if (b) { minY = Math.min(minY, b.getY()); maxY = Math.max(maxY, b.getY() + b.getH()); }
        });
      });
      extras.forEach(function (e) { e.setContext(ctx).draw(); });
      fingerJobs.forEach(function (j) {
        var e = drawFingers(ctx, j.note, j.it, j.hand, j.stave);
        if (e) { minY = Math.min(minY, e[0]); maxY = Math.max(maxY, e[1]); j.job.ext = e; }
      });
      noteJobs.forEach(function (j) { var h = noteHit(j); if (h) hits.push(h); });
      x += w;
    });

    // Grow the drawing up/down if anything sticks out (high notes, stacked finger numbers).
    var top = Math.min(0, Math.floor(minY) - 6), bot = Math.max(H, Math.ceil(maxY) + 6);
    if (top < 0 || bot > H) {
      var svg = container.querySelector('svg'), hPx = Math.ceil((bot - top) * s);
      svg.setAttribute('height', hPx); svg.style.height = hPx + 'px';
      ctx.setViewBox(0, top, Math.ceil(total * s) / s, (bot - top));
    }

    pending.forEach(function (p) {
      (marks[p.key] = marks[p.key] || []).push({ hand: p.hand, x: p.note.getAbsoluteX() * s, el: p.note.getSVGElement() });
    });
    return { width: total * s, height: (bot - top) * s, marks: marks, hits: hits, meter: lay.meter, key: lay.key };
  }

  // A drawn note or rest -> { x, y, w, h, info } for explanations (finger numbers count as part of it).
  function noteHit(j) {
    var bb;
    try { bb = j.note.getBoundingBox(); } catch (e) { return null; }
    if (!bb) return null;
    var y0 = bb.getY(), y1 = bb.getY() + bb.getH(), it = j.it, info;
    if (j.ext) { y0 = Math.min(y0, j.ext[0]); y1 = Math.max(y1, j.ext[1]); }
    if (it.rest) info = { type: 'rest', dur: it.dur, dotted: !!it.dotted, len: it.len, whole: !!it.whole, hand: j.hand };
    else {
      var acc = {};
      j.note.getModifiersByType('Accidental').forEach(function (a) { acc[a.getIndex()] = a.type; });
      info = { type: 'note', dur: it.dur, dotted: !!it.dotted, len: it.len, hand: j.hand, first: it.first, tieNext: it.tieNext,
        beam: !!(j.note.hasBeam && j.note.hasBeam()), acc: acc,
        notes: it.notes.slice().sort(function (a, b) { return a.m - b.m; }).map(function (n) { return { m: n.m, s: n.s, f: n.f }; }) };
    }
    return { x: bb.getX(), y: y0, w: bb.getW(), h: y1 - y0, info: info };
  }

  // The symbol at (x, y) in the score's own units (see render): the closest one within a few units.
  function hitAt(hits, x, y) {
    var best = null, bestD = 12, bestA = Infinity;
    (hits || []).forEach(function (h) {
      var dx = Math.max(h.x - x, 0, x - (h.x + h.w)), dy = Math.max(h.y - y, 0, y - (h.y + h.h));
      var d = Math.sqrt(dx * dx + dy * dy), a = h.w * h.h;
      if (d < bestD - 1e-6 || (Math.abs(d - bestD) < 1e-6 && a < bestA)) { best = h; bestD = d; bestA = a; }
    });
    return best;
  }

  // A small drawing of one symbol for the "What the symbols mean" list.
  // spec: { clef, key, time, notes: [{ keys, dur, dot, rest, acc }], beam, tie, bar, end }
  function mini(container, spec) {
    var VF = Vex.Flow, s = 0.62, W = 96, H = 118;
    container.innerHTML = '';
    var r = new VF.Renderer(container, VF.Renderer.Backends.SVG);
    r.resize(Math.ceil(W * s), Math.ceil(H * s));
    var ctx = r.getContext();
    ctx.scale(s, s);
    var stave = new VF.Stave(2, 0, W - 6);
    stave.setBegBarType(VF.Barline.type.NONE);
    stave.setEndBarType(spec.end ? VF.Barline.type.END : VF.Barline.type.NONE);
    if (spec.clef) stave.addClef(spec.clef);
    if (spec.key) stave.addKeySignature(spec.key);
    if (spec.time) stave.addTimeSignature(spec.time);
    stave.setContext(ctx).draw();
    if (!spec.notes) return;
    var notes = spec.notes.map(function (n) {
      var sn = new VF.StaveNote({ keys: n.keys, duration: n.dur + (n.dot ? 'd' : '') + (n.rest ? 'r' : ''), auto_stem: !n.rest });
      if (n.dot) VF.Dot.buildAndAttach([sn], { all: true });
      if (n.acc) sn.addModifier(new VF.Accidental(n.acc), 0);
      return sn;
    });
    var voice = new VF.Voice({ num_beats: 4, beat_value: 4 }).setMode(VF.Voice.Mode.SOFT);
    voice.addTickables(notes);
    var beams = spec.beam ? VF.Beam.generateBeams(notes) : [];
    new VF.Formatter().joinVoices([voice]).format([voice], W - 30);
    voice.draw(ctx, stave);
    beams.forEach(function (b) { b.setContext(ctx).draw(); });
    if (spec.tie) new VF.StaveTie({ first_note: notes[0], last_note: notes[1], first_indices: [0], last_indices: [0] }).setContext(ctx).draw();
    if (spec.bar) {   // a bar line between the two notes
      var bx = (notes[0].getAbsoluteX() + notes[1].getAbsoluteX()) / 2 + 4;
      ctx.fillRect(bx, stave.getYForLine(0), 1, stave.getYForLine(4) - stave.getYForLine(0));
    }
  }

  return { available: available, render: render, beatKey: beatKey, layoutBars: layoutBars, makeNote: makeNote, hitAt: hitAt, mini: mini };
})();

if (typeof module !== 'undefined') module.exports = { Sheet: Sheet };
