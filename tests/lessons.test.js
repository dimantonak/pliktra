'use strict';
const test = require('node:test');
const assert = require('node:assert');
// lessons.js is a browser script that uses the globals of notation.js (and i18n.js for note names).
const L = require('../js/i18n.js');
Object.assign(globalThis, L, require('../js/notation.js'));
const { Lessons } = require('../js/lessons.js');
const { Sheet } = require('../js/sheet.js');

for (const ls of Lessons.LIST) {
  test('lesson: ' + ls.id, () => {
    const ids = ls.steps.map(s => s.id);
    assert.equal(new Set(ids).size, ids.length, 'step ids are unique');
    assert.ok(Lessons.plays(ls).length >= 1, 'at least one play step');
    assert.equal(ls.steps[ls.steps.length - 1].type, 'play', 'ends with a play step');
    for (const s of ls.steps) {
      assert.ok(['learn', 'find', 'play'].includes(s.type), s.id);
      if (s.pic) {
        assert.ok(parseNoteName(s.pic.from) != null && parseNoteName(s.pic.to) > parseNoteName(s.pic.from), s.id + ' picture range');
        assert.ok(!isBlack(parseNoteName(s.pic.from)) && !isBlack(parseNoteName(s.pic.to)), s.id + ' picture starts and ends on white keys');
        if (s.pic.marks) {
          const p = parseSongText(s.pic.marks);
          assert.deepEqual(p.errors, []);
          for (const n of p.notes) assert.ok(n.m >= parseNoteName(s.pic.from) && n.m <= parseNoteName(s.pic.to), s.id + ': mark outside the picture');
        }
      }
      if (s.listen) assert.deepEqual(parseSongText(s.listen).errors, [], s.id + ' listen');
      if (s.type === 'find') assert.ok(s.need >= 1 && Lessons.findMatch(s, parseNoteName(/\d/.test(s.find) ? s.find : s.find + '4')), s.id);
      if (s.type !== 'play') continue;
      const p = parseSongText(s.text);
      assert.deepEqual(p.errors, [], s.id);
      // every bar adds up in both hands
      const lay = Sheet.layoutBars(p, s.exact);
      const barLen = p.meter[0] * 4 / p.meter[1];
      lay.bars.forEach((bar, i) => {
        assert.ok(Math.abs(bar.len - barLen) < 1e-6, `${s.id}: bar ${i + 1} is ${bar.len} beats long`);
        ['R', 'L'].forEach(h => assert.ok(Math.abs(bar[h].reduce((a, it) => a + it.len, 0) - barLen) < 1e-6, `${s.id}: bar ${i + 1} ${h}`));
      });
      // every note has a finger; in a chord the fingers follow the keys (right hand: thumb lowest,
      // left hand: thumb highest)
      for (const n of p.notes) assert.ok(n.f >= 1 && n.f <= 5, s.id + ': no finger: ' + noteLabel(n));
      for (const st of buildSteps(p.notes, 'B')) {
        for (const h of ['R', 'L']) {
          const ns = p.notes.filter(n => Math.abs(n.t - st.t) < 0.01 && n.h === h).sort((a, b) => a.m - b.m);
          for (let i = 1; i < ns.length; i++) {
            assert.ok(h === 'R' ? ns[i].f > ns[i - 1].f : ns[i].f < ns[i - 1].f, `${s.id}: ${h} fingers at ${st.t}s`);
          }
        }
      }
      if (s.hold) assert.ok(Lessons.holdSpans(s.text, s.hold).length > 0, s.id + ': has long notes to hold');
      if (Array.isArray(s.dyn)) assert.equal(s.dyn.length, lay.bars.length, s.id + ': one dynamic per bar');
      // as a song
      const song = Lessons.song(ls.id, s.id);
      assert.equal(song.id, 'lesson:' + ls.id);
      assert.equal(song.lessonStep, s.id);
      assert.equal(song.notes.length, p.notes.length);
      assert.ok(Lessons.picFor(s), s.id + ': picture');
    }
  });
}

test('lesson ids of the first lessons are kept (old progress still counts)', () => {
  for (const id of ['five', 'alternate', 'thumb', 'hold', 'contrary', 'triads']) assert.ok(Lessons.get(id), id);
});

