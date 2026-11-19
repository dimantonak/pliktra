// Pliktra (πλήκτρα, "keys") — wait-mode piano trainer driven by a MIDI piano (or touch / computer keys).
(function () {
  'use strict';

  var $ = function (s) { return document.querySelector(s); };
  var HAND_COLOR = { R: '#4c9aff', L: '#f59f45' };
  var HAND_DEEP = { R: '#2672e0', L: '#d9761c' };
  var HAND_SOFT = { R: '#c8e0ff', L: '#ffe0b8' };

  // ---------------------------------------------------------------- storage
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  };

  // `prev`: earlier versions of a built-in song; an unedited copy on the device is upgraded.
  var BUILTIN = [
    { title: 'C major scale (both hands)',
      text: 'L:C3/5+R:C4/1 L:D3/4+R:D4/2 L:E3/3+R:E4/3 L:F3/2+R:F4/1 L:G3/1+R:G4/2 L:A3/3+R:A4/3 L:B3/2+R:B4/4 L:C4/1+R:C5/5_2\n' +
            'L:B3/2+R:B4/4 L:A3/3+R:A4/3 L:G3/1+R:G4/2 L:F3/2+R:F4/1 L:E3/3+R:E4/3 L:D3/4+R:D4/2 L:C3/5+R:C4/1_2',
      prev: ['L:C3+R:C4 L:D3+R:D4 L:E3+R:E4 L:F3+R:F4 L:G3+R:G4 L:A3+R:A4 L:B3+R:B4 L:C4+R:C5_2\n' +
             'L:B3+R:B4 L:A3+R:A4 L:G3+R:G4 L:F3+R:F4 L:E3+R:E4 L:D3+R:D4 L:C3+R:C4_2'] },
    { title: 'Ode to Joy (right hand)',
      text: 'E4/3 E4/3 F4/4 G4/5 | G4/5 F4/4 E4/3 D4/2 | C4/1 C4/1 D4/2 E4/3 | E4/3_1.5 D4/2_0.5 D4/2_2 |\n' +
            'E4/3 E4/3 F4/4 G4/5 | G4/5 F4/4 E4/3 D4/2 | C4/1 C4/1 D4/2 E4/3 | D4/2_1.5 C4/1_0.5 C4/1_2',
      prev: ['E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | E4_1.5 D4_0.5 D4_2 |\n' +
             'E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | D4_1.5 C4_0.5 C4_2'] },
    { title: 'Twinkle Twinkle (both hands)',
      text: 'C3+C4 C4 E3+G4 G4 | F3+A4 A4 E3+G4_2 | D3+F4 F4 C3+E4 E4 | G2+D4 D4 C3+C4_2 |\n' +
            'E3+G4 G4 D3+F4 F4 | C3+E4 E4 G2+D4_2 | E3+G4 G4 D3+F4 F4 | C3+E4 E4 G2+D4_2 |\n' +
            'C3+C4 C4 E3+G4 G4 | F3+A4 A4 E3+G4_2 | D3+F4 F4 C3+E4 E4 | G2+D4 D4 C3+C4_2' },
    // Melody by James Lord Pierpont (1857, public domain); simple arrangement written for Pliktra.
    { title: 'Jingle Bells (chorus, both hands)',
      text: 'C3/5+E4/3 E4/3 E4/3_2 | C3/5+E4/3 E4/3 E4/3_2 | C3/5+E4/3 G4/5 C4/1_1.5 D4/2_0.5 | C3/5+E4/3_4 |\n' +
            'F3/2+F4/4 F4/4 F4/4_1.5 F4/4_0.5 | C3/5+F4/4 E4/3 E4/3 E4/3_0.5 E4/3_0.5 | G3/1+E4/3 D4/2 D4/2 E4/3 | G3/1+D4/2_2 G4/5_2 |\n' +
            'C3/5+E4/3 E4/3 E4/3_2 | C3/5+E4/3 E4/3 E4/3_2 | C3/5+E4/3 G4/5 C4/1_1.5 D4/2_0.5 | C3/5+E4/3_4 |\n' +
            'F3/2+F4/4 F4/4 F4/4_1.5 F4/4_0.5 | C3/5+F4/4 E4/3 E4/3 E4/3_0.5 E4/3_0.5 | G3/1+G4/5 G4/5 F4/4 D4/2 | C3/5+C4/1_4' },
    // Melody "Good Morning to All" by Mildred and Patty Hill (1893), public domain (in the US since a 2015
    // court ruling, in the EU since 2017). Simple arrangement written for Pliktra.
    { title: 'Happy Birthday (both hands)',
      text: '3/4 key:F pickup:1 C4/1_0.5 C4/1_0.5 | F3/2+D4/2 C4/1 F4/4 | C3/5+E4/3_2 C4/1_0.5 C4/1_0.5 | C3/5+D4/2 C4/1 G4/5 |\n' +
            'F3/2+F4/4_2 C4/1_0.5 C4/1_0.5 | F3/2+C5/5 A4/3 F4/1 | Bb2/5+E4/3 D4/2 Bb4/4_0.5 Bb4/4_0.5 | C3/4+A4/3 F4/1 G4/2 | F3/1+F4/1_2' },
    // Traditional French song (18th century), public domain; arrangement written for Pliktra.
    { title: 'Frère Jacques (both hands)',
      text: 'C3/5+G3/1+C4/1 D4/2 E4/3 C4/1 | C3/5+G3/1+C4/1 D4/2 E4/3 C4/1 | C3/5+G3/1+E4/3 F4/4 G4/5_2 | C3/5+G3/1+E4/3 F4/4 G4/5_2 |\n' +
            'C3/5+G3/1+G4/4_0.5 A4/5_0.5 G4/4_0.5 F4/3_0.5 E4/2 C4/1 | C3/5+G3/1+G4/4_0.5 A4/5_0.5 G4/4_0.5 F4/3_0.5 E4/2 C4/1 |\n' +
            'C3/5+C4/4 R:G3/1 C4/4_2 | C3/5+C4/4 R:G3/1 C4/4_2' },
    // Traditional (published 1852/1881), public domain; arrangement written for Pliktra.
    { title: 'Row, Row, Row Your Boat (both hands)',
      text: '6/8 C3/5+C4/1_1.5 C4/1_1.5 | C3/5+C4/1 D4/2_0.5 E4/3_1.5 | C3/5+E4/3 D4/2_0.5 E4/3 F4/4_0.5 | C3/5+G4/5_3 |\n' +
            'C3/5+C5/4_0.5 C5/4_0.5 C5/4_0.5 G4/1_0.5 G4/1_0.5 G4/1_0.5 | C3/5+E4/3_0.5 E4/3_0.5 E4/3_0.5 C4/1_0.5 C4/1_0.5 C4/1_0.5 |\n' +
            'G3/1+G4/5 F4/4_0.5 E4/3 D4/2_0.5 | C3/5+C4/1_3' },
    // Minuet in G (BWV Anh. 114) by Christian Petzold (about 1725), public domain. First part;
    // the left hand is simplified.
    { title: 'Minuet in G (Petzold, both hands)',
      text: '3/4 key:G G3/5+D5/5 G4/1_0.5 A4/2_0.5 A3/4+B4/3_0.5 C5/4_0.5 | B3/3+D5/5 G4/1 G4/1 |\n' +
            'L:C4/2+E5/3 C5/1_0.5 D5/2_0.5 E5/3_0.5 F#5/4_0.5 | B3/3+G5/5 G4/1 G4/1 |\n' +
            'A3/4+C5/4 D5/5_0.5 C5/4_0.5 B4/3_0.5 A4/2_0.5 | G3/5+B4/3 C5/4_0.5 B4/3_0.5 A4/2_0.5 G4/1_0.5 |\n' +
            'L:D4/1+F#4/2 B3/3+G4/1_0.5 A4/2_0.5 G3/5+B4/3_0.5 G4/1_0.5 | L:D4/1+A4/2_3 |\n' +
            'G3/5+D5/5 G4/1_0.5 A4/2_0.5 A3/4+B4/3_0.5 C5/4_0.5 | B3/3+D5/5 G4/1 G4/1 |\n' +
            'L:C4/2+E5/3 C5/1_0.5 D5/2_0.5 E5/3_0.5 F#5/4_0.5 | B3/3+G5/5 G4/1 G4/1 |\n' +
            'A3/4+C5/4 D5/5_0.5 C5/4_0.5 B4/3_0.5 A4/2_0.5 | G3/5+B4/3 C5/4_0.5 B4/3_0.5 A4/2_0.5 G4/1_0.5 |\n' +
            'L:C4/2+A4/3 B4/4_0.5 A4/3_0.5 G4/2_0.5 F#4/1_0.5 | G3/5+B3/3+G4/2_3' },
    // Für Elise (WoO 59) by Ludwig van Beethoven (1810), public domain. The opening theme.
    { title: 'Für Elise (opening, both hands)',
      text: '3/8 pickup:0.5 E5/5_0.25 D#5/4_0.25 | E5/5_0.25 D#5/4_0.25 E5/5_0.25 B4/2_0.25 D5/4_0.25 C5/3_0.25 |\n' +
            'A2/5+A4/1_0.25 E3/2_0.25 A3/1_0.25 C4/1_0.25 E4/2_0.25 A4/3_0.25 | E2/5+B4/4_0.25 E3/2_0.25 G#3/1_0.25 E4/1_0.25 G#4/3_0.25 B4/4_0.25 |\n' +
            'A2/5+C5/5_0.25 E3/2_0.25 A3/1_0.25 E4/1_0.25 E5/5_0.25 D#5/4_0.25 |\n' +
            'E5/5_0.25 D#5/4_0.25 E5/5_0.25 B4/2_0.25 D5/4_0.25 C5/3_0.25 | A2/5+A4/1_0.25 E3/2_0.25 A3/1_0.25 C4/1_0.25 E4/2_0.25 A4/3_0.25 |\n' +
            'E2/5+B4/4_0.25 E3/2_0.25 G#3/1_0.25 E4/1_0.25 C5/5_0.25 B4/4_0.25 | A2/5+A4/3_0.25 E3/2_0.25 A3/1_0.5' }
  ];
  // Built-ins from the first version; devices without a record of seen built-ins already had these.
  var FIRST_BUILTINS = ['C major scale (both hands)', 'Ode to Joy (right hand)', 'Twinkle Twinkle (both hands)'];

  function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function songFromText(title, text) {
    return { id: newId(), title: title, kind: 'text', text: text, notes: parseSongText(text).notes };
  }

  var savedSettings = store.get('pliktra.settings', {});
  var settings = Object.assign({ labels: 'all', laneLabels: true, range: 'fit', sound: true, fingers: true, view: 'sheet', reading: false,
    listenSpeed: '1', listenOnPiano: true, lang: 'auto', tempo: 0, metronome: false, otherHand: true }, savedSettings);
  if ((savedSettings.v || 1) < 2) {   // v2: sheet music and note names on all keys became the defaults
    settings.view = 'sheet';
    settings.labels = 'all';
  }
  settings.v = 2;
  store.set('pliktra.settings', settings);
  LANG = pickLang(settings.lang);
  applyI18n();

  // Song title in the user's language (built-in songs are stored with English titles).
  function songName(s) {
    if (s && s.drill) return t('drillTitle', { name: t(Drills.level(s.drill).name) });
    if (s && s.lesson) return t('lessonTitle', { name: t(Lessons.get(s.lesson).name) });
    var tr = s && s.kind === 'text' && BUILTIN_TITLES[LANG];
    return (tr && tr[s.title]) || (s ? s.title : '');
  }
  var songs = store.get('pliktra.songs', null);
  var seenBuiltins = store.get('pliktra.builtinsSeen', null);
  if (!Array.isArray(songs)) {
    songs = BUILTIN.map(function (b) { return songFromText(b.title, b.text); });
    seenBuiltins = [];
  } else {
    if (!Array.isArray(seenBuiltins)) seenBuiltins = FIRST_BUILTINS.slice();
    songs.forEach(function (s) {
      if (s.kind !== 'text') return;
      BUILTIN.forEach(function (b) {   // upgrade unedited built-in songs
        if (b.prev && s.title === b.title && b.prev.indexOf(s.text) >= 0) s.text = b.text;
      });
      s.notes = parseSongText(s.text).notes;   // re-read typed songs so new notation features apply
    });
    // Built-ins added in later versions appear once; a deleted built-in doesn't come back.
    BUILTIN.slice().reverse().forEach(function (b) {
      if (seenBuiltins.indexOf(b.title) < 0 && !songs.some(function (s) { return s.title === b.title; })) {
        songs.unshift(songFromText(b.title, b.text));
      }
    });
  }
  BUILTIN.forEach(function (b) { if (seenBuiltins.indexOf(b.title) < 0) seenBuiltins.push(b.title); });
  store.set('pliktra.builtinsSeen', seenBuiltins);
  store.set('pliktra.songs', songs);
  var best = store.get('pliktra.best', {});

  function saveSongs() {
    if (!store.set('pliktra.songs', songs)) {
      alert(t('storageFull'));
      return false;
    }
    return true;
  }

  // ---------------------------------------------------------------- practice state
  var st = {
    song: null, hand: 'B', steps: [], idx: 0, startIdx: 0,
    hits: {}, stepMistake: false, mistakes: 0, clean: 0,
    startTime: 0, finished: false, viewT: 0
  };
  var held = {};   // midi -> number of sources holding it
  var wrong = {};  // midi -> time of the last wrong press (for the red flash)
  var dirty = true;

  // A–B loop: tap Loop at the first step of a hard part, move the slider (or play on) to its
  // last step and tap "Set end". The part then repeats until Loop is tapped again.
  var loop = { a: -1, b: -1, pending: false, laps: 0, lastMistakes: 0 };
  function loopOn() { return loop.b >= 0; }
  function clearLoop() { loop.a = loop.b = -1; loop.pending = false; loop.laps = 0; showLoopToggle(); }

  var demo = null;       // Listen playback in progress (see "Listen" below)
  var demoKeys = {};     // midi -> hand, keys sounding in the playback (lit on the keyboard)
  var pa = null;         // play along in progress (see "Play along" below)

  function currentStep() { return (st.idx < st.steps.length) ? st.steps[st.idx] : null; }
  function targetT() {
    if (!st.steps.length) return 0;
    return st.idx < st.steps.length ? st.steps[st.idx].t : st.steps[st.steps.length - 1].t + 3;
  }

  function loadSong(song) {
    st.song = song;
    if (!(song && song.drill)) {   // note reading rounds are made fresh each time: not remembered
      store.set('pliktra.lastSong', song ? song.id : null);
      if (song && !song.lesson) { song.recent = Date.now(); store.set('pliktra.songs', songs); }   // recently played first in the list
    }
    $('#songTitle').textContent = song ? songName(song) : t('noSong');
    showViewToggle();
    rebuildSteps();
  }

  function rebuildSteps() {
    st.steps = st.song ? buildSteps(st.song.notes, st.hand) : [];
    clearLoop();
    layout();
    restart(0);
  }

  function restart(from) {
    endDemo();
    endPlay();
    closeExplain();
    st.idx = Math.max(0, Math.min(from || 0, Math.max(0, st.steps.length - 1)));
    if (loopOn() && (st.idx < loop.a || st.idx > loop.b)) clearLoop();   // moved outside the loop
    st.startIdx = st.idx;
    st.hits = {}; st.stepMistake = false; st.rescue = false; st.missed = {};
    st.mistakes = 0; st.clean = 0; st.startTime = 0; st.finished = false;
    st.viewT = targetT();
    updateStats(); updateHint();
    dirty = true;
  }

  function practiceNote(m) {
    if (!st.song || st.finished || demo) return;
    var step = currentStep();
    if (!step) return;
    if (tempoOn()) { if (pa) playKey(m); else startPlay(); return; }   // play along: the first key starts the count-in
    if (step.notes.indexOf(m) >= 0) {
      if (!st.startTime) { st.startTime = performance.now(); requestWakeLock(); updateHint(); }
      st.hits[m] = true;
      var done = step.notes.every(function (n) { return st.hits[n]; });
      if (done) advance();
    } else if (otherHandNote(m, step)) {
      // One-hand practice: playing the other hand's part along with it is not a mistake.
    } else {
      wrong[m] = performance.now();
      if (readingOn()) st.rescue = true;   // reading mode: now show the key to play
      if (isDrill()) step.notes.forEach(function (n) { st.missed[n] = step.hands[n]; });   // "notes to watch"
      if (st.startTime) { st.mistakes++; st.stepMistake = true; updateStats(); }
    }
  }

  // True if, in one-hand practice, key m belongs to the other hand's part near the current step.
  function otherHandNote(m, step) {
    if (st.hand === 'B') return false;
    var prevT = st.idx > 0 ? st.steps[st.idx - 1].t : -1;
    var notes = st.song.notes;
    for (var k = firstNoteAtOrAfter(notes, prevT - 0.05); k < notes.length && notes[k].t <= step.t + 0.6; k++) {
      if (notes[k].m === m && notes[k].h !== st.hand) return true;
    }
    return false;
  }

  function advance() {
    if (!st.stepMistake) st.clean++;
    st.idx++;
    st.hits = {}; st.stepMistake = false; st.rescue = false;
    if (loopOn() && st.idx > loop.b) {   // end of the loop: count the round and go again
      loop.laps++; loop.lastMistakes = st.mistakes; loop.lastScore = null;
      restart(loop.a);
      return;
    }
    if (st.idx >= st.steps.length) {
      st.finished = true;
      setTimeout(showResult, 450);
    }
    updateStats();
  }

  function updateStats() {
    var n = st.steps.length;
    var prog = $('#progress');
    prog.max = Math.max(0, n - 1);
    prog.value = Math.min(st.idx, Math.max(0, n - 1));
    $('#stepCount').textContent = Math.min(st.idx + (st.finished ? 0 : 1), n) + ' / ' + n +
      (loopOn() ? ' · ' + t('loopShort') + ' ' + (loop.a + 1) + '–' + (loop.b + 1) : '');
    $('#mistakes').textContent = t('mistakes', { n: st.mistakes });
    updateSheetCursor(false);
  }

  // ---------------------------------------------------------------- sheet music view
  var sheetState = { key: '', data: null };

  // Sheet music exists only for typed songs; MIDI files are always shown as falling notes.
  function sheetOn() { return (settings.view === 'sheet' || isDrill()) && !(st.song && st.song.kind !== 'text'); }
  function isDrill() { return !!(st.song && st.song.drill); }
  function isLesson() { return !!(st.song && st.song.lesson); }
  // Reading mode: find the notes on the sheet music yourself. The screen keyboard shows the key to play
  // (and its finger) only after a wrong key, or when a note in the score is tapped (explanation card).
  function readingOn() { return (!!settings.reading || isDrill()) && sheetOn(); }   // note reading: always
  function keyHintsOn() { return !readingOn() || !!st.rescue; }

  function refreshSheet() {
    var box = $('#sheet'), inner = $('#sheetInner'), msgEl = $('#sheetMsg');
    var sheetLib = typeof Sheet !== 'undefined' && Sheet.available();
    box.hidden = !sheetOn();
    $('#hint').style.top = sheetOn() && geo ? Math.max(12, geo.kbTop - 52) + 'px' : '';
    $('#hint').classList.toggle('on-paper', sheetOn());   // dark text on the light score
    dirty = true;
    if (!sheetOn() || !geo) { closeExplain(); return; }
    box.style.height = geo.kbTop + 'px';
    var msg = '';
    if (!st.song) msg = t('sheetChoose');
    else if (!sheetLib) msg = t('sheetNoLib');
    if (!msg) {
      var scale = Math.max(0.5, Math.min(1.5, (geo.kbTop - 8) / 290));
      var key = [st.song.id, settings.fingers, scale.toFixed(3), st.song.text].join('|');
      if (key !== sheetState.key) {
        // Same song drawn again (other size, finger numbers on/off): keep the card on the same symbol.
        var oldData = sheetState.data, sameSong = sheetState.key.split('|')[0] === st.song.id && sheetState.key.slice(-st.song.text.length) === st.song.text;
        var keepHit = explain && oldData && sameSong ? oldData.hits.indexOf(explain.hit) : -1;
        try {
          sheetState.data = Sheet.render($('#sheetSvg'), st.song.text, { fingers: settings.fingers, scale: scale, exact: !!st.song.exact });
          var room = geo.kbTop - 8;   // grew taller (very high/low notes)? draw it a bit smaller
          if (sheetState.data.height > room && scale > 0.5) {
            sheetState.data = Sheet.render($('#sheetSvg'), st.song.text,
              { fingers: settings.fingers, scale: Math.max(0.5, scale * room / sheetState.data.height), exact: !!st.song.exact });
          }
          sheetState.key = key;
          var again = keepHit >= 0 && sheetState.data.hits[keepHit];
          if (again && again.info.type === explain.hit.info.type) explain.hit = again;
          else closeExplain();
        } catch (e) {
          closeExplain();
          if (window.console) console.error(e);
          sheetState.data = null; sheetState.key = '';
          msg = t('sheetFail');
        }
      }
    }
    msgEl.textContent = msg;
    inner.style.display = msg ? 'none' : '';
    if (msg) {   // forget the old score so nothing refers to it
      closeExplain();
      sheetState.key = ''; sheetState.data = null;
      $('#sheetSvg').innerHTML = '';
      return;
    }
    inner.style.width = sheetState.data.width + 'px';
    inner.style.marginTop = Math.max(0, (geo.kbTop - sheetState.data.height) / 2) + 'px';
    $('#sheetCursor').style.width = Math.round(28 * Math.max(0.6, sheetState.data.height / 290)) + 'px';
    updateSheetCursor(true);
    if (explain) placeExplain();   // same score, new size (e.g. the screen was turned)
  }

  // Colours the notes to play now, fades the ones already played and scrolls them into view.
  function updateSheetCursor(instant) {
    if (explain && explain.idx !== st.idx) closeExplain();   // played on: the card is about an old spot
    var d = sheetState.data;
    if (!d || !sheetOn() || $('#sheet').hidden) return;
    var step = currentStep();
    var curKey = step && !st.finished ? Sheet.beatKey(step.t / BEAT_SEC) : null;
    var curBeat = curKey != null ? parseFloat(curKey) : Infinity;
    var curX = null;
    Object.keys(d.marks).forEach(function (k) {
      var beat = parseFloat(k);
      d.marks[k].forEach(function (mk) {
        if (!mk.el) return;
        var isCur = k === curKey && (st.hand === 'B' || mk.hand === st.hand);
        mk.el.classList.toggle('cur-R', isCur && mk.hand === 'R');
        mk.el.classList.toggle('cur-L', isCur && mk.hand === 'L');
        mk.el.classList.toggle('past', beat < curBeat - 1e-6);
        if (isCur) curX = curX == null ? mk.x : Math.min(curX, mk.x);
      });
    });
    var wrapW = $('#sheet').clientWidth, inner = $('#sheetInner'), cursor = $('#sheetCursor'), tx;
    if (d.width + 20 <= wrapW) tx = (wrapW - d.width) / 2;   // short piece: centre it
    else {
      var minTx = wrapW - d.width - 20;
      tx = curX != null ? wrapW * 0.3 - curX : (st.finished ? minTx : 0);
      tx = Math.min(0, Math.max(minTx, tx));
    }
    if (instant) { inner.style.transition = 'none'; cursor.style.transition = 'none'; }
    inner.style.transform = 'translateX(' + Math.round(tx) + 'px)';
    cursor.style.display = curX == null ? 'none' : '';
    if (curX != null) cursor.style.left = Math.round(curX - parseFloat(cursor.style.width || 28) / 2 + 6) + 'px';
    if (instant) {
      void inner.offsetWidth;   // apply without animation, then re-enable it
      inner.style.transition = ''; cursor.style.transition = '';
    }
  }

  // ---------------------------------------------------------------- explanations (tap a symbol in the score)
  // Tap (or click) a note, rest, clef, time signature or bar line: a card says what it means and the
  // note's keys light up on the keyboard. With a mouse, pointing at a symbol shows it too.
  var explain = null;      // { hit, idx, pinned }
  var explainKeys = {};    // midi -> hand, lit on the keyboard while the card is open

  // Client (screen) point -> the score's own units, which Sheet.render's hits use.
  function scorePoint(clientX, clientY) {
    var svg = $('#sheetSvg svg');
    if (!svg) return null;
    var r = svg.getBoundingClientRect(), vb = svg.viewBox && svg.viewBox.baseVal;
    if (!r.width || !r.height) return null;
    var v = vb && vb.width ? vb : { x: 0, y: 0, width: r.width, height: r.height };
    return { x: v.x + (clientX - r.left) * v.width / r.width, y: v.y + (clientY - r.top) * v.height / r.height,
      toClient: function (x, y) { return { x: r.left + (x - v.x) * r.width / v.width, y: r.top + (y - v.y) * r.height / v.height }; } };
  }

  function hitAtClient(clientX, clientY) {
    var d = sheetState.data, p = scorePoint(clientX, clientY);
    if (!d || !p) return null;
    var h = Sheet.hitAt(d.hits, p.x, p.y);
    return h ? { hit: h, toClient: p.toClient } : null;
  }

  function showExplain(found, pinned) {
    var d = sheetState.data, c = Explain.card(found.hit.info, d.meter, d.key);
    var box = $('#explain');
    $('#exTitle').textContent = c.title;
    var ul = $('#exLines');
    ul.innerHTML = '';
    c.lines.forEach(function (l) { ul.appendChild(el('li', '', l)); });
    c.tips.forEach(function (l) { ul.appendChild(el('li', 'tip', l)); });
    $('#exPlay').hidden = c.noPlay || !Object.keys(c.keys).length;
    explain = { hit: found.hit, idx: st.idx, pinned: pinned, keys: c.keys };
    explainKeys = c.keys;
    dirty = true;
    box.hidden = false;
    placeExplain();
  }

  // Next to the symbol: above it if there is room, otherwise below; always inside the score area.
  function placeExplain() {
    var p = scorePoint(0, 0), box = $('#explain');
    if (!explain || !p) return;
    var sheetR = $('#sheet').getBoundingClientRect(), h = explain.hit;
    var a = p.toClient(h.x, h.y), b = p.toClient(h.x + h.w, h.y + h.h);
    var cw = box.offsetWidth, ch = box.offsetHeight, W = sheetR.width, H = sheetR.height;
    var sx0 = a.x - sheetR.left, sx1 = b.x - sheetR.left, sy0 = a.y - sheetR.top, sy1 = b.y - sheetR.top;
    var left = Math.max(8, Math.min(W - cw - 8, (sx0 + sx1) / 2 - cw / 2)), top;
    if (sy0 - ch - 10 >= 8) top = sy0 - ch - 10;              // above
    else if (sy1 + 10 + ch <= H - 8) top = sy1 + 10;          // below
    else {                                                    // beside, so the symbol stays visible
      top = Math.max(8, Math.min(H - ch - 8, (sy0 + sy1) / 2 - ch / 2));
      left = sx1 + 12 + cw <= W - 8 ? sx1 + 12 : Math.max(8, sx0 - 12 - cw);
    }
    box.style.left = Math.round(left) + 'px';
    box.style.top = Math.round(top) + 'px';
  }

  function closeExplain() {
    if (!explain) return;
    explain = null;
    explainKeys = {};
    $('#explain').hidden = true;
    dirty = true;
  }

  $('#sheetInner').addEventListener('click', function (e) {
    var found = hitAtClient(e.clientX, e.clientY);
    if (found && !(explain && explain.pinned && explain.hit === found.hit)) showExplain(found, true);
    else closeExplain();   // tapped the same symbol again, or nothing
  });
  var hoverTimer = 0;
  $('#sheetInner').addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse' || (explain && explain.pinned)) return;
    clearTimeout(hoverTimer);
    var x = e.clientX, y = e.clientY;
    hoverTimer = setTimeout(function () {
      var found = hitAtClient(x, y);
      if (found) { if (!explain || explain.hit !== found.hit) showExplain(found, false); }
      else closeExplain();
    }, 250);
  });
  $('#sheetInner').addEventListener('pointerleave', function (e) {
    clearTimeout(hoverTimer);
    if ($('#explain').contains(e.relatedTarget)) return;   // onto the card, e.g. to press Play
    if (explain && !explain.pinned) closeExplain();
  });
  $('#explain').addEventListener('pointerleave', function (e) {
    if (e.pointerType !== 'mouse' || $('#sheetInner').contains(e.relatedTarget)) return;
    if (explain && !explain.pinned) closeExplain();
  });
  $('#explain').addEventListener('click', function (e) { e.stopPropagation(); });
  $('#exClose').onclick = closeExplain;
  // A tap anywhere else closes it (but not the screen keyboard, so the lit keys can be tried out).
  document.addEventListener('pointerdown', function (e) {
    if (!explain || !explain.pinned) return;
    var tg = e.target;
    if ($('#explain').contains(tg) || $('#sheetInner').contains(tg) || tg === cv) return;
    closeExplain();
  }, true);
  $('#exPlay').onclick = function () {
    if (!explain) return;
    var out = demoOutput(), ms = 900;
    Object.keys(explain.keys).forEach(function (k) {
      var m = +k;
      if (out) {
        try { out.send([0x90, m, 80]); out.send([0x80, m, 0], performance.now() + ms); return; } catch (err) { /* unplugged */ }
      }
      synth.play(m, 0, ms / 1000);
    });
  };

  // "What the symbols mean" in the settings: built when opened.
  $('#symbolsHelp').addEventListener('toggle', function () {
    if (!$('#symbolsHelp').open) return;
    var ul = $('#symbolsList'), canDraw = typeof Sheet !== 'undefined' && Sheet.available();
    ul.innerHTML = '';
    Explain.glossary().forEach(function (g) {
      var li = el('li'), pic = el('div', 'sym-pic'), txt = el('div', 'sym-txt');
      if (g.pic && canDraw) { try { Sheet.mini(pic, g.pic); } catch (err) { pic.textContent = ''; } }
      else if (!g.pic) pic.appendChild(el('span', 'sym-finger', '3'));
      txt.appendChild(el('b', '', g.title));
      txt.appendChild(el('span', '', g.text));
      li.appendChild(pic); li.appendChild(txt);
      ul.appendChild(li);
    });
  });

  function updateHint() {
    var h = '';
    if (!st.song) h = t('hintChoose');
    else if (!st.steps.length) h = t(st.hand === 'L' ? 'hintNoLeft' : st.hand === 'R' ? 'hintNoRight' : 'hintNoNotes');
    else if (demo) h = t('hintListening');
    else if (pa) h = pa.flash || pa.count;   // count-in, then "early" / "late" now and then
    else if (loop.pending) h = t('hintLoop');
    else if (loopOn() && loop.laps && !st.startTime) {
      var res = loop.lastScore != null ? t('roundTempo', { p: loop.lastScore }) : !loop.lastMistakes ? t('roundClean') : loop.lastMistakes === 1 ? t('roundOne') : t('roundMany', { n: loop.lastMistakes });
      h = t('hintRound', { n: loop.laps, result: res });
    }
    else if (!st.startTime && !st.finished) {
      h = tempoOn() ? t('hintTempo', { p: t('tempoPct', { p: Math.round(settings.tempo * 100) }) })
        : isLesson() ? t(Lessons.get(st.song.lesson).tip) : t(readingOn() ? 'hintRead' : 'hintStart');
    }
    $('#hint').textContent = h;
    $('#hint').classList.toggle('count', !!(pa && !pa.flash && pa.count));
    $('#hint').classList.toggle('long', h.length > 70);
  }

  // r: the result of playing along (see finishPlay); without it, the wait-mode result.
  // Play-along best scores are kept per speed ("<id>:<hand>@60").
  function showResult(r) {
    if (!st.finished || !st.song) return;
    var total = st.steps.length - st.startIdx;
    var acc = r ? Tempo.score(r) : total ? Math.round(100 * st.clean / total) : 0;
    var secs = Math.round((performance.now() - st.startTime) / 1000);
    var full = st.startIdx === 0;
    var key = st.song.id + ':' + st.hand + (r ? '@' + Math.round(r.speed * 100) : '');
    var prev = best[key];
    var isBest = full && (prev == null || acc > prev);
    if (isBest) { best[key] = acc; store.set('pliktra.best', best); }
    var handName = t('hands' + st.hand);
    var note = !full ? t('resPartial', { n: st.startIdx + 1 })
      : isBest ? (prev == null ? t('resFirst') : t('resNewBest', { p: prev }))
      : t('resBest', { p: prev });
    var line = function (k, v) { return '<span>' + t(k) + '</span><b>' + v + '</b>'; };
    var lines = r
      ? line('resHands', handName) + line('resTempo', tempoLabel(r.speed)) + line('resNotes', r.total) + line('resInTime', r.ok) +
        line('resEarly', r.early) + line('resLate', r.late) + line('resMissed', r.missed) + line('resWrong', r.wrong)
      : line('resHands', handName) + line('resSteps', total) + line('resWrong', st.mistakes) +
        line('resTime', Math.floor(secs / 60) + ':' + ('0' + secs % 60).slice(-2));
    $('#resBody').innerHTML =
      '<div class="result-big">' + acc + '%</div>' +
      '<div class="result-sub">' + t(r ? 'tempoSub' : 'resultSub') + '</div>' +
      '<div class="result-lines">' + lines + '</div>' +
      '<div class="result-note' + (isBest ? ' best' : '') + '">' + note + '</div>';
    var watch = drillWatch();
    if (isDrill()) {
      var wl = el('div', 'result-note watch', watch.length ? t('drillWatch', { list: watch.map(function (w) { return localNoteName(w.name); }).join(', ') }) : t('drillAllRight'));
      $('#resBody').appendChild(wl);
    }
    var nextLesson = isLesson() && Lessons.next(st.song.lesson);
    if (isLesson() && !r) {   // lessons are ticked off in wait mode
      var ls = Lessons.get(st.song.lesson), done = Lessons.status(ls, best) === 'done';
      $('#resBody').appendChild(el('div', 'result-note' + (done ? ' best' : ''), done ? t('lessonDoneNote')
        : t(st.hand !== 'B' && Lessons.hands(ls) === 'B' ? 'lessonAimBoth' : 'lessonAim', { p: Lessons.DONE })));
    }
    $('#btnAgain').lastElementChild.textContent = t(isDrill() ? 'drillNew' : 'playAgain');
    $('#btnDrillFocus').hidden = !(isDrill() && watch.length);
    $('#btnNextLesson').hidden = !nextLesson;
    openModal('mResult');
    releaseWakeLock();
  }

  // ---------------------------------------------------------------- note reading drills (js/drills.js)
  // A fresh round of the level; focus = notes to practise more ([{ name, hand }]).
  function startDrill(id, focus) {
    var text = Drills.generate(id, { focus: focus });
    useBothHands();   // a round may use both hands
    closeAll();
    loadSong({ id: 'drill:' + id, title: '', kind: 'text', text: text, notes: parseSongText(text).notes, drill: id, exact: true });
  }
  function useBothHands() {
    st.hand = 'B';
    document.querySelectorAll('#handSeg button').forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-hand') === 'B'); });
  }
  // The notes read wrong in this round, low to high: [{ name: "F#4", hand }]
  function drillWatch() {
    if (!isDrill() || !st.missed) return [];
    return Object.keys(st.missed).map(Number).sort(function (a, b) { return a - b; }).map(function (m) {
      var n = st.song.notes.filter(function (x) { return x.m === m; })[0];
      return { name: n && n.s ? n.s : midiToName(m), hand: st.missed[m] };
    });
  }
  // The "Note reading" section of the song list.
  function drillSectionEl() {
    var det = el('details', 'section drills');
    det.open = sectionOpen.drills != null ? sectionOpen.drills : isDrill();
    var sum = el('summary', '', t('drillSection'));
    sum.addEventListener('click', function () { sectionOpen.drills = !det.open; });
    det.appendChild(sum);
    det.appendChild(el('p', 'muted small', t('drillIntro')));
    var ul = el('ul', 'songlist');
    Drills.LEVELS.forEach(function (lv, i) {
      var li = el('li', st.song && st.song.drill === lv.id ? 'current' : '');
      var pick = el('button', 'pick');
      pick.type = 'button';
      pick.appendChild(el('span', 'name', (i + 1) + '. ' + t(lv.name)));
      pick.appendChild(el('span', 'meta', Drills.describe(lv) + bestLabel({ id: 'drill:' + lv.id })));
      pick.onclick = function () { startDrill(lv.id); };
      li.appendChild(pick);
      ul.appendChild(li);
    });
    det.appendChild(ul);
    return det;
  }

  // ---------------------------------------------------------------- lessons (js/lessons.js)
  function startLesson(id) {
    useBothHands();   // written for both hands; one hand can still be picked afterwards
    closeAll();
    loadSong(Lessons.song(id));
  }
  // The "Lessons" section of the song list: ○ new, ◐ tried, ✓ learnt.
  function lessonSectionEl() {
    var det = el('details', 'section lessons');
    det.open = sectionOpen.lessons != null ? sectionOpen.lessons : isLesson();
    var sum = el('summary', '', t('lessonSection'));
    sum.addEventListener('click', function () { sectionOpen.lessons = !det.open; });
    det.appendChild(sum);
    det.appendChild(el('p', 'muted small', t('lessonIntro', { p: Lessons.DONE })));
    var ul = el('ul', 'songlist');
    Lessons.LIST.forEach(function (ls, i) {
      var li = el('li', st.song && st.song.lesson === ls.id ? 'current' : '');
      var pick = el('button', 'pick'), status = Lessons.status(ls, best);
      pick.type = 'button';
      var name = el('span', 'name');
      var mark = el('span', 'mark ' + status, Lessons.MARK[status]);
      mark.title = t(status === 'new' ? 'lessonNew' : status === 'tried' ? 'lessonTried' : 'lessonDone');
      name.appendChild(mark);
      name.appendChild(document.createTextNode(' ' + (i + 1) + '. ' + t(ls.name)));
      pick.appendChild(name);
      pick.appendChild(el('span', 'meta', t(ls.desc) + bestLabel({ id: 'lesson:' + ls.id })));
      pick.onclick = function () { startLesson(ls.id); };
      li.appendChild(pick);
      ul.appendChild(li);
    });
    det.appendChild(ul);
    return det;
  }

  // ---------------------------------------------------------------- note input (all sources)
  var midiHeld = {};   // keys currently held on the piano (to release them if the piano goes away)
  var lastNoteAt = 0;

  function noteOn(m, src) {
    held[m] = (held[m] || 0) + 1;
    if (src === 'midi') midiHeld[m] = (midiHeld[m] || 0) + 1;   // counted, like held[]
    lastNoteAt = performance.now();
    if (st.startTime && !st.finished) requestWakeLock();
    if (src !== 'midi' && settings.sound) synth.on(m);
    if (isOpen('mEditor')) { if (recording) recordNote(m); }
    else if (!anyModalOpen()) practiceNote(m);
    updateHeld();
    dirty = true;
  }

  function noteOff(m, src) {
    if (src === 'midi') {
      if (!midiHeld[m]) return;   // already released (e.g. after the piano was unplugged)
      if (--midiHeld[m] <= 0) delete midiHeld[m];
    }
    var c = (held[m] || 0) - 1;
    if (c > 0) held[m] = c; else delete held[m];
    if (src !== 'midi') synth.off(m);
    updateHeld();
    dirty = true;
  }

  function updateHeld() {
    var ms = Object.keys(held).map(Number).sort(function (a, b) { return a - b; });
    $('#held').textContent = ms.length ? '♪ ' + ms.map(function (m) { return localNoteName(midiToName(m)); }).join(' ') : '';
  }

  // ---------------------------------------------------------------- Web MIDI
  var midiAccess = null;

  function setStatus(text, cls) {
    var el = $('#midiStatus');
    el.textContent = text;
    el.className = 'pill' + (cls ? ' ' + cls : '');
  }

  function initMidi() {
    if (!navigator.requestMIDIAccess) {
      setStatus(t('midiNoBrowser'), 'bad');
      return;
    }
    navigator.requestMIDIAccess({ sysex: false }).then(function (access) {
      midiAccess = access;
      access.onstatechange = bindInputs;
      bindInputs();
    }, function () {
      setStatus(t('midiBlocked'), 'bad');
    });
  }

  function bindInputs(e) {
    var names = [];
    midiAccess.inputs.forEach(function (input) {
      input.onmidimessage = onMidiMessage;
      if (input.state === 'connected') names.push(input.name);
    });
    if (names.length) setStatus('🎹 ' + names.join(', '), 'ok');
    else setStatus(t('midiNone'), 'warn');
    if (e && e.port && e.port.state === 'disconnected') releaseMidiNotes();
  }

  // Lets go of all piano keys we think are held (their note-off messages may never arrive).
  function releaseMidiNotes() {
    Object.keys(midiHeld).forEach(function (m) { while (midiHeld[m]) noteOff(+m, 'midi'); });
  }

  function onMidiMessage(e) {
    var d = e.data;
    if (!d || d.length < 3) return;
    var type = d[0] & 0xF0;
    if (type === 0x90 && d[2] > 0) noteOn(d[1], 'midi');
    else if (type === 0x80 || (type === 0x90 && d[2] === 0)) noteOff(d[1], 'midi');
  }

  // ---------------------------------------------------------------- tiny synth for screen/computer keys
  var synth = (function () {
    var ac = null, voices = {};
    function ctx() {
      if (!ac) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ac = new AC();
      }
      if (ac.state === 'suspended') ac.resume();
      return ac;
    }
    function off(m) {
      var v = voices[m];
      if (!v || !ac) return;
      delete voices[m];
      var t = ac.currentTime, g = v.g.gain;
      if (g.cancelAndHoldAtTime) g.cancelAndHoldAtTime(t); else g.cancelScheduledValues(t);
      g.setTargetAtTime(0, t, 0.06);
      v.o.stop(t + 0.5); v.o2.stop(t + 0.5);
    }
    function on(m) {
      var a = ctx();
      if (!a) return;
      off(m);
      var f = 440 * Math.pow(2, (m - 69) / 12), t = a.currentTime;
      var o = a.createOscillator(), o2 = a.createOscillator(), g = a.createGain(), g2 = a.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      o2.type = 'sine'; o2.frequency.value = f * 2; g2.gain.value = 0.15;
      o.connect(g); o2.connect(g2); g2.connect(g); g.connect(a.destination);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.22, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.05, t + 1.5);
      o.start(t); o2.start(t);
      voices[m] = { o: o, o2: o2, g: g };
    }
    // Scheduled note for Listen: starts after `delay` s, lasts `dur` s. Returns a handle for stopAll.
    function play(m, delay, dur) {
      var a = ctx();
      if (!a) return null;
      var f = 440 * Math.pow(2, (m - 69) / 12), t = a.currentTime + Math.max(0, delay), end = t + Math.max(0.08, dur);
      var o = a.createOscillator(), o2 = a.createOscillator(), g = a.createGain(), g2 = a.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      o2.type = 'sine'; o2.frequency.value = f * 2; g2.gain.value = 0.15;
      o.connect(g); o2.connect(g2); g2.connect(g); g.connect(a.destination);
      g.gain.value = 0;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.2, t + 0.01);
      g.gain.setTargetAtTime(0.05, t + 0.01, 0.5);   // piano-like decay
      g.gain.setTargetAtTime(0, end, 0.06);          // release
      o.start(t); o2.start(t); o.stop(end + 0.5); o2.stop(end + 0.5);
      return { o: o, o2: o2, g: g };
    }
    function stopAll(list) {
      if (!ac) return;
      var t = ac.currentTime;
      list.forEach(function (v) {
        if (!v) return;
        try {
          var g = v.g.gain;
          if (g.cancelAndHoldAtTime) g.cancelAndHoldAtTime(t); else g.cancelScheduledValues(t);
          g.setTargetAtTime(0, t, 0.02);
          v.o.stop(t + 0.15); v.o2.stop(t + 0.15);
        } catch (e) { /* already stopped */ }
      });
    }
    // Metronome click after `delay` s (accent: the first beat of a bar). Returns a handle for stopAll.
    function click(delay, accent) {
      var a = ctx();
      if (!a) return null;
      var t = a.currentTime + Math.max(0, delay);
      var o = a.createOscillator(), g = a.createGain();
      o.type = 'square'; o.frequency.value = accent ? 1760 : 1175;
      o.connect(g); g.connect(a.destination);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(accent ? 0.16 : 0.1, t + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      o.start(t); o.stop(t + 0.08);
      return { o: o, o2: { stop: function () {} }, g: g };
    }
    return { on: on, off: off, play: play, stopAll: stopAll, click: click };
  })();

  // ---------------------------------------------------------------- Listen (demo playback)
  // Plays the practised hand(s) from the current step to the end (or to the loop's end) on the
  // piano's own sound when it is connected (MIDI out), otherwise with the built-in synth.
  // The falling notes / score follow along; afterwards you are back where it started.
  function demoOutput() {
    if (!settings.listenOnPiano || !midiAccess || !midiAccess.outputs) return null;
    var inNames = [], same = null, other = null;
    midiAccess.inputs.forEach(function (i) { if (i.state === 'connected') inNames.push(i.name); });
    if (!inNames.length) return null;   // no piano connected
    midiAccess.outputs.forEach(function (o) {
      if (o.state === 'disconnected') return;
      if (!same && inNames.indexOf(o.name) >= 0) same = o;                     // the piano itself
      if (!other && !/wavetable|through|thru/i.test(o.name)) other = o;
    });
    return same || other;
  }

  function demoAt(d, t) { return d.start + (t - d.t0) / d.speed * 1000; }   // song time -> performance.now() ms

  function startDemo() {
    if (!st.song || !st.steps.length) return;
    var from = st.idx >= st.steps.length ? (loopOn() ? loop.a : 0) : st.idx;
    var to = loopOn() && from <= loop.b ? loop.b : st.steps.length - 1;
    var t0 = st.steps[from].t, t1 = st.steps[to].t + CHORD_TOLERANCE;
    var notes = playbackNotes(st.song.notes.filter(function (n) {
      return n.t >= t0 - 0.001 && n.t <= t1 && (st.hand === 'B' || n.h === st.hand);
    }));
    restart(from);   // a fresh start: no mistakes, no half-played chord
    var d = { from: from, to: to, t0: t0, notes: notes, ni: 0, si: from, speed: +settings.listenSpeed || 1,
      out: demoOutput(), start: performance.now() + 150, nodes: [], timers: [], sent: {}, timer: 0, endMs: 0,
      seq: 0, owner: {} };
    notes.forEach(function (n) { d.endMs = Math.max(d.endMs, demoAt(d, n.t) + n.d / d.speed * 1000); });
    demo = d;
    d.timer = setInterval(demoTick, 25);
    demoTick();
    requestWakeLock();
    showListenToggle(); updateHint();
  }

  function demoTick() {
    var d = demo;
    if (!d) return;
    var now = performance.now();
    while (d.ni < d.notes.length && demoAt(d, d.notes[d.ni].t) <= now + 200) {   // schedule 200 ms ahead
      var n = d.notes[d.ni++], on = demoAt(d, n.t), off = on + Math.max(60, n.d / d.speed * 1000);
      if (n.next != null) off = Math.min(off, demoAt(d, n.next) - 2);   // never into the same key's next note
      demoNote(d, n, on, Math.max(on + 1, off));
    }
    var moved = false;
    while (d.si <= d.to && demoAt(d, st.steps[d.si].t) <= now) { st.idx = d.si++; moved = true; }
    if (moved) { st.hits = {}; updateStats(); dirty = true; lastNoteAt = now; }
    if (d.ni >= d.notes.length && now > d.endMs + 300) stopDemo();
  }

  function demoNote(d, n, onMs, offMs) {
    if (d.out) {
      try {
        d.out.send([0x90, n.m, 80], onMs);
        d.out.send([0x80, n.m, 0], offMs);
        d.sent[n.m] = true;
      } catch (e) { d.out = null; }   // piano went away: continue with the synth
    }
    if (!d.out) d.nodes.push(synth.play(n.m, (onMs - performance.now()) / 1000, (offMs - onMs) / 1000));
    // The key lights up while it sounds; only this note's own release turns it off again.
    var id = ++d.seq;
    d.timers.push(setTimeout(function () { demoKeys[n.m] = n.h; d.owner[n.m] = id; dirty = true; }, Math.max(0, onMs - performance.now())));
    d.timers.push(setTimeout(function () {
      if (d.owner[n.m] === id) { delete demoKeys[n.m]; dirty = true; }
    }, Math.max(0, Math.max(onMs, offMs - 30) - performance.now())));
  }

  // Silences the playback without moving the practice position.
  function endDemo() {
    var d = demo;
    if (!d) return;
    demo = null;
    silence(d);
    showListenToggle();
    updateHint();
    dirty = true;
  }
  // Stops what a playback (Listen or play along) has scheduled: timers, piano notes, synth sounds.
  function silence(d) {
    clearInterval(d.timer);
    d.timers.forEach(clearTimeout);
    demoKeys = {};
    if (d.out) {
      var out = d.out;
      var allOff = function () {
        try {
          Object.keys(d.sent).forEach(function (m) { out.send([0x80, +m, 0]); });
          out.send([0xB0, 123, 0]);   // all notes off
        } catch (e) { /* unplugged */ }
      };
      try { if (out.clear) out.clear(); } catch (e) { /* not supported */ }
      allOff();
      setTimeout(allOff, 300);   // notes already queued ahead
    }
    synth.stopAll(d.nodes);
  }

  // Stops the playback and goes back to where it started, ready to play.
  function stopDemo() {
    var d = demo;
    if (!d) return;
    endDemo();
    restart(d.from);
  }

  // ---------------------------------------------------------------- Play along (tempo)
  // With a tempo chosen, the first key starts a count-in, then the music runs at that speed and
  // doesn't wait. Every note of the practised hand is judged in time / early / late / missed
  // (rules in js/tempo.js). Practising one hand, the app can play the other one (as Listen does).
  function tempoOn() { return settings.tempo > 0; }
  function paMs(t) { return pa.startMs + (t - pa.tc) / pa.speed * 1000; }      // song time -> performance.now()
  function paT(now) { return pa.tc + (now - pa.startMs) / 1000 * pa.speed; }   // performance.now() -> song time
  function tempoLabel(speed) {
    var s = t('tempoPct', { p: Math.round(speed * 100) });
    return st.song && st.song.kind === 'text' ? s + ' · ' + t('tempoBpm', { n: Tempo.bpm(speed) }) : s;
  }

  function startPlay() {
    if (!st.song || !st.steps.length || st.idx >= st.steps.length) return;
    var from = st.idx, to = loopOn() && from <= loop.b ? loop.b : st.steps.length - 1;
    var t0 = st.steps[from].t, t1 = st.steps[to].t + CHORD_TOLERANCE;
    var inRange = function (n) { return n.t >= t0 - 0.001 && n.t <= t1; };
    var targets = [], byKey = {}, stepT = {};
    st.song.notes.forEach(function (n) {
      if (!inRange(n) || (st.hand !== 'B' && n.h !== st.hand)) return;
      var k = n.m + ':' + n.t;
      if (byKey[k]) return;   // the same key twice at once (both hands): played once
      targets.push(byKey[k] = { m: n.m, t: n.t, h: n.h, res: null });
    });
    var si = from;   // each target belongs to the last step at or before it
    targets.forEach(function (n) {
      while (si < to && st.steps[si + 1].t <= n.t + 1e-6) si++;
      (stepT[si] = stepT[si] || []).push(n);
    });
    var other = st.hand !== 'B' && settings.otherHand
      ? playbackNotes(st.song.notes.filter(function (n) { return inRange(n) && n.h !== st.hand; })) : [];
    var info = st.song.kind === 'text' ? parseSongText(st.song.text) : null;
    var clicks = Tempo.clicks(info, t0, t1, settings.metronome), num = 0;
    clicks.forEach(function (c) { num = c.accent ? 1 : num + 1; c.num = num; });
    pa = { from: from, to: to, t0: t0, t1: t1, speed: settings.tempo, targets: targets, byKey: byKey, stepT: stepT,
      ji: 0, si: from, other: other, oi: 0, clicks: clicks, ci: 0, count: '', flash: '',
      tc: clicks.length ? clicks[0].t : t0, startMs: performance.now() + 150,
      ok: 0, early: 0, late: 0, missed: 0, wrong: 0,
      out: other.length ? demoOutput() : null, nodes: [], timers: [], sent: {}, seq: 0, owner: {}, timer: 0 };
    st.startTime = performance.now();
    requestWakeLock();
    pa.timer = setInterval(playTick, 25);
    playTick();
    updateHint();
  }

  function playTick() {
    var p = pa;
    if (!p) return;
    var now = performance.now(), T = paT(now);
    // metronome and the other hand, scheduled 200 ms ahead
    while (p.ci < p.clicks.length && paMs(p.clicks[p.ci].t) <= now + 200) {
      var c = p.clicks[p.ci++], at = paMs(c.t);
      p.nodes.push(synth.click((at - now) / 1000, c.accent));
      if (c.countIn) p.timers.push(setTimeout(function (num) { if (pa === p) { p.count = String(num); updateHint(); } }.bind(null, c.num), Math.max(0, at - now)));
    }
    while (p.oi < p.other.length && paMs(p.other[p.oi].t) <= now + 200) {
      var n = p.other[p.oi++], on = paMs(n.t), off = on + Math.max(60, n.d / p.speed * 1000);
      if (n.next != null) off = Math.min(off, paMs(n.next) - 2);   // never into the same key's next note
      demoNote(p, n, on, Math.max(on + 1, off));
    }
    if (p.count && T >= p.t0 - 0.001) { p.count = ''; updateHint(); }   // the music has started
    // notes that can no longer be played in time
    var changed = false;
    while (p.ji < p.targets.length && (T - p.targets[p.ji].t) / p.speed > Tempo.WINDOW) {
      var x = p.targets[p.ji++];
      if (!x.res) { x.res = 'miss'; p.missed++; changed = true; if (isDrill()) st.missed[x.m] = x.h; }
    }
    // the step to play now: the first one with notes still to play
    var si = p.si;
    while (si <= p.to && (p.stepT[si] || []).every(function (y) { return y.res; })) si++;
    if (si !== p.si) {
      p.si = si;
      st.idx = Math.min(si, p.to);
      st.hits = {};
      if (si <= p.to) p.stepT[si].forEach(function (y) { if (y.res && y.res !== 'miss') st.hits[y.m] = true; });
      changed = true;
    }
    if (changed) { st.mistakes = p.missed + p.wrong; updateStats(); dirty = true; }
    if (si > p.to && now > paMs(p.t1) + 400) finishPlay();
  }

  function playKey(m) {
    var p = pa, now = performance.now(), T = paT(now);
    var j = Tempo.judge(p.targets, m, T, p.speed);
    if (j) {
      j.target.res = j.grade;
      p[j.grade]++;
      if ((p.stepT[p.si] || []).indexOf(j.target) >= 0) st.hits[m] = true;
      if (j.grade !== 'ok') {   // "early" / "late" for a moment
        p.flash = t(j.grade === 'early' ? 'tempoEarly' : 'tempoLate');
        p.timers.push(setTimeout(function () { if (pa === p) { p.flash = ''; updateHint(); } }, 700));
        updateHint();
      }
      playTick();
    } else if (otherHandNote(m, currentStep())) {
      // One-hand practice: playing the other hand's part along with it is not a mistake.
    } else if (T >= p.t0 - Tempo.WINDOW * p.speed) {   // (keys during the count-in don't count)
      wrong[m] = now;
      p.wrong++;
      st.mistakes = p.missed + p.wrong;
      if (readingOn()) st.rescue = true;
      var step = currentStep();
      if (isDrill() && step) step.notes.forEach(function (k) { st.missed[k] = step.hands[k]; });
      updateStats();
    }
    dirty = true;
  }

  function finishPlay() {
    var p = pa;
    if (!p) return;
    endPlay();
    var r = { ok: p.ok, early: p.early, late: p.late, missed: p.missed, wrong: p.wrong, total: p.targets.length, speed: p.speed };
    if (loopOn()) {   // end of the loop: count the round, then the next key starts it again
      loop.laps++; loop.lastScore = Tempo.score(r);
      restart(loop.a);
      return;
    }
    st.idx = p.to + 1;
    st.hits = {};
    st.finished = true;
    updateStats();
    setTimeout(function () { showResult(r); }, 350);
  }

  // Stops playing along (keeps the position and the counts).
  function endPlay() {
    var p = pa;
    if (!p) return;
    pa = null;
    silence(p);
    updateHint();
    dirty = true;
  }
  // Stops playing along and goes back to where it started.
  function abortPlay() { if (pa) restart(pa.from); }

  // The Tempo button opens a small menu: off (wait) or a speed, metronome, the other hand.
  function showTempoToggle() {
    var b = $('#btnTempo');
    b.classList.toggle('on', tempoOn());
    b.querySelector('.lbl').textContent = tempoOn() ? t('tempoPct', { p: Math.round(settings.tempo * 100) }) : t('tempo');
  }
  function fillTempoMenu() {
    var seg = $('#tempoSeg');
    seg.innerHTML = '';
    [0].concat(Tempo.SPEEDS).forEach(function (sp) {
      var b = el('button', sp === settings.tempo ? 'on' : '', sp ? t('tempoPct', { p: Math.round(sp * 100) }) : t('tempoOff'));
      b.type = 'button';
      b.onclick = function () {
        settings.tempo = sp;
        store.set('pliktra.settings', settings);
        abortPlay();
        fillTempoMenu(); showTempoToggle(); updateHint();
      };
      seg.appendChild(b);
    });
    $('#tempoBpm').textContent = tempoOn() ? tempoLabel(settings.tempo) : t('tempoWait');
    $('#setMetronome').checked = !!settings.metronome;
    $('#setOtherHand').checked = !!settings.otherHand;
  }
  function closeTempoMenu() { $('#tempoMenu').hidden = true; $('#btnTempo').setAttribute('aria-expanded', 'false'); }
  $('#btnTempo').onclick = function () {
    var menu = $('#tempoMenu');
    if (!menu.hidden) { closeTempoMenu(); return; }
    fillTempoMenu();
    menu.hidden = false;
    $('#btnTempo').setAttribute('aria-expanded', 'true');
    var r = $('#btnTempo').getBoundingClientRect();
    menu.style.top = Math.round(r.bottom + 6) + 'px';
    menu.style.left = Math.round(Math.max(8, Math.min(r.left, window.innerWidth - menu.offsetWidth - 8))) + 'px';
  };
  ['setMetronome', 'setOtherHand'].forEach(function (id) {
    $('#' + id).addEventListener('change', function () {
      settings[id === 'setMetronome' ? 'metronome' : 'otherHand'] = $('#' + id).checked;
      store.set('pliktra.settings', settings);
      abortPlay();
    });
  });
  document.addEventListener('pointerdown', function (e) {
    if ($('#tempoMenu').hidden || $('#tempoMenu').contains(e.target) || $('#btnTempo').contains(e.target)) return;
    closeTempoMenu();
  }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('#tempoMenu').hidden) closeTempoMenu(); });
  showTempoToggle();

  // ---------------------------------------------------------------- canvas: layout
  var cv = $('#stage'), ctx = cv.getContext('2d');
  var W = 0, H = 0, geo = null;

  function songRange() {
    if (settings.range === 'full') return [21, 108];
    var notes = st.song ? st.song.notes : [];
    if (!notes.length) return [48, 83];
    var mn = 127, mx = 0;
    notes.forEach(function (n) { if (n.m < mn) mn = n.m; if (n.m > mx) mx = n.m; });
    var lo = mn - (mn % 12), hi = mx + (11 - mx % 12);  // whole octaves C..B
    if (hi - lo < 23) { if (lo - 12 >= 21) lo -= 12; else hi += 12; }
    return [Math.max(21, lo), Math.min(108, hi)];
  }

  function layout() {
    var r = songRange(), lo = r[0], hi = r[1];
    if (isBlack(lo)) lo--;
    if (isBlack(hi)) hi++;
    var whites = [], idxOf = {};
    for (var m = lo; m <= hi; m++) if (!isBlack(m)) { idxOf[m] = whites.length; whites.push(m); }
    var ww = W / whites.length;
    var kbH = Math.max(90, Math.min(230, H * 0.34, ww * 6.5));
    geo = { lo: lo, hi: hi, whites: whites, idxOf: idxOf, ww: ww, kbTop: H - kbH, kbH: kbH, bw: ww * 0.6, bh: kbH * 0.62 };
    dirty = true;
    refreshSheet();
  }

  function keyRect(m) {
    if (!isBlack(m)) return { x: geo.idxOf[m] * geo.ww, w: geo.ww };
    var i = geo.idxOf[m - 1];
    return { x: (i + 1) * geo.ww - geo.bw / 2, w: geo.bw };
  }

  function resize() {
    var r = cv.parentElement.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layout();
  }

  // ---------------------------------------------------------------- canvas: drawing
  function rr(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function firstNoteAtOrAfter(notes, t) {
    var lo = 0, hi = notes.length;
    while (lo < hi) { var mid = (lo + hi) >> 1; if (notes[mid].t < t) lo = mid + 1; else hi = mid; }
    return lo;
  }

  function draw(now) {
    var laneH = geo.kbTop;
    ctx.clearRect(0, 0, W, H);

    // studio lane backdrop + subtle black-key lane shading + octave guides at every C
    var bgGrad = ctx.createLinearGradient(0, 0, 0, laneH);
    bgGrad.addColorStop(0, '#12151c');
    bgGrad.addColorStop(1, '#0b0d12');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, laneH);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
    for (var bl = geo.lo; bl <= geo.hi; bl++) {
      if (!isBlack(bl)) continue;
      var br = keyRect(bl);
      ctx.fillRect(br.x, 0, br.w, laneH);
    }
    ctx.fillStyle = 'rgba(255, 255, 255, 0.055)';
    for (var i = 0; i < geo.whites.length; i++) {
      var wm = geo.whites[i];
      if (wm % 12 === 0) ctx.fillRect(Math.round(keyRect(wm).x), 0, 1, laneH);
    }

    var step = currentStep();
    if (st.song && st.steps.length && !st.finished && !sheetOn()) {
      var pps = laneH / 4;                       // pixels per second: ~4 s of music visible
      var maxT = st.viewT + laneH / pps + 0.5;
      var notes = st.song.notes;
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, W, laneH); ctx.clip();
      ctx.font = '600 12px -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      var fromT = pa ? Math.min(step.t, st.viewT - 1) : step.t;   // playing along: notes pass the keyboard line
      for (var k = firstNoteAtOrAfter(notes, fromT - 0.001); k < notes.length; k++) {
        var n = notes[k];
        if (n.t > maxT) break;
        if (n.m < geo.lo || n.m > geo.hi) continue;
        var active = st.hand === 'B' || n.h === st.hand;
        var isCur = active && n.t < step.t + 0.046 && n.t > step.t - 0.046 && step.notes.indexOf(n.m) >= 0;
        var judged = pa && active && pa.byKey[n.m + ':' + n.t];
        var done = judged && judged.res ? judged.res !== 'miss' : isCur && st.hits[n.m];
        var r = keyRect(n.m);
        var yb = laneH - (n.t - st.viewT) * pps;
        var showFinger = settings.fingers && active && n.f;
        var h = Math.max(n.d * pps - 3, showFinger ? 26 : 15);
        ctx.globalAlpha = !active ? 0.25 : done ? 0.34 : judged && judged.res === 'miss' ? 0.18 : 1;
        if (active) {
          var ng = ctx.createLinearGradient(0, yb - h, 0, yb);
          ng.addColorStop(0, HAND_COLOR[n.h]);
          ng.addColorStop(1, HAND_DEEP[n.h]);
          ctx.fillStyle = ng;
        } else {
          ctx.fillStyle = '#6f7889';
        }
        if (isCur && !done) { ctx.shadowColor = HAND_COLOR[n.h]; ctx.shadowBlur = 16; }
        rr(r.x + 1.5, yb - h, r.w - 3, h, 6);
        ctx.fill();
        ctx.shadowBlur = 0;
        if (active && h >= 10) {   // subtle top rim highlight
          ctx.fillStyle = isCur && !done ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.22)';
          rr(r.x + 2.5, yb - h + 1, Math.max(2, r.w - 5), 2.5, 2);
          ctx.fill();
        }
        var labelY = yb - 4, nameFits = true;
        if (showFinger) {
          var rad = Math.min(r.w * 0.36, 11, (h - 4) / 2);
          var cy = yb - rad - 3.5;
          ctx.fillStyle = 'rgba(255,255,255,0.96)';
          ctx.beginPath(); ctx.arc(r.x + r.w / 2, cy, rad, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#0c111a';
          ctx.font = '800 ' + Math.round(rad * 1.35) + 'px -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(n.f), r.x + r.w / 2, cy + 0.5);
          ctx.textBaseline = 'bottom';
          ctx.font = '600 12px -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
          labelY = cy - rad - 2;
          nameFits = h >= rad * 2 + 20;
        }
        if (settings.laneLabels && active && r.w >= 16 && nameFits) {
          ctx.fillStyle = '#0c111a';
          var label = localNoteName(r.w >= 30 ? noteLabel(n) : noteLabel(n).replace(/-?\d+$/, ''));
          ctx.fillText(label, r.x + r.w / 2, labelY);
        }
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    // subtle glowing horizon line in falling-notes mode
    if (!sheetOn()) {
      ctx.fillStyle = 'rgba(76, 154, 255, 0.45)';
      ctx.fillRect(0, laneH - 2, W, 2);
    }

    drawKeyboard(now, step);
  }

  function keyState(m, now, step) {
    if (wrong[m] && now - wrong[m] < 380) return { fill: '#f25f5c', deep: '#c73a37', strong: true };
    if (demoKeys[m]) return { fill: HAND_COLOR[demoKeys[m]], deep: HAND_DEEP[demoKeys[m]], strong: true, hand: demoKeys[m] };   // sounding in Listen
    if (explainKeys[m]) return { fill: HAND_COLOR[explainKeys[m]], deep: HAND_DEEP[explainKeys[m]], strong: true, hand: explainKeys[m] };   // tapped in the score
    if (step && !anyModalOpen() && step.notes.indexOf(m) >= 0 && (keyHintsOn() || st.hits[m])) {
      var hand = step.hands[m];
      var on = !!(held[m] || st.hits[m]);
      return {
        fill: on ? HAND_COLOR[hand] : (isBlack(m) ? HAND_COLOR[hand] : HAND_SOFT[hand]),
        deep: HAND_DEEP[hand],
        strong: on,
        target: true,
        hand: hand
      };
    }
    if (held[m]) return { fill: isBlack(m) ? '#5e6c80' : '#cdd6e3', deep: '#465264', strong: true };
    return null;
  }

  function drawKeyboard(now, step) {
    var top = geo.kbTop, kh = geo.kbH, ww = geo.ww;
    ctx.fillStyle = '#090b0f';
    ctx.fillRect(0, top, W, kh);

    var feltH = 3, keyTop = top + feltH, keyH = kh - feltH - 2;

    // white keys (warm ivory gradient + sculpted bottom bevel)
    for (var i = 0; i < geo.whites.length; i++) {
      var m = geo.whites[i], x = i * ww, s = keyState(m, now, step);
      var kx = x + 0.8, kw = Math.max(2, ww - 1.6);
      var pressed = !!(s && s.strong);
      var lipH = pressed ? 2 : 4;

      if (s && s.strong) {
        var pg = ctx.createLinearGradient(0, keyTop, 0, keyTop + keyH);
        pg.addColorStop(0, s.deep || s.fill);
        pg.addColorStop(1, s.fill);
        ctx.fillStyle = pg;
      } else if (s && s.target) {
        var tg = ctx.createLinearGradient(0, keyTop, 0, keyTop + keyH);
        tg.addColorStop(0, '#ffffff');
        tg.addColorStop(0.35, s.fill);
        tg.addColorStop(1, s.fill);
        ctx.fillStyle = tg;
      } else {
        var wg = ctx.createLinearGradient(0, keyTop, 0, keyTop + keyH);
        wg.addColorStop(0, '#efede8');
        wg.addColorStop(0.06, '#fdfcfa');
        wg.addColorStop(0.92, '#f2efe9');
        wg.addColorStop(1, '#e1ddd4');
        ctx.fillStyle = wg;
      }
      rr(kx, keyTop, kw, keyH, 4);
      ctx.fill();

      // sculpted bottom lip / target color bar
      if (s && s.target && !s.strong) {
        ctx.fillStyle = HAND_COLOR[s.hand];
        rr(kx + 1, keyTop + keyH - 5, Math.max(1, kw - 2), 4, 2);
        ctx.fill();
      } else {
        ctx.fillStyle = pressed ? 'rgba(0,0,0,0.22)' : 'rgba(130,122,108,0.28)';
        ctx.fillRect(kx + 2, keyTop + keyH - lipH, Math.max(0, kw - 4), lipH);
      }

      // labels
      var showLabel = settings.labels === 'all' || (settings.labels === 'C' && m % 12 === 0);
      if (showLabel && ww >= 14) {
        var txt = localNoteName((m % 12 === 0 || ww >= 26) ? midiToName(m) : midiToName(m).replace(/-?\d+$/, ''));
        if (settings.labels === 'all' && m % 12 !== 0 && ww < 26) txt = txt.charAt(0);
        ctx.fillStyle = (s && s.strong) ? '#ffffff' : (m === 60 ? '#1b65cc' : '#636c7a');
        ctx.font = (m === 60 ? '700 ' : '500 ') + Math.min(13.5, Math.max(9, ww * 0.31)) + 'px -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText(txt, x + ww / 2, keyTop + keyH - 8);
      }
      if (m === 60) { // middle C marker
        ctx.fillStyle = (s && s.strong) ? 'rgba(255,255,255,0.9)' : '#1b65cc';
        ctx.beginPath(); ctx.arc(x + ww / 2, keyTop + geo.bh + 11, 2.8, 0, Math.PI * 2); ctx.fill();
      }
    }

    // black keys (3D ebony with soft cast shadow onto white keys)
    for (var b = geo.lo; b <= geo.hi; b++) {
      if (!isBlack(b)) continue;
      var r = keyRect(b), sb = keyState(b, now, step);
      var bPressed = !!(sb && sb.strong);
      var bh = geo.bh - feltH;

      // soft drop shadow on white keys
      ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
      rr(r.x + 1.5, keyTop + 2, r.w + 1, bh + 3, 4);
      ctx.fill();

      if (sb) {
        var bg = ctx.createLinearGradient(0, keyTop, 0, keyTop + bh);
        bg.addColorStop(0, sb.deep || sb.fill);
        bg.addColorStop(1, sb.fill);
        ctx.fillStyle = bg;
      } else {
        var eg = ctx.createLinearGradient(0, keyTop, 0, keyTop + bh);
        eg.addColorStop(0, '#2a2f3a');
        eg.addColorStop(0.84, '#161920');
        eg.addColorStop(1, '#0e1015');
        ctx.fillStyle = eg;
      }
      rr(r.x, keyTop, r.w, bh, 3.5);
      ctx.fill();

      // sculpted inner key top face
      if (!sb) {
        var fg = ctx.createLinearGradient(0, keyTop + 2, 0, keyTop + bh - 8);
        fg.addColorStop(0, 'rgba(255,255,255,0.12)');
        fg.addColorStop(1, 'rgba(255,255,255,0.03)');
        ctx.fillStyle = fg;
        rr(r.x + 2.5, keyTop + 2, Math.max(1, r.w - 5), Math.max(4, bh - 10), 2);
        ctx.fill();
      } else if (!bPressed) {
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        rr(r.x + 2.5, keyTop + 2, Math.max(1, r.w - 5), Math.max(4, bh - 10), 2);
        ctx.fill();
      }
    }

    // classic grand-piano crimson felt strip + subtle top shadow
    ctx.fillStyle = '#681c27';
    ctx.fillRect(0, top, W, feltH);
    var topShade = ctx.createLinearGradient(0, keyTop, 0, keyTop + 8);
    topShade.addColorStop(0, 'rgba(0,0,0,0.28)');
    topShade.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = topShade;
    ctx.fillRect(0, keyTop, W, 8);

    // finger numbers on the keys to play now
    if (settings.fingers && step && !anyModalOpen() && keyHintsOn()) {
      step.notes.forEach(function (fm) {
        var f = step.fingers && step.fingers[fm];
        if (!f || fm < geo.lo || fm > geo.hi) return;
        var kr = keyRect(fm), black = isBlack(fm);
        var rad = Math.max(7, black ? Math.min(kr.w * 0.42, 12) : Math.min(ww * 0.34, 14));   // readable even with 88 small keys
        var cy = black ? keyTop + (geo.bh - feltH) - rad - 7 : keyTop + keyH - rad - 28;
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetY = 1.5;
        ctx.fillStyle = '#14171f';
        ctx.beginPath(); ctx.arc(kr.x + kr.w / 2, cy, rad, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.lineWidth = 1.25;
        ctx.beginPath(); ctx.arc(kr.x + kr.w / 2, cy, rad - 0.6, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 ' + Math.round(rad * 1.28) + 'px -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(f), kr.x + kr.w / 2, cy + 0.5);
      });
    }
  }

  var lastFrame = performance.now();
  function frame(now) {
    var dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;
    var tgt = targetT();
    if (pa) { st.viewT = paT(performance.now()); dirty = true; }   // playing along: the notes move at the tempo (same clock as the judging)
    else if (st.viewT !== tgt) {
      st.viewT += (tgt - st.viewT) * Math.min(1, dt * 12);
      if (Math.abs(tgt - st.viewT) < 0.0005) st.viewT = tgt;
      dirty = true;
    }
    for (var m in wrong) {
      if (now - wrong[m] > 400) delete wrong[m];
      dirty = true;
    }
    if (dirty && geo) { dirty = false; draw(now); }
    requestAnimationFrame(frame);
  }

  // ---------------------------------------------------------------- touch / mouse on the screen keyboard
  var pointers = {};
  function hitKey(x, y) {
    if (!geo || y < geo.kbTop) return null;
    if (y - geo.kbTop < geo.bh) {
      for (var m = geo.lo; m <= geo.hi; m++) {
        if (!isBlack(m)) continue;
        var r = keyRect(m);
        if (x >= r.x && x < r.x + r.w) return m;
      }
    }
    var i = Math.max(0, Math.min(geo.whites.length - 1, Math.floor(x / geo.ww)));
    return geo.whites[i];
  }
  cv.addEventListener('pointerdown', function (e) {
    var m = hitKey(e.offsetX, e.offsetY);
    if (m == null) return;
    e.preventDefault();
    try { cv.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    pointers[e.pointerId] = m;
    noteOn(m, 'touch');
  });
  function pointerEnd(e) {
    var m = pointers[e.pointerId];
    if (m == null) return;
    delete pointers[e.pointerId];
    noteOff(m, 'touch');
  }
  cv.addEventListener('pointerup', pointerEnd);
  cv.addEventListener('pointercancel', pointerEnd);

  // ---------------------------------------------------------------- computer keyboard (for testing without a piano)
  // By physical key position (KeyboardEvent.code), so it works on QWERTY, QWERTZ and other layouts.
  var KEYMAP = { KeyA: 0, KeyW: 1, KeyS: 2, KeyE: 3, KeyD: 4, KeyF: 5, KeyT: 6, KeyG: 7, KeyY: 8, KeyH: 9, KeyU: 10,
    KeyJ: 11, KeyK: 12, KeyO: 13, KeyL: 14, KeyP: 15, Semicolon: 16 };
  var kbOct = 4, kbDown = {};
  // True only while typing text (the slider, buttons and checkboxes don't block the keyboard piano).
  function typing(e) {
    var t = e.target;
    if (!t || !t.tagName) return false;
    if (t.tagName === 'TEXTAREA' || t.tagName === 'SELECT') return true;
    return t.tagName === 'INPUT' && /^(text|search|number|)$/.test(t.type || '');
  }
  window.addEventListener('keydown', function (e) {
    if (typing(e) || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.code;
    if (k in KEYMAP || k === 'KeyZ' || k === 'KeyX') e.preventDefault();
    if (k === 'KeyZ') { kbOct = Math.max(1, kbOct - 1); return; }
    if (k === 'KeyX') { kbOct = Math.min(7, kbOct + 1); return; }
    if (k in KEYMAP && kbDown[k] == null) {
      var m = 12 * (kbOct + 1) + KEYMAP[k];
      if (m > 108) return;
      kbDown[k] = m;
      noteOn(m, 'kbd');
    }
  });
  window.addEventListener('keyup', function (e) {
    var k = e.code;
    if (kbDown[k] != null) { var m = kbDown[k]; delete kbDown[k]; noteOff(m, 'kbd'); }
  });
  window.addEventListener('blur', function () {
    Object.keys(kbDown).forEach(function (k) { noteOff(kbDown[k], 'kbd'); delete kbDown[k]; });
  });

  // ---------------------------------------------------------------- modals
  function openModal(id) { stopDemo(); abortPlay(); closeTempoMenu(); closeExplain(); $('#' + id).classList.add('open'); dirty = true; }
  function closeModal(id) {
    $('#' + id).classList.remove('open');
    if (id === 'mEditor') setRecording(false);
    dirty = true;
  }
  function isOpen(id) { return $('#' + id).classList.contains('open'); }
  function anyModalOpen() { return !!document.querySelector('.modal.open'); }
  function closeAll() { ['mLibrary', 'mSong', 'mEditor', 'mImport', 'mResult', 'mSettings'].forEach(closeModal); }

  document.querySelectorAll('[data-close]').forEach(function (b) {
    b.addEventListener('click', function () { dismissModal(b.closest('.modal').id); });   // asks if the editor has changes
  });

  // Escape or a tap outside the dialog closes it (the editor asks first if something changed).
  function editorChanged() {
    return $('#edText').value !== (editing ? editing.text : '') || $('#edTitle').value.trim() !== (editing ? songName(editing) : '') ||
      $('#edGroup').value.trim() !== edGroupStart;
  }
  function dismissModal(id) {
    if (id === 'mEditor' && editorChanged() && !confirm(t('confirmCloseEditor'))) return;
    closeModal(id);
  }
  document.querySelectorAll('.modal').forEach(function (m) {
    var downOutside = false;   // both press and release outside (not a text selection that ended there)
    m.addEventListener('pointerdown', function (e) { downOutside = e.target === m; });
    m.addEventListener('click', function (e) { if (e.target === m && downOutside) dismissModal(m.id); });
  });
  window.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var open = document.querySelectorAll('.modal.open');
    if (open.length) { e.preventDefault(); dismissModal(open[open.length - 1].id); }
    else if (explain) closeExplain();
  });

  // ---------------------------------------------------------------- library
  function handsLabel(notes) {
    var r = false, l = false;
    notes.forEach(function (n) { if (n.h === 'R') r = true; else l = true; });
    return t(r && l ? 'handsB' : r ? 'handsR' : 'handsL');
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // Best scores in the song list: "best 96%" when only both hands were practised, otherwise per hand
  // ("best: both 96% · right 90%"), so practising one hand also shows progress.
  function bestLabel(s) {
    var parts = [];
    [['B', 'both'], ['R', 'right'], ['L', 'left']].forEach(function (h) {
      var p = best[s.id + ':' + h[0]];
      if (p != null) parts.push({ h: h[0], txt: t(h[1]).toLowerCase() + ' ' + t('metaPct', { p: p }), p: p });
    });
    if (!parts.length) return '';
    if (parts.length === 1 && parts[0].h === 'B') return ' · ' + t('metaBest', { p: parts[0].p });
    return ' · ' + t('metaBestHands', { list: parts.map(function (x) { return x.txt; }).join(', ') });
  }

  // Starter songs: built-in songs the user hasn't changed. Once there are own songs, they are
  // folded away at the bottom of the list.
  function isStarter(s) {
    return s.kind === 'text' && BUILTIN.some(function (b) { return b.title === s.title && b.text === s.text; });
  }
  var sectionOpen = {};   // section -> opened/closed by the user (this visit only)

  // Tap a song to practise it; ⋯ opens its other actions. Most recently played or added first.
  // Songs without a group come first, then one foldable section per group (book, lesson, ...),
  // the most recently used group first, then the starter songs.
  function renderLibrary() {
    var box = $('#songList');
    box.innerHTML = '';
    $('#libHint').hidden = !songs.length;
    box.appendChild(drillSectionEl());
    box.appendChild(lessonSectionEl());
    if (!songs.length) { box.appendChild(el('p', 'muted', t('noSongs'))); return; }
    var ordered = songs.slice().sort(function (a, b) { return (b.recent || 0) - (a.recent || 0); });
    var loose = [], starters = [], groups = [], byName = {};
    ordered.forEach(function (s) {
      if (s.group) {
        if (!byName[s.group]) groups.push(byName[s.group] = { name: s.group, songs: [] });
        byName[s.group].songs.push(s);
      } else if (isStarter(s)) starters.push(s);
      else loose.push(s);
    });
    if (!groups.length && (!loose.length || !starters.length)) { box.appendChild(songListEl(ordered)); return; }
    if (loose.length) box.appendChild(songListEl(loose));
    groups.forEach(function (g) { box.appendChild(sectionEl('g:' + g.name, g.name + ' (' + g.songs.length + ')', g.songs, g.name)); });
    if (starters.length) box.appendChild(sectionEl('starters', t('starterSongs', { n: starters.length }), starters, null));
  }

  // A foldable section; open when the song being practised is in it, unless the user chose otherwise.
  function sectionEl(key, label, list, groupName) {
    var det = el('details', 'section');
    det.open = sectionOpen[key] != null ? sectionOpen[key] : list.indexOf(st.song) >= 0;
    var sum = el('summary', '', label);
    // Only the user's own tap counts (setting det.open above also fires a "toggle" event, later).
    sum.addEventListener('click', function () { sectionOpen[key] = !det.open; });
    det.appendChild(sum);
    det.appendChild(songListEl(list));
    var typed = list.filter(function (s) { return s.kind !== 'midi'; });
    if (groupName && typed.length) {
      var share = el('button', 'btn small share-group', t('shareGroup'));
      share.type = 'button';
      share.onclick = function () {
        shareLink(typed.map(function (s) { return songEntry(s, false); }), groupName,
          typed.length === 1 ? t('quote', { t: songName(typed[0]) }) : t('theseSongs', { n: typed.length }));
      };
      det.appendChild(share);
    }
    return det;
  }

  // Groups: an optional name per song (a book, a lesson, "Christmas"...). Empty = no group.
  var GROUP_MAX = 60;
  function setGroup(s, name) {
    name = String(name || '').trim().slice(0, GROUP_MAX);
    if (name) s.group = name; else delete s.group;
  }
  function fillGroupNames() {
    var dl = $('#groupNames'), seen = {};
    dl.innerHTML = '';
    songs.forEach(function (s) {
      if (s.group && !seen[s.group]) { seen[s.group] = true; var o = el('option'); o.value = s.group; dl.appendChild(o); }
    });
  }

  function songListEl(list) {
    var ul = el('ul', 'songlist');
    list.forEach(function (s) {
      var li = el('li', st.song && st.song.id === s.id ? 'current' : '');
      var pick = el('button', 'pick');
      pick.type = 'button';
      pick.appendChild(el('span', 'name', songName(s)));
      var nSteps = buildSteps(s.notes, 'B').length;
      pick.appendChild(el('span', 'meta', t(nSteps === 1 ? 'metaStep1' : 'metaSteps', { n: nSteps }) + ' · ' +
        handsLabel(s.notes) + ' · ' + t(s.kind === 'midi' ? 'metaMidi' : 'metaTyped') + bestLabel(s)));
      pick.onclick = function () { closeAll(); loadSong(s); };
      var more = el('button', 'btn icon more', '⋯');
      more.type = 'button';
      more.title = t('moreActions');
      more.setAttribute('aria-label', t('moreActionsFor', { t: songName(s) }));
      more.onclick = function () { openSongActions(s); };
      li.appendChild(pick); li.appendChild(more);
      ul.appendChild(li);
    });
    return ul;
  }

  // ---------------------------------------------------------------- one song's actions (⋯)
  var actionSong = null;
  function openSongActions(s) {
    actionSong = s;
    $('#mSongName').textContent = songName(s);
    $('#saEdit').textContent = t(s.kind === 'midi' ? 'rename' : 'edit');
    $('#saShare').hidden = s.kind === 'midi';   // MIDI files are too big for a link
    $('#saGroup').value = s.group || '';
    fillGroupNames();
    openModal('mSong');
  }
  $('#saGroup').addEventListener('input', function () {
    setGroup(actionSong, $('#saGroup').value);
    saveSongs();
    renderLibrary();
  });
  $('#saEdit').onclick = function () {
    var s = actionSong;
    closeModal('mSong');
    if (s.kind !== 'midi') { openEditor(s); return; }
    var nt = prompt(t('songTitlePrompt'), s.title);
    if (nt && nt.trim()) { s.title = nt.trim(); saveSongs(); renderLibrary(); if (st.song === s) $('#songTitle').textContent = songName(s); }
  };
  $('#saShare').onclick = function () { closeModal('mSong'); shareSong(actionSong); };
  $('#saDuplicate').onclick = function () {
    var s = actionSong;
    var copy = s.kind === 'midi'
      ? { id: newId(), title: '', kind: 'midi', notes: JSON.parse(JSON.stringify(s.notes)) }
      : songFromText('', s.text);
    copy.title = t('copyTitle', { t: songName(s) });
    setGroup(copy, s.group);
    copy.recent = Date.now();
    songs.unshift(copy);
    if (!saveSongs()) { songs.shift(); return; }
    closeModal('mSong');
    renderLibrary();
  };
  $('#saDelete').onclick = function () {
    var s = actionSong;
    if (!confirm(t('confirmDelete', { t: songName(s) }))) return;
    songs = songs.filter(function (x) { return x !== s; });
    saveSongs();
    Object.keys(best).forEach(function (k) { if (k.indexOf(s.id + ':') === 0) delete best[k]; });
    store.set('pliktra.best', best);
    closeModal('mSong');
    if (st.song === s) loadSong(null);
    renderLibrary();
  };

  // ---------------------------------------------------------------- song links (#song=...)
  // The song travels inside the link's #fragment, which browsers never send to the server,
  // so shared songs are not stored on the website or in the repository.
  function b64urlEncode(str) {
    var bytes = new TextEncoder().encode(str), bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64urlDecode(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var bin = atob(s), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function shareLink(data, title, what) {
    var url = location.origin + location.pathname + '#song=' + b64urlEncode(JSON.stringify(data));
    if (navigator.share) { navigator.share({ title: title, url: url }).catch(function () { /* cancelled */ }); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () {
        alert(t('linkCopied', { what: what }));
      }, function () { prompt(t('copyLink'), url); });
      return;
    }
    prompt(t('copyLink'), url);
  }
  function shareSong(song) { shareLink(songEntry(song, false), songName(song), t('quote', { t: songName(song) })); }

  // Song entries in links and backup files: typed {t, s}, MIDI {t, k: 'midi', n: [[m, t, d, h], ...]},
  // plus g = group name (optional) and b = best scores {B, R, L, and per play-along speed "B@60"} in backup files.
  function songEntry(s, withBest) {
    var e = s.kind === 'midi'
      ? { t: s.title, k: 'midi', n: s.notes.map(function (n) { return [n.m, n.t, n.d, n.h]; }) }
      : { t: s.title, s: s.text };
    if (s.group) e.g = s.group;
    if (withBest) {
      var b = {};
      Object.keys(best).forEach(function (k) { if (k.indexOf(s.id + ':') === 0) b[k.slice(s.id.length + 1)] = best[k]; });   // B, R, L, B@60, ...
      if (Object.keys(b).length) e.b = b;
    }
    return e;
  }
  function entryValid(d) {
    if (!d || typeof d.t !== 'string' || (d.g != null && typeof d.g !== 'string')) return false;
    if (d.k === 'midi') {
      return Array.isArray(d.n) && d.n.length > 0 && d.n.length <= 50000 && d.n.every(function (x) {
        return Array.isArray(x) && x.length === 4 && typeof x[0] === 'number' && x[0] >= 0 && x[0] <= 127 &&
          typeof x[1] === 'number' && x[1] >= 0 && typeof x[2] === 'number' && x[2] >= 0 && (x[3] === 'R' || x[3] === 'L');
      });
    }
    return typeof d.s === 'string' && d.s.length <= 20000;
  }

  // Adds songs from a link or a backup file. Same title + same notes: already there.
  // Same title + different notes: offer to update it (keeps its best scores). New title: add it.
  // Returns the song to show (or null).
  function importSongs(list, damagedMsg, fromBackup) {
    var valid = Array.isArray(list) && list.length > 0 && list.length <= 500 && list.every(entryValid);
    if (!valid) { alert(damagedMsg); return null; }
    var toAdd = [], toUpdate = [], same = [];
    for (var i = 0; i < list.length; i++) {
      var d = list[i], isMidi = d.k === 'midi', title = d.t.trim().slice(0, 120) || t('sharedSong'), notes;
      if (isMidi) {
        notes = d.n.map(function (x) { return { m: x[0], t: x[1], d: x[2], h: x[3] }; });
        sortNotes(notes);
      } else {
        var r = parseSongText(d.s);
        if (r.errors.length || !r.notes.length) { alert(t('songHasMistakes', { t: title })); return null; }
        notes = r.notes;
      }
      var match = songs.filter(function (x) { return x.title === title && (x.kind === 'midi') === isMidi; })[0];
      var item = { d: d, title: title, notes: notes, isMidi: isMidi, song: match };
      if (match && (isMidi ? match.notes.length === notes.length : match.text === d.s)) same.push(item);
      else if (match) toUpdate.push(item);
      else toAdd.push(item);
    }
    function names(arr) {
      return arr.length > 4 ? t('nSongs', { n: arr.length }) : arr.map(function (x) { return t('quote', { t: songName(x.song || { title: x.title }) }); }).join(', ');
    }
    function mergeBest(item) {   // keep the better score
      if (!item.d.b || !item.song) return;
      Object.keys(item.d.b).filter(function (h) { return /^[BRL](@\d{1,3})?$/.test(h); }).forEach(function (h) {
        var v = item.d.b[h], k = item.song.id + ':' + h;
        if (typeof v === 'number' && v >= 0 && v <= 100 && (best[k] == null || v > best[k])) best[k] = v;
      });
    }
    if (toAdd.length || toUpdate.length) {
      var question = [];
      var src = t(fromBackup ? 'srcBackup' : 'srcLink');
      if (toAdd.length) question.push(t('askAdd', { names: names(toAdd) }));
      if (toUpdate.length) question.push(t(toAdd.length ? 'askUpdateLower' : 'askUpdate', { names: names(toUpdate), src: src }));
      if (!confirm(question.join(t('and')) + '?')) return null;
      var old = toUpdate.map(function (u) { return { text: u.song.text, notes: u.song.notes }; });
      toUpdate.forEach(function (u) { if (!u.isMidi) u.song.text = u.d.s; u.song.notes = u.notes; });
      var created = toAdd.map(function (x) {
        x.song = x.isMidi ? { id: newId(), title: x.title, kind: 'midi', notes: x.notes } : songFromText(x.title, x.d.s);
        setGroup(x.song, x.d.g);
        return x.song;
      });
      var now = Date.now();
      created.forEach(function (s, k) { s.recent = now - k; });   // new songs at the top of the list
      songs = created.concat(songs);
      if (!saveSongs()) {
        songs = songs.slice(created.length);
        toUpdate.forEach(function (u, k) { u.song.text = old[k].text; u.song.notes = old[k].notes; });
        return null;
      }
    } else if (fromBackup) {
      alert(t('backupSame'));
    }
    same.concat(toUpdate, toAdd).forEach(mergeBest);
    store.set('pliktra.best', best);
    // Songs already here take the group from the link/backup if they don't have one yet.
    var grouped = same.concat(toUpdate).filter(function (x) { return x.d.g && !x.song.group; });
    grouped.forEach(function (x) { setGroup(x.song, x.d.g); });
    if (grouped.length) saveSongs();
    var first = toAdd[0] || toUpdate[0] || same[0];
    return first ? first.song : null;
  }

  function importFromHash() {
    var m = /^#song=([A-Za-z0-9_-]+)$/.exec(location.hash);
    if (!m) return false;
    history.replaceState(null, '', location.pathname + location.search);
    var data = null;
    try { data = JSON.parse(b64urlDecode(m[1])); } catch (e) { /* handled below */ }
    // A link holds one song {t, s} or a list of them [{t, s}, ...]
    var song = importSongs(Array.isArray(data) ? data : data ? [data] : null, t('linkDamaged'), false);
    if (!song) return false;
    closeAll();
    loadSong(song);
    return true;
  }

  // ---- all songs: share link (typed songs), backup file (everything, with best scores), restore
  $('#btnShareAll').onclick = function () {
    var typed = songs.filter(function (s) { return s.kind !== 'midi'; });
    if (!typed.length) { alert(t('noTypedSongs')); return; }
    shareLink(typed.map(function (s) { return songEntry(s, false); }), t('allSongsTitle'),
      typed.length === 1 ? t('quote', { t: songName(typed[0]) }) : t('theseSongs', { n: typed.length }));
  };
  $('#btnBackup').onclick = function () {
    var data = { app: 'pliktra', version: 1, saved: new Date().toISOString(), songs: songs.map(function (s) { return songEntry(s, true); }) };
    var a = el('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' }));
    a.download = 'pliktra-songs-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 10000);
  };
  $('#fileRestore').addEventListener('change', function (e) {
    var f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    f.text().then(function (txt) {
      var data = null;
      try { data = JSON.parse(txt); } catch (err) { /* handled below */ }
      var playing = st.song, oldNotes = playing && playing.notes;
      importSongs(data && data.app === 'pliktra' ? data.songs : null, t('backupDamaged'), true);
      if (playing && playing.notes !== oldNotes) loadSong(playing);   // the song being practised was updated
      renderLibrary();
    });
  });
  window.addEventListener('hashchange', importFromHash);

  // ---------------------------------------------------------------- editor
  var editing = null, recording = false, chordStart = 0, edGroupStart = '';

  function openEditor(song) {
    editing = song || null;
    $('#edTitle').value = song ? songName(song) : '';   // built-in songs: title in the user's language
    $('#edText').value = song ? song.text : '';
    // A new song goes into the same group as the song being practised (handy when typing in a whole book).
    edGroupStart = (song ? song.group : st.song && st.song.group) || '';
    $('#edGroup').value = edGroupStart;
    fillGroupNames();
    $('#edError').textContent = '';
    setRecording(false);
    validateEditor();
    openModal('mEditor');
  }

  function validateEditor() {
    var r = parseSongText($('#edText').value);
    $('#edInfo').textContent = r.steps ? t('edInfo', { n: r.steps, hands: handsLabel(r.notes) }) : '';
    $('#edError').textContent = r.errors.slice(0, 5).join('\n') + (r.errors.length > 5 ? '\n' + t('moreErrors', { n: r.errors.length - 5 }) : '');
    var off = offKeyNotes(r.notes, r.key);
    $('#edKeyCheck').textContent = off.length ? t('keyCheck', { k: localKeyName(r.key),
      list: off.slice(0, 6).map(localNoteName).join(', ') + (off.length > 6 ? ' …' : '') }) : '';
    return r;
  }

  function setRecording(on) {
    recording = on;
    var b = $('#btnRecord');
    b.classList.toggle('on', on);
    b.textContent = t(on ? 'stopRecord' : 'record');
  }

  function recordNote(m) {
    var ta = $('#edText'), now = performance.now(), name = nameInKey(m, parseSongText(ta.value).key);
    var v = ta.value;
    if (/\/\/[^\n]*$/.test(v)) v += '\n';   // last line is a // comment: start a new line
    var endsWithSpace = !v || /\s$/.test(v);
    if (now - chordStart < 90 && !endsWithSpace) {
      ta.value = v + '+' + name;          // part of the same chord
    } else {
      ta.value = v + (endsWithSpace ? '' : ' ') + name;
      chordStart = now;
    }
    ta.scrollTop = ta.scrollHeight;
    validateEditor();
  }

  $('#btnRecord').onclick = function () { setRecording(!recording); };
  $('#btnClearText').onclick = function () {
    if ($('#edText').value && !confirm(t('confirmClear'))) return;
    $('#edText').value = ''; validateEditor();
  };
  $('#edText').addEventListener('input', validateEditor);
  $('#btnNew').onclick = function () { openEditor(null); };

  $('#btnSaveSong').onclick = function () {
    var r = validateEditor();
    if (r.errors.length) return;
    if (!r.notes.length) { $('#edError').textContent = t('addNotes'); return; }
    var title = $('#edTitle').value.trim() || t('untitled');
    if (editing && title === songName(editing)) title = editing.title;   // unchanged: keep the stored (English) title
    var song = editing;
    if (song) { song.title = title; song.text = $('#edText').value; song.notes = r.notes; }
    else { song = songFromText(title, $('#edText').value); songs.unshift(song); }
    setGroup(song, $('#edGroup').value);
    if (!saveSongs()) return;
    closeAll();
    loadSong(song);
  };

  // ---------------------------------------------------------------- MIDI file import
  var pendingImport = null;

  $('#fileMidi').addEventListener('change', function (e) {
    var f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    f.arrayBuffer().then(function (buf) {
      var mf = parseMidiFile(buf);
      if (!mf.parts.length) throw new Error(t('midiNoNotes'));
      openImport(f.name.replace(/\.(mid|midi)$/i, ''), mf);
    }).catch(function (err) {
      alert(t('midiReadFail') + '\n' + (err && err.message ? err.message : err));
    });
  });

  function openImport(title, mf) {
    pendingImport = mf;
    $('#imTitle').value = title;
    var byPitch = mf.parts.slice().sort(function (a, b) { return b.avg - a.avg; });
    mf.parts.forEach(function (p) {
      if (mf.parts.length === 1) p.assign = 'S';
      else if (p === byPitch[0]) p.assign = 'R';
      else if (p === byPitch[byPitch.length - 1]) p.assign = 'L';
      else p.assign = 'X';
    });
    var tb = $('#imParts');
    tb.innerHTML = '';
    mf.parts.forEach(function (p) {
      var tr = el('tr');
      tr.appendChild(el('td', '', p.name));
      tr.appendChild(el('td', '', String(p.notes.length)));
      tr.appendChild(el('td', '', localNoteName(midiToName(p.min)) + ' – ' + localNoteName(midiToName(p.max))));
      var td = el('td'), sel = el('select');
      [['R', 'rightHand'], ['L', 'leftHand'], ['S', 'split'], ['X', 'skip']].forEach(function (o) {
        var opt = el('option', '', t(o[1])); opt.value = o[0]; sel.appendChild(opt);
      });
      sel.value = p.assign;
      sel.onchange = function () { p.assign = sel.value; };
      td.appendChild(sel); tr.appendChild(td);
      tb.appendChild(tr);
    });
    openModal('mImport');
  }

  $('#btnImportSave').onclick = function () {
    if (!pendingImport) return;
    var notes = [];
    pendingImport.parts.forEach(function (p) {
      if (p.assign === 'X') return;
      p.notes.forEach(function (n) {
        notes.push({ m: n.m, t: n.t, d: n.d, h: p.assign === 'S' ? (n.m >= 60 ? 'R' : 'L') : p.assign });
      });
    });
    if (!notes.length) { alert(t('chooseHand')); return; }
    var t0 = notes.reduce(function (a, n) { return Math.min(a, n.t); }, Infinity);
    notes.forEach(function (n) { n.t = Math.round((n.t - t0) * 1000) / 1000; n.d = Math.round(n.d * 1000) / 1000; });
    sortNotes(notes);
    var song = { id: newId(), title: $('#imTitle').value.trim() || t('importedSong'), kind: 'midi', notes: notes };
    songs.unshift(song);
    if (!saveSongs()) { songs.shift(); return; }
    pendingImport = null;
    closeAll();
    loadSong(song);
  };

  // ---------------------------------------------------------------- settings
  function bindSetting(id, key, isCheck) {
    var e = $('#' + id);
    if (isCheck) e.checked = !!settings[key]; else e.value = settings[key];
    e.addEventListener('change', function () {
      settings[key] = isCheck ? e.checked : e.value;
      store.set('pliktra.settings', settings);
      layout();
    });
  }
  bindSetting('setLabels', 'labels');
  bindSetting('setLaneLabels', 'laneLabels', true);
  bindSetting('setRange', 'range');
  bindSetting('setSound', 'sound', true);
  bindSetting('setListenSpeed', 'listenSpeed');
  bindSetting('setListenOnPiano', 'listenOnPiano', true);
  $('#setLang').value = I18N[settings.lang] ? settings.lang : 'auto';
  $('#setLang').addEventListener('change', function () {
    settings.lang = $('#setLang').value;
    store.set('pliktra.settings', settings);
    location.reload();
  });

  // ---------------------------------------------------------------- top bar wiring
  $('#btnSongs').onclick = function () { renderLibrary(); openModal('mLibrary'); };
  $('#btnSettings').onclick = function () { openModal('mSettings'); };
  $('#btnRestart').onclick = function () { restart(loopOn() ? loop.a : 0); };

  function showListenToggle() {
    var b = $('#btnListen');
    b.classList.toggle('on', !!demo);
    b.setAttribute('aria-pressed', demo ? 'true' : 'false');
    b.querySelector('.ico').textContent = demo ? '■' : '▶︎';
    b.querySelector('.lbl').textContent = t(demo ? 'stop' : 'listen');
  }
  $('#btnListen').onclick = function () { if (demo) stopDemo(); else startDemo(); };

  function showLoopToggle() {
    var b = $('#btnLoop');
    b.classList.toggle('on', loopOn());
    b.classList.toggle('pending', loop.pending);
    b.setAttribute('aria-pressed', loopOn() ? 'true' : 'false');
    b.querySelector('.lbl').textContent = loop.pending ? t('setEnd') : loopOn() ? t('loopRange', { a: loop.a + 1, b: loop.b + 1 }) : t('loop');
  }
  // Loop: 1st tap = start here, 2nd tap = end here (after moving the slider or playing on), 3rd tap = off.
  $('#btnLoop').onclick = function () {
    if (!st.steps.length) return;
    if (pa) restart(Math.min(st.idx, st.steps.length - 1));   // stop playing along, stay here
    if (loopOn()) { stopDemo(); clearLoop(); updateStats(); updateHint(); return; }
    var here = Math.min(st.idx, st.steps.length - 1);
    if (!loop.pending) { endDemo(); loop.pending = true; loop.a = here; showLoopToggle(); updateHint(); return; }
    var a = Math.min(loop.a, here), b = Math.max(loop.a, here);
    loop.pending = false; loop.a = a; loop.b = b; loop.laps = 0;
    showLoopToggle();
    restart(a);
  };
  function showFingerToggle() {
    var b = $('#btnFingers');
    b.classList.toggle('on', !!settings.fingers);
    b.setAttribute('aria-pressed', settings.fingers ? 'true' : 'false');
  }
  $('#btnFingers').onclick = function () {
    settings.fingers = !settings.fingers;
    store.set('pliktra.settings', settings);
    showFingerToggle();
    refreshSheet();
    dirty = true;
  };
  showFingerToggle();
  function showViewToggle() {
    var b = $('#btnView'), midi = !!(st.song && st.song.kind !== 'text');
    b.disabled = midi || isDrill();
    b.title = t(midi ? 'sheetMidi' : isDrill() ? 'drillAlwaysSheet' : 'sheetTitle');
    b.classList.toggle('on', sheetOn());
    b.setAttribute('aria-pressed', sheetOn() ? 'true' : 'false');
    showReadToggle();   // reading mode needs the sheet music
  }
  $('#btnView').onclick = function () {
    settings.view = settings.view === 'sheet' ? 'lane' : 'sheet';
    store.set('pliktra.settings', settings);
    showViewToggle();
    refreshSheet();
    updateHint();
  };
  showViewToggle();
  function showReadToggle() {
    var b = $('#btnRead'), on = readingOn();
    b.disabled = !sheetOn() || isDrill();
    b.title = t(isDrill() ? 'drillAlwaysRead' : sheetOn() ? 'readingTitle' : 'readingNeedsSheet');
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  }
  $('#btnRead').onclick = function () {
    settings.reading = !settings.reading;
    store.set('pliktra.settings', settings);
    st.rescue = false;
    showReadToggle();
    updateHint();
    dirty = true;
  };
  showReadToggle();
  $('#btnAgain').onclick = function () {
    if (isDrill()) { startDrill(st.song.drill); return; }   // note reading: new notes
    closeModal('mResult'); restart(st.startIdx);   // same section again
  };
  $('#btnDrillFocus').onclick = function () { if (isDrill()) startDrill(st.song.drill, drillWatch()); };
  $('#btnNextLesson').onclick = function () { var n = isLesson() && Lessons.next(st.song.lesson); if (n) startLesson(n.id); };
  $('#btnResSongs').onclick = function () { closeModal('mResult'); renderLibrary(); openModal('mLibrary'); };
  $('#progress').addEventListener('input', function (e) { restart(parseInt(e.target.value, 10) || 0); });
  // Don't leave the practice bar focused: Space/Enter would press the last button again.
  $('.practicebar').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) b.blur(); });
  $('#progress').addEventListener('change', function (e) { e.target.blur(); });
  document.querySelectorAll('#handSeg button').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('#handSeg button').forEach(function (x) { x.classList.toggle('on', x === b); });
      st.hand = b.getAttribute('data-hand');
      rebuildSteps();
    });
  });

  // ---------------------------------------------------------------- keep the screen awake while practising
  var wakeLock = null;
  var wakeLockPending = false;
  function requestWakeLock() {
    if (!('wakeLock' in navigator) || wakeLock || wakeLockPending) return;
    wakeLockPending = true;
    navigator.wakeLock.request('screen').then(function (l) {
      wakeLockPending = false;
      wakeLock = l;
      l.addEventListener('release', function () { if (wakeLock === l) wakeLock = null; });
    }).catch(function () { wakeLockPending = false; /* not allowed here; fine */ });
  }
  function releaseWakeLock() { if (wakeLock) { wakeLock.release(); wakeLock = null; } }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && st.startTime && !st.finished) requestWakeLock();
    if (document.visibilityState === 'hidden') { releaseMidiNotes(); stopDemo(); abortPlay(); }
  });
  // Let the screen sleep again after 3 minutes without playing.
  setInterval(function () {
    if (wakeLock && performance.now() - lastNoteAt > 180000) releaseWakeLock();
  }, 30000);

  // ---------------------------------------------------------------- start
  window.addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(cv.parentElement);
  resize();
  var lastId = store.get('pliktra.lastSong', null);
  if (!importFromHash()) {
    var lastLesson = /^lesson:(.+)$/.exec(lastId || '');
    loadSong(songs.filter(function (s) { return s.id === lastId; })[0] || (lastLesson && Lessons.song(lastLesson[1])) || songs[0] || null);
  }
  initMidi();
  requestAnimationFrame(frame);
  // Offline use / install as an app (only on the website: service workers need https).
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(function () { /* offline mode not available */ });
  }
})();
