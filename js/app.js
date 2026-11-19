// Pliktra (πλήκτρα, "keys") — wait-mode piano trainer driven by a MIDI piano (or touch / computer keys).
(function () {
  'use strict';

  var $ = function (s) { return document.querySelector(s); };
  var HAND_COLOR = { R: '#4f9dff', L: '#ffa94d' };
  var HAND_SOFT = { R: '#b9d7ff', L: '#ffdcb5' };

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
            'F3/2+F4/4 F4/4 F4/4_1.5 F4/4_0.5 | C3/5+F4/4 E4/3 E4/3 E4/3_0.5 E4/3_0.5 | G3/1+G4/5 G4/5 F4/4 D4/2 | C3/5+C4/1_4' }
  ];
  // Built-ins from the first version; devices without a record of seen built-ins already had these.
  var FIRST_BUILTINS = ['C major scale (both hands)', 'Ode to Joy (right hand)', 'Twinkle Twinkle (both hands)'];

  function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function songFromText(title, text) {
    return { id: newId(), title: title, kind: 'text', text: text, notes: parseSongText(text).notes };
  }

  var savedSettings = store.get('pliktra.settings', {});
  var settings = Object.assign({ labels: 'all', laneLabels: true, range: 'fit', sound: true, fingers: true, view: 'sheet',
    listenSpeed: '1', listenOnPiano: true, lang: 'auto' }, savedSettings);
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

  function currentStep() { return (st.idx < st.steps.length) ? st.steps[st.idx] : null; }
  function targetT() {
    if (!st.steps.length) return 0;
    return st.idx < st.steps.length ? st.steps[st.idx].t : st.steps[st.steps.length - 1].t + 3;
  }

  function loadSong(song) {
    st.song = song;
    store.set('pliktra.lastSong', song ? song.id : null);
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
    st.idx = Math.max(0, Math.min(from || 0, Math.max(0, st.steps.length - 1)));
    if (loopOn() && (st.idx < loop.a || st.idx > loop.b)) clearLoop();   // moved outside the loop
    st.startIdx = st.idx;
    st.hits = {}; st.stepMistake = false;
    st.mistakes = 0; st.clean = 0; st.startTime = 0; st.finished = false;
    st.viewT = targetT();
    updateStats(); updateHint();
    dirty = true;
  }

  function practiceNote(m) {
    if (!st.song || st.finished || demo) return;
    var step = currentStep();
    if (!step) return;
    if (step.notes.indexOf(m) >= 0) {
      if (!st.startTime) { st.startTime = performance.now(); requestWakeLock(); updateHint(); }
      st.hits[m] = true;
      var done = step.notes.every(function (n) { return st.hits[n]; });
      if (done) advance();
    } else if (otherHandNote(m, step)) {
      // One-hand practice: playing the other hand's part along with it is not a mistake.
    } else {
      wrong[m] = performance.now();
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
    st.hits = {}; st.stepMistake = false;
    if (loopOn() && st.idx > loop.b) {   // end of the loop: count the round and go again
      loop.laps++; loop.lastMistakes = st.mistakes;
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
  function sheetOn() { return settings.view === 'sheet' && !(st.song && st.song.kind !== 'text'); }

  function refreshSheet() {
    var box = $('#sheet'), inner = $('#sheetInner'), msgEl = $('#sheetMsg');
    var sheetLib = typeof Sheet !== 'undefined' && Sheet.available();
    box.hidden = !sheetOn();
    $('#hint').style.top = sheetOn() && geo ? (geo.kbTop - 36) + 'px' : '';
    $('#hint').classList.toggle('on-paper', sheetOn());   // dark text on the light score
    dirty = true;
    if (!sheetOn() || !geo) return;
    box.style.height = geo.kbTop + 'px';
    var msg = '';
    if (!st.song) msg = t('sheetChoose');
    else if (!sheetLib) msg = t('sheetNoLib');
    if (!msg) {
      var scale = Math.max(0.5, Math.min(1.5, (geo.kbTop - 8) / 290));
      var key = [st.song.id, settings.fingers, scale.toFixed(3), st.song.text].join('|');
      if (key !== sheetState.key) {
        try {
          sheetState.data = Sheet.render($('#sheetSvg'), st.song.text, { fingers: settings.fingers, scale: scale });
          var room = geo.kbTop - 8;   // grew taller (very high/low notes)? draw it a bit smaller
          if (sheetState.data.height > room && scale > 0.5) {
            sheetState.data = Sheet.render($('#sheetSvg'), st.song.text,
              { fingers: settings.fingers, scale: Math.max(0.5, scale * room / sheetState.data.height) });
          }
          sheetState.key = key;
        } catch (e) {
          if (window.console) console.error(e);
          sheetState.data = null; sheetState.key = '';
          msg = t('sheetFail');
        }
      }
    }
    msgEl.textContent = msg;
    inner.style.display = msg ? 'none' : '';
    if (msg) {   // forget the old score so nothing refers to it
      sheetState.key = ''; sheetState.data = null;
      $('#sheetSvg').innerHTML = '';
      return;
    }
    inner.style.width = sheetState.data.width + 'px';
    inner.style.marginTop = Math.max(0, (geo.kbTop - sheetState.data.height) / 2) + 'px';
    $('#sheetCursor').style.width = Math.round(28 * Math.max(0.6, sheetState.data.height / 290)) + 'px';
    updateSheetCursor(true);
  }

  // Colours the notes to play now, fades the ones already played and scrolls them into view.
  function updateSheetCursor(instant) {
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

  function updateHint() {
    var h = '';
    if (!st.song) h = t('hintChoose');
    else if (!st.steps.length) h = t(st.hand === 'L' ? 'hintNoLeft' : st.hand === 'R' ? 'hintNoRight' : 'hintNoNotes');
    else if (demo) h = t('hintListening');
    else if (loop.pending) h = t('hintLoop');
    else if (loopOn() && loop.laps && !st.startTime) {
      var res = !loop.lastMistakes ? t('roundClean') : loop.lastMistakes === 1 ? t('roundOne') : t('roundMany', { n: loop.lastMistakes });
      h = t('hintRound', { n: loop.laps, result: res });
    }
    else if (!st.startTime && !st.finished) h = t('hintStart');
    $('#hint').textContent = h;
  }

  function showResult() {
    if (!st.finished || !st.song) return;
    var total = st.steps.length - st.startIdx;
    var acc = total ? Math.round(100 * st.clean / total) : 0;
    var secs = Math.round((performance.now() - st.startTime) / 1000);
    var full = st.startIdx === 0;
    var key = st.song.id + ':' + st.hand;
    var prev = best[key];
    var isBest = full && (prev == null || acc > prev);
    if (isBest) { best[key] = acc; store.set('pliktra.best', best); }
    var handName = t('hands' + st.hand);
    var note = !full ? t('resPartial', { n: st.startIdx + 1 })
      : isBest ? (prev == null ? t('resFirst') : t('resNewBest', { p: prev }))
      : t('resBest', { p: prev });
    $('#resBody').innerHTML =
      '<div class="result-big">' + acc + '%</div>' +
      '<div class="result-sub">' + t('resultSub') + '</div>' +
      '<div class="result-lines">' +
        '<span>' + t('resHands') + '</span><b>' + handName + '</b>' +
        '<span>' + t('resSteps') + '</span><b>' + total + '</b>' +
        '<span>' + t('resWrong') + '</span><b>' + st.mistakes + '</b>' +
        '<span>' + t('resTime') + '</span><b>' + Math.floor(secs / 60) + ':' + ('0' + secs % 60).slice(-2) + '</b>' +
      '</div>' +
      '<div class="result-note' + (isBest ? ' best' : '') + '">' + note + '</div>';
    openModal('mResult');
    releaseWakeLock();
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
    return { on: on, off: off, play: play, stopAll: stopAll };
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
    var notes = st.song.notes.filter(function (n) {
      return n.t >= t0 - 0.001 && n.t <= t1 && (st.hand === 'B' || n.h === st.hand);
    });
    restart(from);   // a fresh start: no mistakes, no half-played chord
    var d = { from: from, to: to, t0: t0, notes: notes, ni: 0, si: from, speed: +settings.listenSpeed || 1,
      out: demoOutput(), start: performance.now() + 150, nodes: [], timers: [], sent: {}, timer: 0, endMs: 0 };
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
      demoNote(d, n, on, off);
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
    d.timers.push(setTimeout(function () { demoKeys[n.m] = n.h; dirty = true; }, Math.max(0, onMs - performance.now())));
    d.timers.push(setTimeout(function () { delete demoKeys[n.m]; dirty = true; }, Math.max(0, offMs - performance.now() - 30)));
  }

  // Silences the playback without moving the practice position.
  function endDemo() {
    var d = demo;
    if (!d) return;
    demo = null;
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
    showListenToggle();
    updateHint();
    dirty = true;
  }

  // Stops the playback and goes back to where it started, ready to play.
  function stopDemo() {
    var d = demo;
    if (!d) return;
    endDemo();
    restart(d.from);
  }

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

    // lane background + octave guides at every C
    ctx.fillStyle = '#101318';
    ctx.fillRect(0, 0, W, laneH);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
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
      ctx.font = '600 12px system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      for (var k = firstNoteAtOrAfter(notes, step.t - 0.001); k < notes.length; k++) {
        var n = notes[k];
        if (n.t > maxT) break;
        if (n.m < geo.lo || n.m > geo.hi) continue;
        var active = st.hand === 'B' || n.h === st.hand;
        var isCur = active && n.t < step.t + 0.046 && step.notes.indexOf(n.m) >= 0;
        var done = isCur && st.hits[n.m];
        var r = keyRect(n.m);
        var yb = laneH - (n.t - st.viewT) * pps;
        var showFinger = settings.fingers && active && n.f;
        var h = Math.max(n.d * pps - 3, showFinger ? 24 : 14);
        ctx.globalAlpha = !active ? 0.28 : done ? 0.35 : 1;
        ctx.fillStyle = active ? HAND_COLOR[n.h] : '#7a8394';
        if (isCur && !done) { ctx.shadowColor = HAND_COLOR[n.h]; ctx.shadowBlur = 14; }
        rr(r.x + 1.5, yb - h, r.w - 3, h, 5);
        ctx.fill();
        ctx.shadowBlur = 0;
        var labelY = yb - 3, nameFits = true;
        if (showFinger) {
          var rad = Math.min(r.w * 0.36, 11, (h - 4) / 2);
          var cy = yb - rad - 3;
          ctx.fillStyle = 'rgba(255,255,255,0.95)';
          ctx.beginPath(); ctx.arc(r.x + r.w / 2, cy, rad, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#0b1220';
          ctx.font = '800 ' + Math.round(rad * 1.35) + 'px system-ui, sans-serif';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(n.f), r.x + r.w / 2, cy + 1);
          ctx.textBaseline = 'bottom';
          ctx.font = '600 12px system-ui, sans-serif';
          labelY = cy - rad - 2;
          nameFits = h >= rad * 2 + 20;
        }
        if (settings.laneLabels && active && r.w >= 16 && nameFits) {
          ctx.fillStyle = '#0b1220';
          var label = localNoteName(r.w >= 30 ? noteLabel(n) : noteLabel(n).replace(/-?\d+$/, ''));
          ctx.fillText(label, r.x + r.w / 2, labelY);
        }
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    // hit line
    ctx.fillStyle = 'rgba(79,157,255,0.55)';
    ctx.fillRect(0, laneH - 2, W, 2);

    drawKeyboard(now, step);
  }

  function keyState(m, now, step) {
    if (wrong[m] && now - wrong[m] < 380) return { fill: '#ff5c5c', strong: true };
    if (demoKeys[m]) return { fill: HAND_COLOR[demoKeys[m]], strong: true };   // sounding in Listen
    if (step && !anyModalOpen() && step.notes.indexOf(m) >= 0) {
      var hand = step.hands[m];
      var on = !!(held[m] || st.hits[m]);
      return { fill: on ? HAND_COLOR[hand] : (isBlack(m) ? HAND_COLOR[hand] : HAND_SOFT[hand]), strong: on, target: true };
    }
    if (held[m]) return { fill: isBlack(m) ? '#6b7a8d' : '#c3cedb', strong: true };
    return null;
  }

  function drawKeyboard(now, step) {
    var top = geo.kbTop, kh = geo.kbH, ww = geo.ww;
    ctx.fillStyle = '#0c0e12';
    ctx.fillRect(0, top, W, kh);

    // white keys
    for (var i = 0; i < geo.whites.length; i++) {
      var m = geo.whites[i], x = i * ww, s = keyState(m, now, step);
      ctx.fillStyle = s ? s.fill : '#f4f5f7';
      rr(x + 1, top + 1, ww - 2, kh - 3, 4);
      ctx.fill();
      // labels
      var showLabel = settings.labels === 'all' || (settings.labels === 'C' && m % 12 === 0);
      if (showLabel && ww >= 14) {
        var txt = localNoteName((m % 12 === 0 || ww >= 26) ? midiToName(m) : midiToName(m).replace(/-?\d+$/, ''));
        if (settings.labels === 'all' && m % 12 !== 0 && ww < 26) txt = txt.charAt(0);
        ctx.fillStyle = m === 60 ? '#1d6fe0' : '#5b6472';
        ctx.font = (m === 60 ? '700 ' : '500 ') + Math.min(14, Math.max(9, ww * 0.32)) + 'px system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText(txt, x + ww / 2, top + kh - 8);
      }
      if (m === 60) { // middle C marker
        ctx.fillStyle = '#1d6fe0';
        ctx.beginPath(); ctx.arc(x + ww / 2, top + geo.bh + 12, 3, 0, Math.PI * 2); ctx.fill();
      }
    }

    // black keys
    for (var b = geo.lo; b <= geo.hi; b++) {
      if (!isBlack(b)) continue;
      var r = keyRect(b), sb = keyState(b, now, step);
      ctx.fillStyle = sb ? sb.fill : '#1c1f25';
      rr(r.x, top, r.w, geo.bh, 3);
      ctx.fill();
      if (!sb) { // subtle highlight
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(r.x + 3, top + 2, r.w - 6, geo.bh * 0.75);
      }
    }

    // finger numbers on the keys to play now
    if (settings.fingers && step && !anyModalOpen()) {
      step.notes.forEach(function (fm) {
        var f = step.fingers && step.fingers[fm];
        if (!f || fm < geo.lo || fm > geo.hi) return;
        var kr = keyRect(fm), black = isBlack(fm);
        var rad = Math.max(7, black ? Math.min(kr.w * 0.42, 12) : Math.min(ww * 0.34, 14));   // readable even with 88 small keys
        var cy = black ? top + geo.bh - rad - 6 : top + kh - rad - 28;
        ctx.fillStyle = '#14171c';
        ctx.beginPath(); ctx.arc(kr.x + kr.w / 2, cy, rad, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 ' + Math.round(rad * 1.3) + 'px system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(f), kr.x + kr.w / 2, cy + 1);
      });
    }
  }

  var lastFrame = performance.now();
  function frame(now) {
    var dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;
    var tgt = targetT();
    if (st.viewT !== tgt) {
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
  function openModal(id) { stopDemo(); $('#' + id).classList.add('open'); dirty = true; }
  function closeModal(id) {
    $('#' + id).classList.remove('open');
    if (id === 'mEditor') setRecording(false);
    dirty = true;
  }
  function isOpen(id) { return $('#' + id).classList.contains('open'); }
  function anyModalOpen() { return !!document.querySelector('.modal.open'); }
  function closeAll() { ['mLibrary', 'mEditor', 'mImport', 'mResult', 'mSettings'].forEach(closeModal); }

  document.querySelectorAll('[data-close]').forEach(function (b) {
    b.addEventListener('click', function () { closeModal(b.closest('.modal').id); });
  });

  // Escape or a tap outside the dialog closes it (the editor asks first if something changed).
  function editorChanged() {
    return $('#edText').value !== (editing ? editing.text : '') || $('#edTitle').value.trim() !== (editing ? editing.title : '');
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

  function renderLibrary() {
    var ul = $('#songList');
    ul.innerHTML = '';
    if (!songs.length) { ul.appendChild(el('li', 'muted', t('noSongs'))); return; }
    songs.forEach(function (s) {
      var li = el('li', st.song && st.song.id === s.id ? 'current' : '');
      var info = el('div', 'info');
      info.appendChild(el('div', 'name', songName(s)));
      var b = best[s.id + ':B'];
      var meta = t('metaSteps', { n: buildSteps(s.notes, 'B').length }) + ' · ' + handsLabel(s.notes) +
        ' · ' + t(s.kind === 'midi' ? 'metaMidi' : 'metaTyped') + (b != null ? ' · ' + t('metaBest', { p: b }) : '');
      info.appendChild(el('div', 'meta', meta));
      li.appendChild(info);

      var play = el('button', 'btn primary small', t('practise'));
      play.onclick = function () { closeAll(); loadSong(s); };
      var edit = el('button', 'btn small', t(s.kind === 'midi' ? 'rename' : 'edit'));
      edit.onclick = function () {
        if (s.kind === 'midi') {
          var nt = prompt(t('songTitlePrompt'), s.title);
          if (nt && nt.trim()) { s.title = nt.trim(); saveSongs(); renderLibrary(); if (st.song === s) $('#songTitle').textContent = songName(s); }
        } else openEditor(s);
      };
      var del = el('button', 'btn small danger', t('del'));
      del.onclick = function () {
        if (!confirm(t('confirmDelete', { t: songName(s) }))) return;
        songs = songs.filter(function (x) { return x !== s; });
        saveSongs();
        ['B', 'R', 'L'].forEach(function (h) { delete best[s.id + ':' + h]; });
        store.set('pliktra.best', best);
        if (st.song === s) loadSong(null);
        renderLibrary();
      };
      li.appendChild(play); li.appendChild(edit);
      if (s.kind !== 'midi') {
        var share = el('button', 'btn small', t('share'));
        share.onclick = function () { shareSong(s); };
        li.appendChild(share);
      }
      li.appendChild(del);
      ul.appendChild(li);
    });
  }

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
  function shareSong(song) { shareLink({ t: song.title, s: song.text }, songName(song), '“' + songName(song) + '”'); }

  // Song entries in links and backup files: typed {t, s}, MIDI {t, k: 'midi', n: [[m, t, d, h], ...]},
  // plus b = best scores {B, R, L} in backup files.
  function songEntry(s, withBest) {
    var e = s.kind === 'midi'
      ? { t: s.title, k: 'midi', n: s.notes.map(function (n) { return [n.m, n.t, n.d, n.h]; }) }
      : { t: s.title, s: s.text };
    if (withBest) {
      var b = {};
      ['B', 'R', 'L'].forEach(function (h) { if (best[s.id + ':' + h] != null) b[h] = best[s.id + ':' + h]; });
      if (Object.keys(b).length) e.b = b;
    }
    return e;
  }
  function entryValid(d) {
    if (!d || typeof d.t !== 'string') return false;
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
      return arr.length > 4 ? t('nSongs', { n: arr.length }) : arr.map(function (x) { return '“' + songName(x.song || { title: x.title }) + '”'; }).join(', ');
    }
    function mergeBest(item) {   // keep the better score
      if (!item.d.b || !item.song) return;
      ['B', 'R', 'L'].forEach(function (h) {
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
        return x.song;
      });
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
      typed.length === 1 ? '“' + songName(typed[0]) + '”' : t('theseSongs', { n: typed.length }));
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
      importSongs(data && data.app === 'pliktra' ? data.songs : null, t('backupDamaged'), true);
      renderLibrary();
    });
  });
  window.addEventListener('hashchange', importFromHash);

  // ---------------------------------------------------------------- editor
  var editing = null, recording = false, chordStart = 0;

  function openEditor(song) {
    editing = song || null;
    $('#edTitle').value = song ? song.title : '';
    $('#edText').value = song ? song.text : '';
    $('#edError').textContent = '';
    setRecording(false);
    validateEditor();
    openModal('mEditor');
  }

  function validateEditor() {
    var r = parseSongText($('#edText').value);
    $('#edInfo').textContent = r.steps ? t('edInfo', { n: r.steps, hands: handsLabel(r.notes) }) : '';
    $('#edError').textContent = r.errors.slice(0, 5).join('\n') + (r.errors.length > 5 ? '\n' + t('moreErrors', { n: r.errors.length - 5 }) : '');
    return r;
  }

  function setRecording(on) {
    recording = on;
    var b = $('#btnRecord');
    b.classList.toggle('on', on);
    b.textContent = t(on ? 'stopRecord' : 'record');
  }

  function recordNote(m) {
    var ta = $('#edText'), now = performance.now(), name = midiToName(m);
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
    var song = editing;
    if (song) { song.title = title; song.text = $('#edText').value; song.notes = r.notes; }
    else { song = songFromText(title, $('#edText').value); songs.unshift(song); }
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
    if (loopOn()) { clearLoop(); updateStats(); updateHint(); return; }
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
    b.disabled = midi;
    b.title = t(midi ? 'sheetMidi' : 'sheetTitle');
    b.classList.toggle('on', sheetOn());
    b.setAttribute('aria-pressed', sheetOn() ? 'true' : 'false');
  }
  $('#btnView').onclick = function () {
    settings.view = settings.view === 'sheet' ? 'lane' : 'sheet';
    store.set('pliktra.settings', settings);
    showViewToggle();
    refreshSheet();
  };
  showViewToggle();
  $('#btnAgain').onclick = function () { closeModal('mResult'); restart(st.startIdx); };   // same section again
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
    if (document.visibilityState === 'hidden') { releaseMidiNotes(); stopDemo(); }
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
  if (!importFromHash()) loadSong(songs.filter(function (s) { return s.id === lastId; })[0] || songs[0] || null);
  initMidi();
  requestAnimationFrame(frame);
  // Offline use / install as an app (only on the website: service workers need https).
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(function () { /* offline mode not available */ });
  }
})();