test('lesson progress: new, started, done', () => {
  const five = Lessons.get('five'), thumb = Lessons.get('thumb');
  const all = { p: {} };
  Lessons.plays(five).forEach(s => { all.p[s.id] = 1; });
  assert.equal(Lessons.status(five, undefined, {}), 'new');
  assert.equal(Lessons.status(five, { p: {}, at: 'pos' }, {}), 'tried');
  assert.equal(Lessons.status(five, { p: { up: 1 } }, {}), 'tried');
  assert.equal(Lessons.passedCount(five, { p: { up: 1, pos: 1 } }), 1);   // learn steps don't count
  assert.equal(Lessons.status(five, all, {}), 'done');
  // before lessons had steps: 95% with both hands (thumb under: the right hand)
  assert.equal(Lessons.status(five, undefined, { 'lesson:five:B': 95 }), 'done');
  assert.equal(Lessons.status(five, undefined, { 'lesson:five:R': 100 }), 'tried');
  assert.equal(Lessons.status(thumb, undefined, { 'lesson:thumb:R': 96 }), 'done');
  assert.equal(Lessons.next('keys').id, 'five');
  assert.equal(Lessons.next('triads').id, 'pedal');
  assert.equal(Lessons.next('pedal'), null);
  assert.equal(Lessons.song('five', 'pos'), null);   // a learn step is no song
  assert.equal(Lessons.song('nope', 'x'), null);
  assert.equal(Lessons.playFrom(five, 'shape').id, 'skips');
  assert.equal(Lessons.playFrom(five, undefined).id, 'up');
});

test('hold check: long notes and when letting go is too early', () => {
  const text = Lessons.get('hold').steps.find(s => s.id === 'half').text;
  const spans = Lessons.holdSpans(text, 'L');
  // bar 1: C3 (beats 0-2), E3 (2-4)
  assert.deepEqual(spans.slice(0, 2).map(s => [midiToName(s.m), s.t / BEAT_SEC, s.end / BEAT_SEC]), [['C3', 0, 2], ['E3', 2, 4]]);
  const c3 = parseNoteName('C3');
  assert.equal(Lessons.holdBroken(spans, c3, 0), null);              // still on its own step: not yet played
  assert.equal(Lessons.holdBroken(spans, c3, 1 * BEAT_SEC), spans[0]);   // let go while D4 is to be played
  assert.equal(Lessons.holdBroken(spans, c3, 2 * BEAT_SEC), null);   // the note has ended
  assert.equal(Lessons.holdBroken(spans, parseNoteName('D4'), 1 * BEAT_SEC), null);
  assert.equal(Lessons.barOf(text, 5 * BEAT_SEC), 2);
  // short notes are not checked
  assert.deepEqual(Lessons.holdSpans('C3 D3 E3 F3', 'L'), []);
});

test('loud and soft check', () => {
  const step = Lessons.get('dynamics').steps.find(s => s.id === 'softloud');
  const t = beat => beat * BEAT_SEC;
  assert.equal(Lessons.dynAt(step, t(0)), 'p');
  assert.equal(Lessons.dynAt(step, t(9)), 'f');
  const rec = (soft, loud) => [0, 1, 2, 3, 4].map(b => ({ t: t(b), v: soft })).concat([8, 9, 10, 11, 12].map(b => ({ t: t(b), v: loud })));
  assert.equal(Lessons.dynCheck(step, rec(40, 90)).ok, true);
  assert.equal(Lessons.dynCheck(step, rec(60, 70)).ok, false);    // too much alike
  assert.equal(Lessons.dynCheck(step, rec(90, 40)).ok, false);    // the wrong way round
  assert.equal(Lessons.dynCheck(step, [{ t: 0, v: null }]).noPiano, true);
  const cresc = Lessons.get('dynamics').steps.find(s => s.id === 'louder');
  const rising = [...Array(13)].map((_, i) => ({ t: t(i), v: 30 + i * 6 }));
  assert.equal(Lessons.dynCheck(cresc, rising).ok, true);
  assert.equal(Lessons.dynCheck(cresc, rising.map(r => ({ t: r.t, v: 70 }))).ok, false);
});

