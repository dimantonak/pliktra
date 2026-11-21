// Lessons: short courses written for Pliktra, one skill each. A lesson is a row of steps:
//   learn  a card: what it is and why, a keyboard picture (keys light up as you press them), Listen
//   find   a card: find keys on your piano (e.g. every C)
//   play   a short piece on the practice screen (wait mode), with an optional check of the skill:
//          hold: 'L' / 'R'  long notes of that hand must be held for their whole length
//          dyn: ['p', 'f', ...] loud (f) or soft (p) per bar, or 'cresc' (louder and louder)
//          legato: 'R' / 'L' / 'B'  each note joined to the next one (no gap, no long overlap)
//          pedal: 'bar'  the sustain pedal changed with each bar's chord (legato pedalling)
//          tempo: 0.6  played along at that speed with the metronome (timing score) instead of wait mode
// Lesson order is the order of LIST (shown numbered); progress is kept by id, so a lesson can be inserted.
// A learn card with `demo` draws its Listen example on a timeline (see demoPlan).
// Texts are i18n keys: lx_<lesson>_<step>_t (title), _x (text), _h (hint while playing, play steps).
// A lesson is learnt when every play step is passed (and was, before lessons had steps, with 95%+).
// A lesson "song" (id "lesson:<id>") is never stored. Uses notation.js.
'use strict';

