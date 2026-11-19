// Lessons: short technique exercises, written for Pliktra. Each lesson is ordinary song text plus
// a one-sentence instruction (shown before you start). A lesson "song" is never stored; its progress
// is its best score (○ new, ◐ tried, ✓ 95% or more). Uses notation.js.
'use strict';

var Lessons = (function () {
  var DONE = 95;   // best score (%) that ticks a lesson off

  // name / desc / tip: text keys in i18n.js. exact: draw each note with its typed length (for hands
  // that take turns); otherwise a note lasts until that hand's next note, as in other songs.
  var LIST = [
    { id: 'five', name: 'lessonFive', desc: 'lessonFiveDesc', tip: 'lessonFiveTip',
      text: 'C4/1 D4/2 E4/3 F4/4 | G4/5 F4/4 E4/3 D4/2 | C4/1 E4/3 D4/2 F4/4 | E4/3 G4/5 C4/1_2 |\n' +
            'C3/5 D3/4 E3/3 F3/2 | G3/1 F3/2 E3/3 D3/4 | C3/5 E3/3 D3/4 F3/2 | E3/3 G3/1 C3/5_2' },
    { id: 'alternate', name: 'lessonAlt', desc: 'lessonAltDesc', tip: 'lessonAltTip', exact: true,
      text: 'C3/5 D3/4 E3/3 F3/2 | G3/1 C4/1 D4/2 E4/3 | F4/4 G4/5 F4/4 E4/3 | D4/2 C4/1 G3/1 F3/2 |\n' +
            'E3/3 D3/4 C3/5_2 | C3/5 C4/1 E3/3 E4/3 | G3/1 G4/5 E3/3 E4/3 | C3/5 C4/1_3' },
    { id: 'thumb', name: 'lessonThumb', desc: 'lessonThumbDesc', tip: 'lessonThumbTip',
      text: 'C4/1 D4/2 E4/3 F4/1 | E4/3 D4/2 C4/1_2 |\n' +
            'C4/1 D4/2 E4/3 F4/1 | G4/2 A4/3 B4/4 C5/5 | B4/4 A4/3 G4/2 F4/1 | E4/3 D4/2 C4/1_2' },
    { id: 'hold', name: 'lessonHold', desc: 'lessonHoldDesc', tip: 'lessonHoldTip',
      text: 'C3/5+C4/1 D4/2 E4/3 F4/4 | G3/1+G4/5 F4/4 E4/3 D4/2 | E3/3+E4/3 D4/2 C4/1 D4/2 | G3/1+E4/3 F4/4 G4/5_2 |\n' +
            'C3/5+E4/3 D4/2 E3/3+C4/1 D4/2 | F3/2+F4/4 E4/3 E3/3+G4/5 E4/3 | D3/4+D4/2 F4/4 G3/1+G4/5 F4/4 | C3/5+E4/3 D4/2 C4/1_2' },
    { id: 'contrary', name: 'lessonContrary', desc: 'lessonContraryDesc', tip: 'lessonContraryTip',
      text: 'C3/1+C4/1 B2/2+D4/2 A2/3+E4/3 G2/1+F4/1 | F2/2+G4/2 E2/3+A4/3 D2/4+B4/4 C2/5+C5/5 |\n' +
            'D2/4+B4/4 E2/3+A4/3 F2/2+G4/2 G2/1+F4/1 | A2/3+E4/3 B2/2+D4/2 C3/1+C4/1_2' },
    { id: 'triads', name: 'lessonTriads', desc: 'lessonTriadsDesc', tip: 'lessonTriadsTip',
      text: 'C4/1+E4/3+G4/5_2 C4/1+Eb4/3+G4/5_2 | C4/1+E4/3+G4/5_4 |\n' +
            'F4/1+A4/3+C5/5_2 F4/1+Ab4/3+C5/5_2 | G4/1+B4/3+D5/5_2 G4/1+Bb4/3+D5/5_2 |\n' +
            'C3/5+E3/3+G3/1_2 C3/5+Eb3/3+G3/1_2 | C3/5+E3/3+G3/1_4 |\n' +
            'C3/5+E3/3+G3/1+C4/1+E4/3+G4/5_2 C3/5+Eb3/3+G3/1+C4/1+Eb4/3+G4/5_2 | C3/5+E3/3+G3/1+C4/1+E4/3+G4/5_4' }
  ];

  function get(id) { return LIST.filter(function (l) { return l.id === id; })[0] || null; }
  function next(id) { var i = LIST.indexOf(get(id)); return i >= 0 ? LIST[i + 1] || null : null; }

  // The lesson as a song for the practice screen (id "lesson:<id>"), or null.
  function song(id) {
    var l = get(id);
    if (!l) return null;
    return { id: 'lesson:' + l.id, title: '', kind: 'text', text: l.text, notes: parseSongText(l.text).notes,
      lesson: l.id, exact: !!l.exact };
  }

  // The hands a lesson uses: 'B', or 'R' / 'L' when it is for one hand only.
  function hands(l) {
    var hs = {};
    parseSongText(l.text).notes.forEach(function (n) { hs[n.h] = true; });
    return hs.R && hs.L ? 'B' : hs.R ? 'R' : 'L';
  }

  // 'new', 'tried' or 'done' (best >= DONE with both hands, or with the lesson's only hand).
  // best: the app's best scores ("<song id>:<hand>" -> %).
  function status(l, best) {
    var id = 'lesson:' + l.id, h = hands(l), top = -1, any = false;
    ['B', 'R', 'L'].forEach(function (x) {
      var p = best[id + ':' + x];
      if (p == null) return;
      any = true;
      if (x === 'B' || x === h) top = Math.max(top, p);
    });
    return top >= DONE ? 'done' : any ? 'tried' : 'new';
  }
  var MARK = { 'new': '○', tried: '◐', done: '✓' };

  return { LIST: LIST, DONE: DONE, MARK: MARK, get: get, next: next, song: song, hands: hands, status: status };
})();

if (typeof module !== 'undefined') module.exports = { Lessons: Lessons };