test('find steps and the keyboard picture', () => {
  const c = { find: 'C' }, mid = { find: 'C4' };
  assert.ok(Lessons.findMatch(c, 24) && Lessons.findMatch(c, 96) && !Lessons.findMatch(c, 62));
  assert.ok(Lessons.findMatch(mid, 60) && !Lessons.findMatch(mid, 48));
  const svg = Lessons.keysSvg({ from: 'C4', to: 'C5', names: 'all', marks: 'C4/1 E4/3' }, { 62: 'on' });
  assert.equal((svg.match(/class="kw/g) || []).length, 8);
  assert.equal((svg.match(/class="kb/g) || []).length, 5);
  assert.equal((svg.match(/class="km R"/g) || []).length, 2);
  assert.ok(/class="kw on"/.test(svg));
  // a play step without its own picture: its keys, C to C
  const pic = Lessons.picFor(Lessons.get('thumb').steps.find(s => s.id === 'up'));
  assert.deepEqual([pic.from, pic.to], ['C4', 'C5']);
});

for (const lang of Object.keys(L.LANGS)) {
  test('lesson texts in ' + lang, () => {
    L.setLang(lang);
    const KEYS = new Set(Object.keys(L.I18N.en));
    for (const ls of Lessons.LIST) {
      const keys = [ls.name, ls.desc];
      for (const s of ls.steps) {
        keys.push(Lessons.key(ls, s, 't'), Lessons.key(ls, s, 'x'));
        if (s.type === 'play') keys.push(Lessons.key(ls, s, 'h'));
      }
      for (const k of keys) {
        assert.ok(KEYS.has(k), 'unknown text key ' + k);
        const s = L.t(k);
        assert.ok(s && s !== k && !/\{\w+\}/.test(s), ls.id + ': ' + s);
      }
    }
    // no lesson text that nobody uses
    const used = new Set();
    for (const ls of Lessons.LIST) for (const s of ls.steps) ['t', 'x', 'h'].forEach(p => used.add(Lessons.key(ls, s, p)));
    assert.deepEqual([...KEYS].filter(k => /^lx_/.test(k) && !used.has(k)), []);
    L.setLang('en');
  });
}

test('the picture’s keys can be tapped: each key knows its MIDI number', () => {
  const svg = Lessons.keysSvg({ from: 'C4', to: 'E4' });
  assert.deepEqual([...svg.matchAll(/data-m="(\d+)"/g)].map(m => +m[1]).sort((a, b) => a - b), [60, 61, 62, 63, 64]);
});

test('hold check: a long note tapped short before its chord was complete is caught after the step', () => {
  // the app checks, after each step, every span that is not down: holdBroken must report it then
  const text = Lessons.get('hold').steps.find(s => s.id === 'whole').text;
  const spans = Lessons.holdSpans(text, 'L');
  const c3 = spans[0];
  assert.equal(Lessons.holdBroken([c3], c3.m, 1 * BEAT_SEC), c3);   // the step after the chord: C3 must still be down
  assert.equal(Lessons.holdBroken([c3], c3.m, 4 * BEAT_SEC), null);  // the next bar: C3 has ended
});

test('legato check: gap, joined, held together too long', () => {
  assert.equal(Lessons.legatoGrade(1000, 1000), 'ok');      // let go as the next key went down
  assert.equal(Lessons.legatoGrade(1000, 1050), 'ok');      // a short overlap is legato
  assert.equal(Lessons.legatoGrade(1000, 960), 'ok');       // a tiny gap is fine
  assert.equal(Lessons.legatoGrade(1000, 800), 'gap');      // let go 0.2 s before: silence
  assert.equal(Lessons.legatoGrade(1000, 1500), 'overlap'); // both down for half a second
});

test('pedal check: change after each new chord', () => {
  const pts = Lessons.pedalPoints(Lessons.get('pedal').steps.find(s => s.id === 'piece').text);
  assert.deepEqual(pts.map(t => t / BEAT_SEC), [0, 4, 8, 12]);   // the first step of every bar
  const up = at => ({ at, down: false }), dn = at => ({ at, down: true });
  const starts = [0, 2000, 4000, 6000];
  // clean: down after chord 1, then up-down just after each new chord
  let r = Lessons.pedalCheck(starts, [up(-1), dn(300), up(2080), dn(2200), up(3970), dn(4150), up(6100), dn(6250)], 7500);
  assert.deepEqual(r.map(x => x.res), ['ok', 'ok', 'ok', 'ok']);
  assert.ok(Lessons.pedalPassed(r));
  // lifted before chord 2 (a gap), never lifted at chord 3 (blur), not pressed again after chord 4
  r = Lessons.pedalCheck(starts, [up(-1), dn(300), up(1700), dn(2100), up(6100)], 7500);
  assert.deepEqual(r.map(x => x.res), ['ok', 'early', 'blur', 'missing']);
  assert.ok(!Lessons.pedalPassed(r));
  // pedal never used
  assert.deepEqual(Lessons.pedalCheck([0, 2000], [up(-1)], 3000).map(x => x.res), ['missing', 'missing']);
  // held down through bars 2 and 3, lifted just before bar 4: bars 2 and 3 not changed, bar 4 a gap
  r = Lessons.pedalCheck(starts, [up(-1), dn(-0.5), up(5900)], 7500);
  assert.deepEqual(r.map(x => x.res), ['ok', 'blur', 'blur', 'early']);
  // changed after bar 2 but not pressed again: told once (bar 3 then only has to catch its chord)
  r = Lessons.pedalCheck(starts, [up(-1), dn(300), up(2100), dn(4100), up(6050), dn(6200)], 7500);
  assert.deepEqual(r.map(x => x.res), ['ok', 'missing', 'ok', 'ok']);
});

test('counting steps play along at a speed the app offers', () => {
  const { Tempo } = require('../js/tempo.js');
  for (const ls of Lessons.LIST) for (const s of ls.steps) if (s.tempo) assert.ok(Tempo.SPEEDS.includes(s.tempo), ls.id + '/' + s.id);
  assert.ok(Lessons.get('count').steps.filter(s => s.tempo).length >= 3);
});
