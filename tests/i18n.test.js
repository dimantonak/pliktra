'use strict';
const test = require('node:test');
const assert = require('node:assert');
const L = require('../js/i18n.js');

const placeholders = s => (s.match(/\{\w+\}/g) || []).sort().join(',');

for (const lang of Object.keys(L.LANGS)) {
  test('every text exists in ' + lang + ' with the same {placeholders}', () => {
    const en = L.I18N.en, other = L.I18N[lang];
    const missing = Object.keys(en).filter(k => other[k] == null);
    const extra = Object.keys(other).filter(k => en[k] == null);
    assert.deepEqual(missing, [], 'missing in ' + lang);
    assert.deepEqual(extra, [], 'unknown keys in ' + lang);
    for (const k of Object.keys(en)) assert.equal(placeholders(other[k]), placeholders(en[k]), lang + '.' + k);
  });
}

test('every key used in index.html and the scripts exists', () => {
  const fs = require('node:fs'), path = require('node:path');
  const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
  const html = read('index.html');
  const used = new Set();
  for (const m of html.matchAll(/data-i18n(?:-html|-title|-aria|-ph)?="(\w+)"/g)) used.add(m[1]);
  for (const f of ['js/app.js', 'js/notation.js', 'js/midifile.js', 'js/explain.js', 'js/drills.js', 'js/lessons.js']) {
    for (const m of read(f).matchAll(/\bt\('(\w+)'/g)) used.add(m[1]);
  }
  const unknown = [...used].filter(k => L.I18N.en[k] == null);
  assert.deepEqual(unknown, []);
});

test('German note names', () => {
  L.setLang('de');
  const cases = { C4: 'C4', B3: 'H3', Bb3: 'B3', 'F#4': 'Fis4', 'C#5': 'Cis5', Eb4: 'Es4', Ab2: 'As2', Db4: 'Des4', 'A#3': 'Ais3', E: 'E', B: 'H' };
  for (const [en, de] of Object.entries(cases)) assert.equal(L.localNoteName(en), de, en);
  assert.equal(L.t('mistakes', { n: 3 }), 'Fehler 3');
  L.setLang('en');
  assert.equal(L.localNoteName('B3'), 'B3');
  assert.equal(L.t('mistakes', { n: 3 }), 'Mistakes 3');
});
