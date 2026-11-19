'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// sheet.js is a browser script that uses notation.js's globals.
Object.assign(globalThis, require('../js/notation.js'));
const { Sheet } = require('../js/sheet.js');

// Built-in songs, read from app.js so new ones are tested automatically.
function builtinSongs() {
  const app = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
  const out = [];
  const re = /title: '([^']+)',\s*text: ((?:'[^']*'\s*\+?\s*)+)/g;
  let m;
  while ((m = re.exec(app))) out.push([m[1], m[2].trim().replace(/\+$/, '').split(/'\s*\+\s*'/).join('').slice(1, -1).replace(/\\n/g, '\n')]);
  return out;
}

const EXTRA = [
  ['3/4 with rests and an empty bar', '3/4 C4 E4 G4 | C4_3 | L:C3+E4_2 - | -_3'],
  ['tie over the bar line', 'C4_2.5 D4_0.5 E4 | - - G4_2'],
  ['triplet-like lengths', 'C4_0.333 C4_0.333 C4_0.334 C4 D4 E4'],
  ['very short notes', 'C4_0.1 D4_0.1 E4_3.8'],
  ['2/4 with a whole-bar rest', '2/4 C4 | -_2'],
  ['6/8', '6/8 C4_0.5 D4_0.5 E4_0.5 F4_1.5 | G4_3'],
  ['dotted notes and rests, both hands', 'C3+E4_1.5 D4_0.5 C3+E4 F4 | G3+G4_0.75 F4_0.25 E3+E4_3 | C4_0.5 -_1.5 D4_2']
];

// The drawn notes must have the same lengths as the layout (VexFlow only counts a dot when the
// duration says so, e.g. 'qd'); otherwise notes after a dotted one drift and the hands don't line up.
const VF = require('../vendor/vexflow/vexflow-bravura.js').Flow;

test('built-in songs were found', () => {
  const app = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
  const block = app.slice(app.indexOf('var BUILTIN = ['), app.indexOf('var FIRST_BUILTINS'));
  const declared = (block.match(/\{ title: /g) || []).length;
  assert.ok(declared >= 4);
  assert.equal(builtinSongs().length, declared, 'some built-in songs could not be read by this test');
});

for (const [title, text] of builtinSongs().concat(EXTRA)) {
  test('every bar adds up: ' + title, () => {
    const p = parseSongText(text);
    assert.equal(p.errors.length, 0, p.errors.join('; '));
    const lay = Sheet.layoutBars(p);
    const barLen = p.meter[0] * 4 / p.meter[1];
    lay.bars.forEach((bar, i) => ['R', 'L'].forEach(h => {
      const sum = bar[h].reduce((a, it) => a + it.len, 0);
      assert.ok(Math.abs(sum - barLen) < 1e-6, `bar ${i + 1} ${h}: ${sum} beats instead of ${barLen}`);
      let pos = bar.start;
      bar[h].forEach(it => { assert.ok(Math.abs(it.b - pos) < 1e-6, `bar ${i + 1} ${h}: gap or overlap at ${it.b}`); pos += it.len; });
      bar[h].forEach(it => {
        const ticks = Sheet.makeNote(VF, it, h === 'R' ? 'treble' : 'bass', h, {}).getTicks().value();
        assert.equal(ticks, it.len * VF.RESOLUTION / 4, `bar ${i + 1} ${h}: drawn ${it.dur}${it.dotted ? ' dotted' : ''} has the wrong length`);
      });
    }));
  });
}