var Lessons = (function () {
  var PASS = 80;     // % of the steps right first time that passes a play step
  var LEGACY = 95;   // old best score ("lesson:<id>:B") that ticked a lesson off
  var DYN_GAP = 20;  // loud notes must be this much stronger than soft ones (MIDI velocity 1-127)
  var LEGATO_GAP = 80, LEGATO_OVERLAP = 300;   // ms: silence between two notes / both keys down at once
  var PEDAL_TOL = 60;   // ms: a pedal lift this much before the new chord still counts as "with it"
  var PEDAL_PASS = 0.75;   // share of the pedal changes that must be clean

  var LIST = [
    { id: 'keys', name: 'lessonKeys', desc: 'lessonKeysDesc', steps: [
      { id: 'groups', type: 'learn', pic: { from: 'C3', to: 'B4', names: 'c', marks: 'C3 C4' } },
      { id: 'c', type: 'find', find: 'C', need: 4, pic: { from: 'A0', to: 'C8' } },
      { id: 'middle', type: 'learn', pic: { from: 'C3', to: 'C5', names: 'c', marks: 'C4/1' } },
      { id: 'mid', type: 'find', find: 'C4', need: 1, pic: { from: 'C2', to: 'C6' } },
      { id: 'f', type: 'learn', pic: { from: 'C3', to: 'B4', names: 'all', marks: 'F3 F4' } },
      { id: 'findf', type: 'find', find: 'F', need: 3, pic: { from: 'A0', to: 'C8' } },
      { id: 'jump', type: 'play',
        text: 'C3/3 C4/3 C5/3 C4/3 | F3/3 F4/3 F5/3 F4/3 | C3/3 F3/3 C4/3 F4/3 | C5/3 F5/3 C5/3_2' }
    ] },
    { id: 'five', name: 'lessonFive', desc: 'lessonFiveDesc', steps: [
      { id: 'pos', type: 'learn', pic: { from: 'C4', to: 'C5', names: 'all', marks: 'C4/1 D4/2 E4/3 F4/4 G4/5' } },
      { id: 'up', type: 'play', text: 'C4/1 D4/2 E4/3 F4/4 | G4/5 F4/4 E4/3 D4/2 | C4/1_4' },
      { id: 'shape', type: 'learn', pic: { from: 'C4', to: 'C5', marks: 'C4/1 D4/2 E4/3 F4/4 G4/5' } },
      { id: 'skips', type: 'play', text: 'C4/1 E4/3 D4/2 F4/4 | E4/3 G4/5 C4/1_2 | G4/5 E4/3 F4/4 D4/2 | E4/3 D4/2 C4/1_2' },
      { id: 'left', type: 'learn', pic: { from: 'C3', to: 'C4', names: 'all', marks: 'C3/5 D3/4 E3/3 F3/2 G3/1' } },
      { id: 'lplay', type: 'play', text: 'C3/5 D3/4 E3/3 F3/2 | G3/1 F3/2 E3/3 D3/4 | C3/5 E3/3 D3/4 F3/2 | E3/3 G3/1 C3/5_2' },
      { id: 'both', type: 'play', pic: { from: 'C3', to: 'C5', marks: 'C3/5 D3/4 E3/3 F3/2 G3/1 C4/1 D4/2 E4/3 F4/4 G4/5' },
        text: 'C3/5+C4/1 D3/4+D4/2 E3/3+E4/3 F3/2+F4/4 | G3/1+G4/5 F3/2+F4/4 E3/3+E4/3 D3/4+D4/2 | C3/5+C4/1_4' }
    ] },
    { id: 'count', name: 'lessonCount', desc: 'lessonCountDesc', steps: [
      { id: 'beat', type: 'learn', pic: { from: 'C4', to: 'C5', names: 'all' }, listen: 'C4 C4 C4 C4 | D4 D4 E4 E4 | C4_4', demo: { tl: 'count', tempo: 0.6 } },
      { id: 'quarters', type: 'play', tempo: 0.4,
        text: 'C4/1 C4/1 C4/1 C4/1 | D4/2 D4/2 D4/2 D4/2 | E4/3 E4/3 D4/2 D4/2 | C4/1 C4/1 C4/1 C4/1' },
      { id: 'lengths', type: 'learn', pic: { from: 'C4', to: 'C5', names: 'all' }, listen: 'C4_2 D4_2 | E4 - E4 - | C4_4', demo: { tl: 'count', tempo: 0.6 } },
      { id: 'long', type: 'play', tempo: 0.4, text: 'C4/1_2 D4/2_2 | E4/3_2 C4/1_2 | E4/3 F4/4 G4/5_2 | C4/1_4' },
      { id: 'rests', type: 'play', tempo: 0.4, text: 'C4/1 - C4/1 - | E4/3 - E4/3 - | G4/5 G4/5 - G4/5 | C4/1_2 -_2' },
      { id: 'tune', type: 'play', tempo: 0.6,
        // "Au clair de la lune" (French folk song, traditional)
        text: 'C4/1 C4/1 C4/1 D4/2 | E4/3_2 D4/2_2 | C4/1 E4/3 D4/2 D4/2 | C4/1_4 |\n' +
              'C4/1 C4/1 C4/1 D4/2 | E4/3_2 D4/2_2 | C4/1 E4/3 D4/2 D4/2 | C4/1_4' }
    ] },
    { id: 'hold', name: 'lessonHold', desc: 'lessonHoldDesc', steps: [
      { id: 'long', type: 'learn', pic: { from: 'C4', to: 'C5', names: 'all' }, listen: 'C4_4 | E4_2 G4_2 | C4 D4 E4 F4 | G4_4', demo: { tl: 'count', tempo: 0.8 } },
      { id: 'whole', type: 'play', hold: 'L',
        text: 'C3/5+C4/1 D4/2 E4/3 F4/4 | G3/1+G4/5 F4/4 E4/3 D4/2 | C3/5+C4/1 D4/2 E4/3 F4/4 | G3/1+G4/5_4' },
      { id: 'halves', type: 'learn', pic: { from: 'C3', to: 'C5' }, listen: 'C3+E4 D4 E3+C4 D4 | F3+F4 E4 E3+G4 E4', demo: { tl: 'count', tempo: 0.8 } },
      { id: 'half', type: 'play', hold: 'L',
        text: 'C3/5+E4/3 D4/2 E3/3+C4/1 D4/2 | F3/2+F4/4 E4/3 E3/3+G4/5 E4/3 | D3/4+D4/2 F4/4 G3/1+G4/5 F4/4 | C3/5+E4/3 D4/2 C4/1_2' },
      { id: 'piece', type: 'play', hold: 'L',
        text: 'C3/5+C4/1 D4/2 E4/3 F4/4 | G3/1+G4/5 F4/4 E4/3 D4/2 | E3/3+E4/3 D4/2 C4/1 D4/2 | G3/1+E4/3 F4/4 G4/5_2 |\n' +
              'C3/5+E4/3 D4/2 E3/3+C4/1 D4/2 | F3/2+F4/4 E4/3 E3/3+G4/5 E4/3 | D3/4+D4/2 F4/4 G3/1+G4/5 F4/4 | C3/5+E4/3 D4/2 C4/1_2' }
    ] },
    { id: 'rhythm', name: 'lessonRhythm', desc: 'lessonRhythmDesc', steps: [
      { id: 'eighth', type: 'learn', pic: { from: 'C4', to: 'C5', names: 'all' }, listen: 'C4 C4 D4_0.5 D4_0.5 E4 | E4_0.5 D4_0.5 C4_0.5 D4_0.5 E4 E4 | C4_4', demo: { tl: 'count', tempo: 0.6 } },
      { id: 'pairs', type: 'play', tempo: 0.4,
        text: 'C4/1 D4/2 E4/3 E4/3 | D4/2_0.5 D4/2_0.5 E4/3_0.5 E4/3_0.5 D4/2_2 | E4/3_0.5 F4/4_0.5 G4/5 G4/5_0.5 F4/4_0.5 E4/3 | D4/2_0.5 D4/2_0.5 D4/2 C4/1_2' },
      { id: 'dot', type: 'learn', pic: { from: 'C4', to: 'C5', names: 'all' }, listen: 'C4_3 E4 | D4_3 F4 | E4_1.5 D4_0.5 D4_2 | C4_4', demo: { tl: 'count', tempo: 0.6 } },
      { id: 'dots', type: 'play', tempo: 0.4, text: 'C4/1_3 D4/2 | E4/3_3 F4/4 | G4/5_1.5 F4/4_0.5 E4/3 D4/2 | C4/1_1.5 D4/2_0.5 C4/1_2' },
      // Ode to Joy: melody by Ludwig van Beethoven (1824), public domain
      { id: 'ode', type: 'play', tempo: 0.6,
        text: 'E4/3 E4/3 F4/4 G4/5 | G4/5 F4/4 E4/3 D4/2 | C4/1 C4/1 D4/2 E4/3 | E4/3_1.5 D4/2_0.5 D4/2_2 |\n' +
              'E4/3 E4/3 F4/4 G4/5 | G4/5 F4/4 E4/3 D4/2 | C4/1 C4/1 D4/2 E4/3 | D4/2_1.5 C4/1_0.5 C4/1_2' },
      { id: 'three', type: 'learn', pic: { from: 'C4', to: 'C5', names: 'all' }, listen: '3/4 C4 E4 G4 | G4_2 E4 | F4 D4 F4 | E4_3', demo: { tl: 'count', tempo: 0.6 } },
      // written for Pliktra
      { id: 'waltz', type: 'play', tempo: 0.6,
        text: '3/4 C3/5+C4/1 E4/3 G4/5 | C3/5+G4/5_2 E4/3 | G3/1+F4/4_0.5 E4/3_0.5 D4/2 F4/4 | C3/5+E4/3_3 |\n' +
              'C3/5+C4/1 E4/3 G4/5 | C3/5+G4/5_2 E4/3 | G3/1+F4/4_0.5 E4/3_0.5 D4/2 E4/3_0.5 D4/2_0.5 | C3/5+C4/1_3' }
    ] },
    { id: 'dynamics', name: 'lessonDyn', desc: 'lessonDynDesc', steps: [
      { id: 'pf', type: 'learn', pic: { from: 'C4', to: 'C5', names: 'all' }, listen: 'C4 E4 G4 E4 | C4 E4 G4 E4 | C4_4', demo: { tl: 'vel', dyn: ['p', 'f', 'f'] } },
      { id: 'softloud', type: 'play', dyn: ['p', 'p', 'f', 'f'],
        text: 'C4/1 D4/2 E4/3 F4/4 | G4/5_4 | C4/1 D4/2 E4/3 F4/4 | G4/5_4' },
      { id: 'echo', type: 'play', dyn: ['f', 'f', 'p', 'p', 'f', 'f', 'p', 'p'],
        // "Hänschen klein" (German folk song, traditional)
        text: 'G4/5 E4/3 E4/3_2 | F4/4 D4/2 D4/2_2 | G4/5 E4/3 E4/3_2 | F4/4 D4/2 D4/2_2 |\n' +
              'C4/1 D4/2 E4/3 F4/4 | G4/5 G4/5 G4/5_2 | C4/1 D4/2 E4/3 F4/4 | G4/5 G4/5 G4/5_2' },
      { id: 'cresc', type: 'learn', pic: { from: 'C4', to: 'C5', names: 'all' }, listen: 'C4 D4 E4 F4 | G4 F4 E4 D4 | C4 D4 E4 F4 | G4_4', demo: { tl: 'vel', dyn: 'cresc' } },
      { id: 'louder', type: 'play', dyn: 'cresc',
        text: 'C4/1 D4/2 E4/3 F4/4 | G4/5 F4/4 E4/3 D4/2 | C4/1 D4/2 E4/3 F4/4 | G4/5_4' }
    ] },
    { id: 'legato', name: 'lessonLegato', desc: 'lessonLegatoDesc', steps: [
      { id: 'smooth', type: 'learn', pic: { from: 'C4', to: 'C5', names: 'all' }, listen: 'C4 D4 E4 F4 | G4 F4 E4 D4 | C4_4',
        demo: { tl: 'legato', vars: [{ id: 'joined', legato: 'joined' }, { id: 'gap', legato: 'gap' }, { id: 'blur', legato: 'blur' }] } },
      { id: 'pairs', type: 'play', legato: 'R', text: 'C4/1 D4/2 C4/1 D4/2 | E4/3 F4/4 E4/3 F4/4 | G4/5 F4/4 E4/3 D4/2 | C4/1_4' },
      { id: 'line', type: 'play', legato: 'R', text: 'C4/1 D4/2 E4/3 F4/4 | G4/5 F4/4 E4/3 D4/2 | C4/1 E4/3 D4/2 F4/4 | E4/3 D4/2 C4/1_2' },
      { id: 'left', type: 'play', legato: 'L', text: 'C3/5 D3/4 E3/3 F3/2 | G3/1 F3/2 E3/3 D3/4 | C3/5 E3/3 D3/4 F3/2 | E3/3 D3/4 C3/5_2' },
      { id: 'tune', type: 'play', legato: 'R', text: 'G4/5 F4/4 E4/3 D4/2 | E4/3 F4/4 G4/5_2 | E4/3 D4/2 C4/1 D4/2 | E4/3 D4/2 C4/1_2' },
      { id: 'both', type: 'play', legato: 'B',
        text: 'C3/5+C4/1 D3/4+D4/2 E3/3+E4/3 F3/2+F4/4 | G3/1+G4/5 F3/2+F4/4 E3/3+E4/3 D3/4+D4/2 | C3/5+C4/1_4' }
    ] },
    { id: 'alternate', name: 'lessonAlt', desc: 'lessonAltDesc', steps: [
      { id: 'ready', type: 'learn', pic: { from: 'C3', to: 'C5', marks: 'C3/5 D3/4 E3/3 F3/2 G3/1 C4/1 D4/2 E4/3 F4/4 G4/5' } },
      { id: 'pass', type: 'play', exact: true,
        text: 'C3/5 D3/4 E3/3 F3/2 | G3/1 C4/1 D4/2 E4/3 | F4/4 G4/5 F4/4 E4/3 | D4/2 C4/1 G3/1 F3/2 | E3/3 D3/4 C3/5_2' },
      { id: 'turns', type: 'play', exact: true,
        text: 'C3/5 C4/1 E3/3 E4/3 | G3/1 G4/5 E3/3 E4/3 | C3/5 C4/1_3' },
      { id: 'piece', type: 'play', exact: true,
        text: 'C3/5 D3/4 E3/3 F3/2 | G3/1 C4/1 D4/2 E4/3 | F4/4 G4/5 F4/4 E4/3 | D4/2 C4/1 G3/1 F3/2 |\n' +
              'E3/3 D3/4 C3/5_2 | C3/5 C4/1 E3/3 E4/3 | G3/1 G4/5 E3/3 E4/3 | C3/5 C4/1_3' }
    ] },
    { id: 'thumb', name: 'lessonThumb', desc: 'lessonThumbDesc', oldHand: 'R', steps: [
      { id: 'why', type: 'learn', pic: { from: 'C4', to: 'C5', names: 'all', marks: 'C4/1 D4/2 E4/3 F4/1 G4/2 A4/3 B4/4 C5/5' },
        listen: 'C4 D4 E4 F4 | G4 A4 B4 C5_2' },
      { id: 'prep', type: 'play', text: 'C4/1 D4/2 E4/3 F4/1 | G4/2_4 | C4/1 D4/2 E4/3 F4/1 | G4/2_4' },
      { id: 'up', type: 'play', text: 'C4/1 D4/2 E4/3 F4/1 | G4/2 A4/3 B4/4 C5/5' },
      { id: 'over', type: 'learn', pic: { from: 'C4', to: 'C5', names: 'all', marks: 'C4/1 D4/2 E4/3 F4/1 G4/2 A4/3 B4/4 C5/5' } },
      { id: 'down', type: 'play', text: 'C5/5 B4/4 A4/3 G4/2 | F4/1 E4/3 D4/2 C4/1' },
      { id: 'scale', type: 'play',
        text: 'C4/1 D4/2 E4/3 F4/1 | G4/2 A4/3 B4/4 C5/5 | B4/4 A4/3 G4/2 F4/1 | E4/3 D4/2 C4/1_2' }
    ] },
    { id: 'contrary', name: 'lessonContrary', desc: 'lessonContraryDesc', steps: [
      { id: 'mirror', type: 'learn', pic: { from: 'F2', to: 'G4', marks: 'F2/5 G2/4 A2/3 B2/2 C3/1 C4/1 D4/2 E4/3 F4/4 G4/5' } },
      { id: 'five', type: 'play',
        text: 'C3/1+C4/1 B2/2+D4/2 A2/3+E4/3 G2/4+F4/4 | F2/5+G4/5 G2/4+F4/4 A2/3+E4/3 B2/2+D4/2 | C3/1+C4/1_4' },
      { id: 'cross', type: 'learn', pic: { from: 'C2', to: 'C5', marks: 'C2/5 D2/4 E2/3 F2/2 G2/1 A2/3 B2/2 C3/1 C4/1 D4/2 E4/3 F4/1 G4/2 A4/3 B4/4 C5/5' },
        listen: 'C3+C4 B2+D4 A2+E4 G2+F4 | F2+G4 E2+A4 D2+B4 C2+C5_2' },
      { id: 'scale', type: 'play',
        text: 'C3/1+C4/1 B2/2+D4/2 A2/3+E4/3 G2/1+F4/1 | F2/2+G4/2 E2/3+A4/3 D2/4+B4/4 C2/5+C5/5 |\n' +
              'D2/4+B4/4 E2/3+A4/3 F2/2+G4/2 G2/1+F4/1 | A2/3+E4/3 B2/2+D4/2 C3/1+C4/1_2' }
    ] },
    { id: 'triads', name: 'lessonTriads', desc: 'lessonTriadsDesc', steps: [
      { id: 'triad', type: 'learn', pic: { from: 'C4', to: 'C5', names: 'all', marks: 'C4/1+E4/3+G4/5' },
        listen: 'C4 E4 G4 - | C4+E4+G4_2' },
      { id: 'c', type: 'play', text: 'C4/1 E4/3 G4/5 E4/3 | C4/1+E4/3+G4/5_4 | G4/5 E4/3 C4/1 E4/3 | C4/1+E4/3+G4/5_4' },
      { id: 'minor', type: 'learn', pic: { from: 'C4', to: 'C5', names: 'all', marks: 'C4/1+Eb4/3+G4/5' },
        listen: 'C4+E4+G4_2 C4+Eb4+G4_2' },
      { id: 'cm', type: 'play', text: 'C4/1+E4/3+G4/5_2 C4/1+Eb4/3+G4/5_2 | C4/1+E4/3+G4/5_2 C4/1+Eb4/3+G4/5_2 | C4/1+E4/3+G4/5_4' },
      { id: 'move', type: 'learn', pic: { from: 'C4', to: 'E5', names: 'all', marks: 'F4/1+A4/3+C5/5' },
        listen: 'C4+E4+G4_2 F4+A4+C5_2 | G4+B4+D5_2 C4+E4+G4_2' },
      { id: 'fg', type: 'play',
        text: 'F4/1+A4/3+C5/5_2 F4/1+Ab4/3+C5/5_2 | G4/1+B4/3+D5/5_2 G4/1+Bb4/3+D5/5_2 | C4/1+E4/3+G4/5_4' },
      { id: 'both', type: 'play', pic: { from: 'C3', to: 'C5', marks: 'C3/5+E3/3+G3/1 C4/1+E4/3+G4/5' },
        text: 'C3/5+E3/3+G3/1_2 C3/5+Eb3/3+G3/1_2 | C3/5+E3/3+G3/1_4 |\n' +
              'C3/5+E3/3+G3/1+C4/1+E4/3+G4/5_2 C3/5+Eb3/3+G3/1+C4/1+Eb4/3+G4/5_2 | C3/5+E3/3+G3/1+C4/1+E4/3+G4/5_4' }
    ] },
    { id: 'pedal', name: 'lessonPedal', desc: 'lessonPedalDesc', steps: [
      { id: 'what', type: 'learn', showPedal: true, pic: { from: 'A3', to: 'C5', names: 'all' }, listen: 'C4+E4+G4_4',
        demo: { tl: 'pedal', names: ['C'], vars: [{ id: 'without', pedal: 'off', hold: 0.5 }, { id: 'with', pedal: 'hold', hold: 0.5 }] } },
      { id: 'change', type: 'learn', showPedal: true, pic: { from: 'A3', to: 'C5', names: 'all' }, listen: 'C4+E4+G4_2 C4+F4+A4_2 | B3+D4+G4_2 C4+E4+G4_2',
        demo: { tl: 'pedal', names: ['C', 'F', 'G', 'C'], vars: [{ id: 'clean', pedal: 'clean', lift: 0.3 }, { id: 'early', pedal: 'early', lift: 0.3 }, { id: 'never', pedal: 'never', lift: 0.3 }] } },
      { id: 'chords', type: 'play', pedal: 'bar',
        text: 'C4/1+E4/3+G4/5_4 | C4/1+F4/3+A4/5_4 | R:B3/1+D4/2+G4/5_4 | C4/1+E4/3+G4/5_4' },
      { id: 'bass', type: 'play', pedal: 'bar',
        text: 'C3/5+C4/1+E4/3+G4/5_4 | F3/2+C4/1+F4/3+A4/5_4 | G3/1+R:B3/1+D4/2+G4/5_4 | C3/5+C4/1+E4/3+G4/5_4' },
      { id: 'piece', type: 'play', pedal: 'bar',
        text: 'C3/5+E4/3 G4/5 E4/3 C4/1 | F3/2+F4/3 A4/5 F4/3 C4/1 | G3/1+D4/2 G4/5 D4/2 R:B3/1 | C3/5+C4/1+E4/3+G4/5_4' }
    ] }
  ];

  function get(id) { return LIST.filter(function (l) { return l.id === id; })[0] || null; }
  function next(id) { var i = LIST.indexOf(get(id)); return i >= 0 ? LIST[i + 1] || null : null; }
  function stepIndex(l, sid) { for (var i = 0; i < l.steps.length; i++) if (l.steps[i].id === sid) return i; return -1; }
  function key(l, s, part) { return 'lx_' + l.id + '_' + s.id + '_' + part; }   // text key: t / x / h
  function plays(l) { return l.steps.filter(function (s) { return s.type === 'play'; }); }

  // A play step as a song for the practice screen (id "lesson:<id>"), or null.
  function song(id, sid) {
    var l = get(id), i = l ? stepIndex(l, sid) : -1, s = i >= 0 ? l.steps[i] : null;
    if (!s || s.type !== 'play') return null;
    return { id: 'lesson:' + l.id, title: '', kind: 'text', text: s.text, notes: parseSongText(s.text).notes,
      lesson: l.id, lessonStep: s.id, exact: !!s.exact };
  }
  // The play step to practise when a lesson is opened again at step `sid`: that one, the next one after it,
  // or the last one.
  function playFrom(l, sid) {
    var i = Math.max(0, stepIndex(l, sid)), ps = plays(l);
    for (var k = i; k < l.steps.length; k++) if (l.steps[k].type === 'play') return l.steps[k];
    return ps[ps.length - 1];
  }

  // The hands a song text uses: 'B', or 'R' / 'L' when it is for one hand only.
  function hands(text) {
    var hs = {};
    parseSongText(text).notes.forEach(function (n) { hs[n.h] = true; });
    return hs.R && hs.L ? 'B' : hs.R ? 'R' : 'L';
  }

  // The bar (1, 2, ...) of time t (seconds) in a song text; a pickup is bar 1.
  function barOf(text, t) {
    var p = parseSongText(text), barLen = p.meter[0] * 4 / p.meter[1], pick = p.pickup || 0;
    return Math.max(0, Math.floor((t / BEAT_SEC - pick) / barLen + 1e-6) + (pick ? 1 : 0)) + 1;
  }

  // The keyboard picture of a step: its own, or for a play step the keys it uses, each with its
  // (first) finger, from the C below the lowest key to the C above the highest.
  function picFor(step) {
    if (step.pic) return step.pic;
    if (step.type !== 'play') return null;
    var seen = {}, marks = [], lo = 127, hi = 0;
    parseSongText(step.text).notes.forEach(function (n) {
      lo = Math.min(lo, n.m); hi = Math.max(hi, n.m);
      if (seen[n.m]) return;
      seen[n.m] = true;
      marks.push(n.h + ':' + midiToName(n.m) + (n.f ? '/' + n.f : ''));
    });
    if (!marks.length) return null;
    var from = lo - lo % 12, to = hi + (12 - hi % 12) % 12;
    if (to - from < 12) to = from + 12;
    return { from: midiToName(from), to: midiToName(to), marks: marks.join(' ') };
  }

  // Progress of one lesson: { p: { <play step id>: 1 }, at: <step id last opened> }.
  // 'new', 'tried' or 'done'. best: the app's best scores (old lessons: "lesson:<id>:<hand>" -> %).
  function passedCount(l, pr) {
    return plays(l).filter(function (s) { return pr && pr.p && pr.p[s.id]; }).length;
  }
  function status(l, pr, best) {
    var legacy = false, any = false;
    ['B', 'R', 'L'].forEach(function (x) {
      var v = best && best['lesson:' + l.id + ':' + x];
      if (v == null) return;
      any = true;
      if (v >= LEGACY && (x === 'B' || x === l.oldHand)) legacy = true;
    });
    if (legacy || passedCount(l, pr) === plays(l).length) return 'done';
    return any || (pr && (pr.at || passedCount(l, pr))) ? 'tried' : 'new';
  }
  var MARK = { 'new': '○', tried: '◐', done: '✓' };

  // ---- the "hold" check: long notes must stay down until they end
  // Notes of hand h that last 2 beats or more: [{ m, t, end }] (seconds). A note lasts until that hand's
  // next note or the bar line, as in the sheet music.
  function holdSpans(text, h) {
    var p = parseSongText(text), barLen = p.meter[0] * 4 / p.meter[1], pick = p.pickup || 0;
    var ns = p.notes.filter(function (n) { return n.h === h; });
    var out = [];
    ns.forEach(function (n) {
      var b = n.t / BEAT_SEC, nextT = Infinity;
      ns.forEach(function (x) { if (x.t > n.t + 0.01 && x.t < nextT) nextT = x.t; });
      var barEnd = (Math.floor((b - pick) / barLen + 1e-6) + 1) * barLen + pick;
      var end = Math.min(nextT / BEAT_SEC, barEnd);
      if (end - b >= 2 - 1e-6) out.push({ m: n.m, t: n.t, end: end * BEAT_SEC, h: h });
    });
    return out;
  }
  // Key m was let go while the step at time `now` (seconds) is to be played: the span it was cut short, or null.
  function holdBroken(spans, m, now) {
    for (var i = 0; i < spans.length; i++) {
      var s = spans[i];
      if (s.m === m && s.t < now - 0.01 && now < s.end - 0.01) return s;
    }
    return null;
  }

  // ---- the "loud and soft" check (MIDI velocity)
  // The dynamic wanted at time t (seconds): 'p', 'f', 'cresc' or null.
  function dynAt(step, t) {
    if (!step || !step.dyn) return null;
    if (step.dyn === 'cresc') return 'cresc';
    return step.dyn[Math.min(barOf(step.text, t), step.dyn.length) - 1];
  }
  function mean(a) { return a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : 0; }
  // recs: [{ t, v }] (v = velocity, null from the screen or computer keys).
  // -> { ok, noPiano, soft, loud } for p/f, { ok, noPiano, first, last } for cresc.
  function dynCheck(step, recs) {
    if (!recs.length || recs.some(function (r) { return r.v == null; })) return { ok: false, noPiano: true };
    if (step.dyn === 'cresc') {
      var rs = recs.slice().sort(function (a, b) { return a.t - b.t; }), k = Math.max(1, Math.floor(rs.length / 3));
      var first = mean(rs.slice(0, k).map(function (r) { return r.v; })), last = mean(rs.slice(-k).map(function (r) { return r.v; }));
      return { ok: last - first >= DYN_GAP, first: Math.round(first), last: Math.round(last) };
    }
    var soft = [], loud = [];
    recs.forEach(function (r) { (dynAt(step, r.t) === 'p' ? soft : loud).push(r.v); });
    var ms = mean(soft), ml = mean(loud), mid = (ms + ml) / 2;
    var right = soft.filter(function (v) { return v < mid; }).length + loud.filter(function (v) { return v > mid; }).length;
    return { ok: soft.length > 0 && loud.length > 0 && ml - ms >= DYN_GAP && right >= 0.8 * recs.length,
      soft: Math.round(ms), loud: Math.round(ml) };
  }

  // ---- the "legato" check: two notes of one hand, one after the other
  // pressNext: when the next key went down; releasePrev: when the previous one came up (may be later), ms.
  // -> 'ok', 'gap' (silence between them) or 'overlap' (both down too long: blurred)
  function legatoGrade(pressNext, releasePrev) {
    var d = pressNext - releasePrev;
    return d > LEGATO_GAP ? 'gap' : -d > LEGATO_OVERLAP ? 'overlap' : 'ok';
  }

  // ---- the "pedal" check (legato pedalling: new chord, then pedal up and down again at once)
  // The times (seconds) of the steps where the pedal changes: the first step of every bar.
  function pedalPoints(text) {
    var p = parseSongText(text), barLen = p.meter[0] * 4 / p.meter[1], pick = p.pickup || 0, out = [];
    buildSteps(p.notes, 'B').forEach(function (st) {
      var b = (st.t / BEAT_SEC - pick) / barLen;
      if (Math.abs(b - Math.round(b)) < 1e-6) out.push(st.t);
    });
    return out;
  }
  // starts: when each pedal point's chord was struck (ms, rising); events: [{ at, down }] (ms, rising;
  // the pedal's state when playing began comes first); endAt: when the step ended (ms).
  // -> [{ res: 'ok' | 'early' (lifted before the new chord) | 'blur' (not lifted) | 'missing' (not down again) }]
  // Each mistake is told where it happens: after a 'missing' the pedal is up anyway, so the next chord
  // just has to catch it again (not 'early').
  function pedalCheck(starts, events, endAt) {
    function downAt(x) { var d = false; events.forEach(function (e) { if (e.at <= x) d = e.down; }); return d; }
    function downIn(a, b) { return events.some(function (e) { return e.down && e.at > a && e.at < b; }); }
    var prev = null;
    return starts.map(function (s, k) {
      var next = k + 1 < starts.length ? starts[k + 1] : endAt, res;
      if (k === 0 || prev === 'missing') {   // the pedal only has to catch this chord
        res = downAt(s) || downIn(s - PEDAL_TOL, next) ? 'ok' : 'missing';
      } else if (!downAt(s - PEDAL_TOL)) {
        res = 'early';
      } else {
        var up = events.filter(function (e) { return !e.down && e.at >= s - PEDAL_TOL && e.at < next; })[0];
        if (!up) res = 'blur';
        else if (downIn(up.at, next)) res = 'ok';
        // lifted without pressing again: soon after the chord = forgot to press again; late = the next chord's
        // early lift, so this chord was not changed at all
        else res = k + 1 === starts.length || up.at - s < (next - s) / 2 ? 'missing' : 'blur';
      }
      prev = res;
      return { res: res };
    });
  }
  function pedalPassed(results) {
    var ok = results.filter(function (r) { return r.res === 'ok'; }).length;
    return results.length > 0 && ok >= PEDAL_PASS * results.length;
  }

  // ---- keyboard picture (SVG text): keys from..to, marks (song text: keys with finger numbers, hand colours),
  // names: 'all' (white keys) / 'c' (only C) / none, lit: { midi: 'on' | 'ok' | 'bad' | 'play' }.
  // Each key has data-m (its MIDI number), so it can be tapped.
  function keysSvg(pic, lit) {
    var lo = parseNoteName(pic.from), hi = parseNoteName(pic.to), W = 20, H = 92, BW = 12, BH = 56;
    var marks = {};
    if (pic.marks) parseSongText(pic.marks).notes.forEach(function (n) { marks[n.m] = n; });
    lit = lit || {};
    var whites = [], x = {}, out = [];
    for (var m = lo; m <= hi; m++) if (!isBlack(m)) { x[m] = whites.length * W; whites.push(m); }
    for (var b = lo; b <= hi; b++) if (isBlack(b)) x[b] = (x[b - 1] != null ? x[b - 1] + W : 0) - BW / 2;
    var w = whites.length * W, dense = whites.length > 30;
    out.push('<svg class="kpic" viewBox="-1 -1 ' + (w + 2) + ' ' + (H + 2) + '" role="img" aria-hidden="true">');
    var mark = function (m, cx, cy, white) {
      var n = marks[m];
      if (!n) return '';
      var r = dense ? 4 : 7;
      return '<circle class="km ' + n.h + '" cx="' + cx + '" cy="' + cy + '" r="' + r + '"/>' +
        (n.f && !dense ? '<text class="kf' + (white ? '' : ' on-black') + '" x="' + cx + '" y="' + (cy + 4) + '">' + n.f + '</text>' : '');
    };
    whites.forEach(function (m) {
      out.push('<rect class="kw' + (lit[m] ? ' ' + lit[m] : '') + '" data-m="' + m + '" x="' + x[m] + '" y="0" width="' + W + '" height="' + H + '" rx="2"/>');
    });
    whites.forEach(function (m) {
      var name = midiToName(m), letter = name.replace(/-?\d+$/, '');
      out.push(mark(m, x[m] + W / 2, H - 26, true));
      if (pic.names === 'all' || (pic.names === 'c' && letter === 'C')) {
        out.push('<text class="kn" x="' + (x[m] + W / 2) + '" y="' + (H - 6) + '">' +
          (letter === 'C' && pic.names === 'c' ? localNoteName(name) : localNoteName(letter)) + '</text>');
      }
    });
    for (var k = lo; k <= hi; k++) {
      if (!isBlack(k)) continue;
      out.push('<rect class="kb' + (lit[k] ? ' ' + lit[k] : '') + '" data-m="' + k + '" x="' + x[k] + '" y="0" width="' + BW + '" height="' + BH + '" rx="1.5"/>');
      out.push(mark(k, x[k] + BW / 2, BH - 12, false));
    }
    out.push('</svg>');
    return out.join('');
  }

  // ---- demos on learn cards: Listen plays an example and draws it on a timeline under the keyboard.
  // step.demo: { tl: 'count' (note values, counts, clicks) | 'vel' (how strongly each note is struck) |
  //   'legato' (each key's time down, by pitch) | 'pedal' (keys, sound, pedal),
  //   tempo: speed (count demos; else the Listen speed), dyn: ['p', 'f', ...] per bar or 'cresc',
  //   vars: [{ id, legato: 'joined'|'gap'|'blur' } | { id, pedal: 'clean'|'early'|'never'|'hold'|'off', lift, hold }],
  //   names: chord names for the pedal timeline }
  var DEMO_VEL = { p: 38, f: 108 };
  function demoVar(step, id) {
    var vs = (step.demo && step.demo.vars) || [];
    return vs.filter(function (v) { return v.id === id; })[0] || vs[0] || {};
  }
  // Everything the example does, in seconds from its start: notes (key down on..off, sound until snd,
  // velocity v, written length in beats), rests, pedal moves, metronome clicks.
  function demoPlan(step, varId, speed) {
    var d = step.demo || {}, v = demoVar(step, varId), p = parseSongText(step.listen);
    var sc = 1 / (d.tempo || speed || 1), beat = 0.5 * sc, barBeats = p.meter[0] * 4 / p.meter[1];
    var lead = v.pedal === 'hold' ? 0.3 : 0;   // the foot goes down before the chord
    var restBeats = p.rests.map(function (r) { return r / 0.5; });
    var notes = p.notes.map(function (n) {
      // as in the sheet music: a note lasts until that hand's next note, a rest or the bar line
      var b0 = n.t / 0.5, stop = (Math.floor(b0 / barBeats + 1e-6) + 1) * barBeats;
      p.notes.forEach(function (x) { if (x.h === n.h && x.t / 0.5 > b0 + 1e-6) stop = Math.min(stop, x.t / 0.5); });
      restBeats.forEach(function (r) { if (r > b0 + 1e-6) stop = Math.min(stop, r); });
      var beats = Math.max(Math.round(n.d / 0.46 * 8) / 8, Math.round((stop - b0) * 8) / 8);
      return { m: n.m, h: n.h, on: lead + n.t * sc, len: beats * beat, beats: beats, b: b0 };
    });
    var onsets = [];
    notes.forEach(function (n) { if (onsets.indexOf(n.on) < 0) onsets.push(n.on); });
    onsets.sort(function (a, b) { return a - b; });
    function nextOn(n) {   // the next note of the same hand (a chord counts once)
      var o = notes.filter(function (x) { return x.h === n.h && x.on > n.on + 1e-6; }).map(function (x) { return x.on; });
      return o.length ? Math.min.apply(null, o) : null;
    }
    var vel = null;
    if (d.dyn === 'cresc') {
      vel = function (n) { var i = onsets.indexOf(n.on); return Math.round(30 + (115 - 30) * i / Math.max(1, onsets.length - 1)); };
    } else if (d.dyn) {
      vel = function (n) { return DEMO_VEL[d.dyn[Math.min(d.dyn.length - 1, Math.floor(n.b / barBeats + 1e-6))]] || 80; };
    }
    notes.forEach(function (n) {
      var nx = nextOn(n), gap = nx != null ? nx - n.on : n.len;
      if (v.legato === 'joined') n.off = nx != null ? nx + 0.01 : n.on + n.len;
      else if (v.legato === 'gap') n.off = n.on + gap * 0.5;
      else if (v.legato === 'blur') n.off = n.on + gap * 1.6;
      else if (v.hold) n.off = n.on + v.hold;
      else if (v.lift) {   // chord by chord: the hands leave before the next chord (of either hand)
        var nc = onsets.filter(function (t) { return t > n.on + 1e-6; })[0];
        n.off = Math.max(n.on + 0.15, (nc != null ? nc : n.on + n.len) - v.lift);
      }
      else n.off = n.on + Math.max(0.08, n.len - 0.04);
      if (vel) n.v = vel(n);
    });
    var end = Math.max.apply(null, notes.map(function (n) { return n.on + n.len; }));
    var first = onsets[0] || 0, ped = [];
    if (v.pedal === 'hold') ped = [{ at: 0, down: true }, { at: end, down: false }];
    else if (v.pedal === 'never') ped = [{ at: first + 0.15, down: true }, { at: end, down: false }];
    else if (v.pedal === 'clean' || v.pedal === 'early') {
      ped.push({ at: first + 0.15, down: true });
      onsets.slice(1).forEach(function (t) {
        // clean: up and down again just after the new chord; early: up before the hands leave
        ped.push({ at: v.pedal === 'clean' ? t + 0.06 : t - (v.lift || 0.3) - 0.15, down: false });
        ped.push({ at: t + 0.22, down: true });
      });
      ped.push({ at: end, down: false });
    }
    function upAfter(x) {   // the sound of a key let go at x lasts until the pedal is up
      var down = false;
      ped.forEach(function (e) { if (e.at <= x) down = e.down; });
      if (!down) return x;
      var up = ped.filter(function (e) { return !e.down && e.at > x; })[0];
      return up ? up.at : end;
    }
    notes.forEach(function (n) { n.snd = upAfter(n.off); });
    var rests = [];
    ['R', 'L'].forEach(function (h) {
      var hn = notes.filter(function (n) { return n.h === h; }), at = 0;
      if (!hn.length) return;
      onsets.forEach(function (t) {
        var c = hn.filter(function (n) { return n.on === t; })[0];
        if (!c) return;
        var gapBeats = Math.round((c.on - lead - at) / beat * 8) / 8;
        if (gapBeats >= 1) rests.push({ h: h, on: lead + at, beats: gapBeats });
        at = c.on - lead + c.beats * beat;
      });
    });
    var total = Math.ceil(p.beats / barBeats - 1e-6) * barBeats, clicks = [];
    if (d.tl === 'count') for (var b = 0; b < total; b++) clicks.push({ at: lead + b * beat, accent: b % barBeats === 0 });
    var dur = Math.max(end, d.tl === 'count' ? lead + total * beat : 0);
    notes.forEach(function (n) { dur = Math.max(dur, n.snd, n.off); });
    return { tl: d.tl, notes: notes, rests: rests, pedal: ped, clicks: clicks, beat: beat, bar: barBeats,
      beats: total, lead: lead, dur: dur, names: d.names || [], dyn: d.dyn };
  }

  // Small note and rest symbols (x: left edge, y: middle of the note head).
  function glyph(beats, rest, x, y) {
    var hollow = beats >= 2, stem = beats < 4, dot = beats === 3 || beats === 1.5 || beats === 0.75, cx = x + 5;
    if (rest) {
      if (beats >= 4) return '<rect class="gs" x="' + (cx - 4) + '" y="' + (y - 4) + '" width="8" height="3"/><line class="gl" x1="' + (cx - 6) + '" y1="' + (y - 4) + '" x2="' + (cx + 6) + '" y2="' + (y - 4) + '"/>';
      if (beats >= 2) return '<rect class="gs" x="' + (cx - 4) + '" y="' + (y - 1) + '" width="8" height="3"/><line class="gl" x1="' + (cx - 6) + '" y1="' + (y + 2) + '" x2="' + (cx + 6) + '" y2="' + (y + 2) + '"/>';
      return '<path class="gr" d="M' + (cx - 1.5) + ' ' + (y - 9) + 'l3.5 4.5-3 3.5 3.5 4.5c-2.5-1.2-4.5 0-2.2 2.5"/>';
    }
    var s = '<ellipse class="' + (hollow ? 'gh' : 'gs') + '" cx="' + cx + '" cy="' + y + '" rx="' + (beats >= 4 ? 4.6 : 3.9) + '" ry="2.9" transform="rotate(-20 ' + cx + ' ' + y + ')"/>';
    if (stem) s += '<line class="gl" x1="' + (cx + 3.6) + '" y1="' + (y - 1) + '" x2="' + (cx + 3.6) + '" y2="' + (y - 15) + '"/>';
    if (beats < 1) s += '<path class="gr" d="M' + (cx + 3.6) + ' ' + (y - 15) + 'q1 4 4.5 6.5"/>';   // eighth note: a flag
    if (dot) s += '<circle class="gs" cx="' + (cx + 8) + '" cy="' + y + '" r="1.2"/>';
    return s;
  }

  // The timeline as SVG. Notes are rect.tn[data-i] (index in plan.notes), counts text.tc[data-b],
  // the playhead line.ph: app.js moves it and marks what sounds while the example plays.
  // labels: { keys, sound, pedal } (row names of the pedal timeline).
  function timelineSvg(plan, labels) {
    var W = 400, LW = plan.tl === 'pedal' ? 46 : 4, out = [], y = 4, rows = [];
    var halves = plan.tl === 'count' && plan.notes.some(function (n) { return Math.abs(n.b - Math.round(n.b)) > 1e-6; });
    var span = plan.dur > 0 ? plan.dur : 1;
    function X(t) { return LW + t / span * (W - LW - 4); }
    function bar(n, i, cls, y0, h, to) {
      return '<rect class="tn ' + cls + '" data-i="' + i + '" x="' + X(n.on).toFixed(1) + '" y="' + y0 + '" width="' + Math.max(1.5, X(to) - X(n.on) - 0.8).toFixed(1) + '" height="' + h + '" rx="2"/>';
    }
    if (plan.tl === 'count') {
      ['R', 'L'].forEach(function (h) {
        if (!plan.notes.some(function (n) { return n.h === h; })) return;
        plan.notes.forEach(function (n, i) { if (n.h === h) out.push(glyph(n.beats, false, X(n.on) - 1, y + 16)); });
        plan.rests.forEach(function (r) { if (r.h === h) out.push(glyph(r.beats, true, X(r.on) - 1, y + 14)); });
        y += 23;
        plan.notes.forEach(function (n, i) { if (n.h === h) out.push(bar(n, i, h, y, 9, n.on + n.beats * plan.beat)); });
        y += 14;
      });
      for (var b = 0; b < plan.beats; b++) {
        out.push('<text class="tc' + (b % plan.bar === 0 ? ' one' : '') + '" data-b="' + b + '" x="' + (X(plan.lead + b * plan.beat) + 5).toFixed(1) + '" y="' + (y + 10) + '">' + (b % plan.bar + 1) + '</text>');
        if (halves) out.push('<text class="tc and" data-b="' + (b + 0.5) + '" x="' + (X(plan.lead + (b + 0.5) * plan.beat) + 5).toFixed(1) + '" y="' + (y + 10) + '">+</text>');   // “and”
      }
      for (var k = 1; k * plan.bar < plan.beats; k++) {
        var bx = X(plan.lead + k * plan.bar * plan.beat) - 1.5;
        out.push('<line class="bl" x1="' + bx.toFixed(1) + '" y1="2" x2="' + bx.toFixed(1) + '" y2="' + (y + 12) + '"/>');
      }
      y += 14;
    } else if (plan.tl === 'vel') {
      var base = y + 46;
      plan.notes.forEach(function (n, i) {
        var hgt = Math.max(3, (n.v || 80) / 127 * 44);
        out.push('<rect class="tn v" data-i="' + i + '" x="' + X(n.on).toFixed(1) + '" y="' + (base - hgt).toFixed(1) + '" width="' + Math.max(2, X(n.on + n.len) - X(n.on) - 2).toFixed(1) + '" height="' + hgt.toFixed(1) + '" rx="1.5"/>');
      });
      y = base + 4;
      if (plan.dyn === 'cresc') {
        var x0 = X(0) + 2, x1 = X(plan.dur) - 2;
        out.push('<path class="hp" d="M' + x1 + ' ' + (y + 2) + 'L' + x0 + ' ' + (y + 7) + 'L' + x1 + ' ' + (y + 12) + '"/>');
      } else if (plan.dyn) {
        plan.dyn.forEach(function (dd, k) {
          if (k > 0 && plan.dyn[k - 1] === dd) return;
          out.push('<text class="dm" x="' + (X(k * plan.bar * plan.beat) + 3).toFixed(1) + '" y="' + (y + 12) + '">' + dd + '</text>');
        });
      }
      y += 16;
    } else if (plan.tl === 'legato') {
      var ms = [];
      plan.notes.forEach(function (n) { if (ms.indexOf(n.m) < 0) ms.push(n.m); });
      ms.sort(function (a, b) { return b - a; });
      plan.notes.forEach(function (n, i) { out.push(bar(n, i, n.h, y + ms.indexOf(n.m) * 10, 8, n.off)); });
      y += ms.length * 10 + 2;
    } else if (plan.tl === 'pedal') {
      var chords = [];   // one bar per chord: keys down, then what you hear
      plan.notes.forEach(function (n, i) { if (!chords.some(function (c) { return c.on === n.on; })) chords.push({ on: n.on, off: n.off, snd: n.snd, i: i }); });
      rows.push([y + 9, labels.keys]);
      chords.forEach(function (c, k) {
        out.push(bar(c, c.i, 'R', y, 13, c.off));
        if (plan.names[k]) out.push('<text class="cn" x="' + (X(c.on) + 4).toFixed(1) + '" y="' + (y + 10) + '">' + plan.names[k] + '</text>');
      });
      y += 18;
      rows.push([y + 9, labels.sound]);
      chords.forEach(function (c) {
        out.push('<rect class="snd" x="' + X(c.on).toFixed(1) + '" y="' + y + '" width="' + Math.max(1.5, X(c.snd) - X(c.on)).toFixed(1) + '" height="13" rx="2"/>');
      });
      chords.forEach(function (c, k) {   // drawn over the sound bars
        var nx = chords[k + 1];
        if (nx && c.snd > nx.on + 0.12) {   // two chords sounding together: they blur
          out.push('<rect class="clash" x="' + X(nx.on).toFixed(1) + '" y="' + y + '" width="' + (X(c.snd) - X(nx.on)).toFixed(1) + '" height="13"/>');
        }
      });
      y += 18;
      rows.push([y + 9, labels.pedal]);
      var top = y + 2, low = y + 12, path = 'M' + X(0).toFixed(1) + ' ' + top, isDown = false;
      plan.pedal.forEach(function (e) {
        var px = X(e.at).toFixed(1);
        path += 'L' + px + ' ' + (isDown ? low : top) + 'L' + px + ' ' + (e.down ? low : top);
        isDown = e.down;
      });
      path += 'L' + X(plan.dur).toFixed(1) + ' ' + (isDown ? low : top);
      out.push('<path class="pd" d="' + path + '"/>');
      y += 16;
      rows.forEach(function (r) { out.unshift('<text class="rl" x="0" y="' + (r[0] + 3) + '">' + r[1] + '</text>'); });
    }
    out.push('<line class="ph" x1="' + X(0) + '" y1="0" x2="' + X(0) + '" y2="' + y + '"/>');
    return '<svg class="tline" viewBox="0 0 ' + W + ' ' + y + '" data-x0="' + LW + '" data-w="' + (W - LW - 4) + '" data-dur="' + span + '" data-step="' + (halves ? 0.5 : 1) + '" aria-hidden="true">' + out.join('') + '</svg>';
  }

  // ---- "find" steps: does key m count? (find: 'C' = any C, 'C4' = that key)
  function findMatch(step, m) {
    if (/\d/.test(step.find)) return m === parseNoteName(step.find);
    return (m - parseNoteName(step.find + '4') + 1200) % 12 === 0;
  }

  return { LIST: LIST, PASS: PASS, MARK: MARK, get: get, next: next, stepIndex: stepIndex, key: key, plays: plays,
    song: song, playFrom: playFrom, hands: hands, barOf: barOf, picFor: picFor, passedCount: passedCount, status: status,
    holdSpans: holdSpans, holdBroken: holdBroken, legatoGrade: legatoGrade, pedalPoints: pedalPoints,
    pedalCheck: pedalCheck, pedalPassed: pedalPassed, dynAt: dynAt, dynCheck: dynCheck, keysSvg: keysSvg, findMatch: findMatch,
    demoPlan: demoPlan, demoVar: demoVar, timelineSvg: timelineSvg };
})();

if (typeof module !== 'undefined') module.exports = { Lessons: Lessons };
