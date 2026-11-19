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

  var settings = Object.assign({ labels: 'C', laneLabels: true, range: 'fit', sound: true, fingers: true, view: 'lane' }, store.get('pliktra.settings', {}));
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
      alert('This device’s storage for this app is full. Delete a long song and try again.');
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

  function currentStep() { return (st.idx < st.steps.length) ? st.steps[st.idx] : null; }
  function targetT() {
    if (!st.steps.length) return 0;
    return st.idx < st.steps.length ? st.steps[st.idx].t : st.steps[st.steps.length - 1].t + 3;
  }

  function loadSong(song) {
    st.song = song;
    store.set('pliktra.lastSong', song ? song.id : null);
    $('#songTitle').textContent = song ? song.title : 'No song loaded';
    rebuildSteps();
  }

  function rebuildSteps() {
    st.steps = st.song ? buildSteps(st.song.notes, st.hand) : [];
    layout();
    restart(0);
  }

  function restart(from) {
    st.idx = Math.max(0, Math.min(from || 0, Math.max(0, st.steps.length - 1)));
    st.startIdx = st.idx;
    st.hits = {}; st.stepMistake = false;
    st.mistakes = 0; st.clean = 0; st.startTime = 0; st.finished = false;
    st.viewT = targetT();
    updateStats(); updateHint();
    dirty = true;
  }

  function practiceNote(m) {
    if (!st.song || st.finished) return;
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
    $('#stepCount').textContent = Math.min(st.idx + (st.finished ? 0 : 1), n) + ' / ' + n;
    $('#mistakes').textContent = 'Mistakes ' + st.mistakes;
    updateSheetCursor(false);
  }

  // ---------------------------------------------------------------- sheet music view
  var sheetState = { key: '', data: null };

  function sheetOn() { return settings.view === 'sheet'; }

  function refreshSheet() {
    var box = $('#sheet'), inner = $('#sheetInner'), msgEl = $('#sheetMsg');
    var sheetLib = typeof Sheet !== 'undefined' && Sheet.available();
    box.hidden = !sheetOn();
    $('#hint').style.top = sheetOn() && geo ? (geo.kbTop - 36) + 'px' : '';
    dirty = true;
    if (!sheetOn() || !geo) return;
    box.style.height = geo.kbTop + 'px';
    var msg = '';
    if (!st.song) msg = 'Choose a song to see its sheet music.';
    else if (st.song.kind !== 'text') msg = 'Sheet music is available for typed songs. MIDI files are shown as falling notes (tap ♫ Sheet to switch back).';
    else if (!sheetLib) msg = 'The sheet music could not be loaded. Check the internet connection and reload.';
    if (!msg) {
      var scale = Math.max(0.5, Math.min(1.5, (geo.kbTop - 8) / 290));
      var key = [st.song.id, settings.fingers, scale.toFixed(3), st.song.text].join('|');
      if (key !== sheetState.key) {
        try {
          sheetState.data = Sheet.render($('#sheetSvg'), st.song.text, { fingers: settings.fingers, scale: scale });
          sheetState.key = key;
        } catch (e) {
          if (window.console) console.error(e);
          sheetState.data = null; sheetState.key = '';
          msg = 'This song can’t be shown as sheet music yet.';
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
    var wrapW = $('#sheet').clientWidth, inner = $('#sheetInner'), cursor = $('#sheetCursor');
    var minTx = Math.min(0, wrapW - d.width - 20);
    var tx = curX != null ? wrapW * 0.3 - curX : (st.finished ? minTx : 0);
    tx = Math.min(0, Math.max(minTx, tx));
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
    if (!st.song) h = 'Tap “Songs” to choose a song';
    else if (!st.steps.length) h = st.hand === 'L' ? 'This song has no left-hand notes' : st.hand === 'R' ? 'This song has no right-hand notes' : 'This song has no notes';
    else if (!st.startTime && !st.finished) h = 'Play the highlighted key to start';
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
    var handName = { B: 'both hands', R: 'right hand', L: 'left hand' }[st.hand];
    var note = !full ? 'Started from step ' + (st.startIdx + 1) + ', so this run isn’t counted as a best score.'
      : isBest ? (prev == null ? 'First score saved!' : 'New best! (was ' + prev + '%)')
      : 'Your best: ' + prev + '%';
    $('#resBody').innerHTML =
      '<div class="result-big">' + acc + '%</div>' +
      '<div class="result-sub">steps played without a wrong key</div>' +
      '<div class="result-lines">' +
        '<span>Hands</span><b>' + handName + '</b>' +
        '<span>Steps</span><b>' + total + '</b>' +
        '<span>Wrong keys</span><b>' + st.mistakes + '</b>' +
        '<span>Time</span><b>' + Math.floor(secs / 60) + ':' + ('0' + secs % 60).slice(-2) + '</b>' +
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
    if (src === 'midi') midiHeld[m] = true;
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
      delete midiHeld[m];
    }
    var c = (held[m] || 0) - 1;
    if (c > 0) held[m] = c; else delete held[m];
    if (src !== 'midi') synth.off(m);
    updateHeld();
    dirty = true;
  }

  function updateHeld() {
    var ms = Object.keys(held).map(Number).sort(function (a, b) { return a - b; });
    $('#held').textContent = ms.length ? '♪ ' + ms.map(midiToName).join(' ') : '';
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
      setStatus('This browser can’t read MIDI — use Chrome', 'bad');
      return;
    }
    navigator.requestMIDIAccess({ sysex: false }).then(function (access) {
      midiAccess = access;
      access.onstatechange = bindInputs;
      bindInputs();
    }, function () {
      setStatus('MIDI blocked — allow it via the lock icon in the address bar, then reload', 'bad');
    });
  }

  function bindInputs(e) {
    var names = [];
    midiAccess.inputs.forEach(function (input) {
      input.onmidimessage = onMidiMessage;
      if (input.state === 'connected') names.push(input.name);
    });
    if (names.length) setStatus('🎹 ' + names.join(', '), 'ok');
    else setStatus('No piano connected', 'warn');
    if (e && e.port && e.port.state === 'disconnected') releaseMidiNotes();
  }

  // Lets go of all piano keys we think are held (their note-off messages may never arrive).
  function releaseMidiNotes() {
    Object.keys(midiHeld).forEach(function (m) { noteOff(+m, 'midi'); });
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
    return { on: on, off: off };
  })();

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
          var label = r.w >= 30 ? noteLabel(n) : noteLabel(n).replace(/-?\d+$/, '');
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
        var txt = (m % 12 === 0 || ww >= 26) ? midiToName(m) : midiToName(m).replace(/-?\d+$/, '');
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
        var rad = black ? Math.min(kr.w * 0.42, 12) : Math.min(ww * 0.34, 14);
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
  var KEYMAP = { a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11, k: 12, o: 13, l: 14, p: 15, ';': 16 };
  var kbOct = 4, kbDown = {};
  function typing(e) { var t = e.target && e.target.tagName; return t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT'; }
  window.addEventListener('keydown', function (e) {
    if (typing(e) || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key.toLowerCase();
    if (k === 'z') { kbOct = Math.max(1, kbOct - 1); return; }
    if (k === 'x') { kbOct = Math.min(7, kbOct + 1); return; }
    if (k in KEYMAP && kbDown[k] == null) {
      var m = 12 * (kbOct + 1) + KEYMAP[k];
      if (m > 108) return;
      kbDown[k] = m;
      noteOn(m, 'kbd');
    }
  });
  window.addEventListener('keyup', function (e) {
    var k = e.key.toLowerCase();
    if (kbDown[k] != null) { var m = kbDown[k]; delete kbDown[k]; noteOff(m, 'kbd'); }
  });
  window.addEventListener('blur', function () {
    Object.keys(kbDown).forEach(function (k) { noteOff(kbDown[k], 'kbd'); delete kbDown[k]; });
  });

  // ---------------------------------------------------------------- modals
  function openModal(id) { $('#' + id).classList.add('open'); dirty = true; }
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

  // ---------------------------------------------------------------- library
  function handsLabel(notes) {
    var r = false, l = false;
    notes.forEach(function (n) { if (n.h === 'R') r = true; else l = true; });
    return r && l ? 'both hands' : r ? 'right hand' : 'left hand';
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
    if (!songs.length) { ul.appendChild(el('li', 'muted', 'No songs yet. Create one or import a MIDI file.')); return; }
    songs.forEach(function (s) {
      var li = el('li', st.song && st.song.id === s.id ? 'current' : '');
      var info = el('div', 'info');
      info.appendChild(el('div', 'name', s.title));
      var b = best[s.id + ':B'];
      var meta = buildSteps(s.notes, 'B').length + ' steps · ' + handsLabel(s.notes) +
        ' · ' + (s.kind === 'midi' ? 'MIDI file' : 'typed') + (b != null ? ' · best ' + b + '%' : '');
      info.appendChild(el('div', 'meta', meta));
      li.appendChild(info);

      var play = el('button', 'btn primary small', 'Practise');
      play.onclick = function () { closeAll(); loadSong(s); };
      var edit = el('button', 'btn small', s.kind === 'midi' ? 'Rename' : 'Edit');
      edit.onclick = function () {
        if (s.kind === 'midi') {
          var t = prompt('Song title', s.title);
          if (t && t.trim()) { s.title = t.trim(); saveSongs(); renderLibrary(); if (st.song === s) $('#songTitle').textContent = s.title; }
        } else openEditor(s);
      };
      var del = el('button', 'btn small danger', 'Delete');
      del.onclick = function () {
        if (!confirm('Delete “' + s.title + '”?')) return;
        songs = songs.filter(function (x) { return x !== s; });
        saveSongs();
        ['B', 'R', 'L'].forEach(function (h) { delete best[s.id + ':' + h]; });
        store.set('pliktra.best', best);
        if (st.song === s) loadSong(null);
        renderLibrary();
      };
      li.appendChild(play); li.appendChild(edit);
      if (s.kind !== 'midi') {
        var share = el('button', 'btn small', 'Share');
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

  function shareSong(song) {
    var url = location.origin + location.pathname + '#song=' + b64urlEncode(JSON.stringify({ t: song.title, s: song.text }));
    if (navigator.share) { navigator.share({ title: song.title, url: url }).catch(function () { /* cancelled */ }); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () {
        alert('Link copied. Open it on another device to add “' + song.title + '” there.');
      }, function () { prompt('Copy this link:', url); });
      return;
    }
    prompt('Copy this link:', url);
  }

  function importFromHash() {
    var m = /^#song=([A-Za-z0-9_-]+)$/.exec(location.hash);
    if (!m) return false;
    history.replaceState(null, '', location.pathname + location.search);
    var data = null;
    try { data = JSON.parse(b64urlDecode(m[1])); } catch (e) { /* handled below */ }
    // A link holds one song {t, s} or a list of them [{t, s}, ...]
    var list = Array.isArray(data) ? data : [data];
    var valid = list.length > 0 && list.length <= 50 && list.every(function (d) {
      return d && typeof d.t === 'string' && typeof d.s === 'string' && d.s.length <= 20000;
    });
    if (!valid) { alert('This song link is damaged.'); return false; }

    // Same title + same notes: already there. Same title + different notes: offer to update it
    // (keeps the song's best scores). New title: add it.
    var toAdd = [], toUpdate = [], firstExisting = null;
    for (var i = 0; i < list.length; i++) {
      var title = list[i].t.trim().slice(0, 120) || 'Shared song', text = list[i].s;
      var match = songs.filter(function (x) { return x.kind === 'text' && x.title === title; })[0];
      if (match && match.text === text) { firstExisting = firstExisting || match; continue; }
      var r = parseSongText(text);
      if (r.errors.length || !r.notes.length) { alert('“' + title + '” in this link contains mistakes and can’t be added.'); return false; }
      if (match) toUpdate.push({ song: match, text: text });
      else toAdd.push({ title: title, text: text });
    }
    if (!toAdd.length && !toUpdate.length) {
      if (firstExisting) { closeAll(); loadSong(firstExisting); return true; }
      return false;
    }
    function names(arr) { return arr.map(function (t) { return '“' + t + '”'; }).join(', '); }
    var question = [];
    if (toAdd.length) question.push('Add ' + names(toAdd.map(function (x) { return x.title; })) + ' to your songs');
    if (toUpdate.length) question.push((toAdd.length ? 'update ' : 'Update ') + names(toUpdate.map(function (u) { return u.song.title; })) + ' with the new version');
    if (!confirm(question.join(' and ') + '?')) return false;

    var oldTexts = toUpdate.map(function (u) { return u.song.text; });
    toUpdate.forEach(function (u) { u.song.text = u.text; u.song.notes = parseSongText(u.text).notes; });
    var created = toAdd.map(function (x) { return songFromText(x.title, x.text); });
    songs = created.concat(songs);
    if (!saveSongs()) {
      songs = songs.slice(created.length);
      toUpdate.forEach(function (u, k) { u.song.text = oldTexts[k]; u.song.notes = parseSongText(oldTexts[k]).notes; });
      return false;
    }
    closeAll();
    loadSong(created[0] || toUpdate[0].song);
    return true;
  }
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
    $('#edInfo').textContent = r.steps ? r.steps + ' steps · ' + handsLabel(r.notes) : '';
    $('#edError').textContent = r.errors.slice(0, 5).join('\n') + (r.errors.length > 5 ? '\n…and ' + (r.errors.length - 5) + ' more' : '');
    return r;
  }

  function setRecording(on) {
    recording = on;
    var b = $('#btnRecord');
    b.classList.toggle('on', on);
    b.textContent = on ? '■ Stop recording' : '● Record from piano';
  }

  function recordNote(m) {
    var ta = $('#edText'), now = performance.now(), name = midiToName(m);
    var v = ta.value, endsWithSpace = !v || /\s$/.test(v);
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
    if ($('#edText').value && !confirm('Clear all notes?')) return;
    $('#edText').value = ''; validateEditor();
  };
  $('#edText').addEventListener('input', validateEditor);
  $('#btnNew').onclick = function () { openEditor(null); };

  $('#btnSaveSong').onclick = function () {
    var r = validateEditor();
    if (r.errors.length) return;
    if (!r.notes.length) { $('#edError').textContent = 'Add some notes first.'; return; }
    var title = $('#edTitle').value.trim() || 'Untitled song';
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
      if (!mf.parts.length) throw new Error('No piano notes were found in this file.');
      openImport(f.name.replace(/\.(mid|midi)$/i, ''), mf);
    }).catch(function (err) {
      alert('Could not read this MIDI file.\n' + (err && err.message ? err.message : err));
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
      tr.appendChild(el('td', '', midiToName(p.min) + ' – ' + midiToName(p.max)));
      var td = el('td'), sel = el('select');
      [['R', 'Right hand'], ['L', 'Left hand'], ['S', 'Split at middle C'], ['X', 'Skip']].forEach(function (o) {
        var opt = el('option', '', o[1]); opt.value = o[0]; sel.appendChild(opt);
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
    if (!notes.length) { alert('Choose a hand for at least one part.'); return; }
    var t0 = notes.reduce(function (a, n) { return Math.min(a, n.t); }, Infinity);
    notes.forEach(function (n) { n.t = Math.round((n.t - t0) * 1000) / 1000; n.d = Math.round(n.d * 1000) / 1000; });
    sortNotes(notes);
    var song = { id: newId(), title: $('#imTitle').value.trim() || 'Imported song', kind: 'midi', notes: notes };
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

  // ---------------------------------------------------------------- top bar wiring
  $('#btnSongs').onclick = function () { renderLibrary(); openModal('mLibrary'); };
  $('#btnSettings').onclick = function () { openModal('mSettings'); };
  $('#btnRestart').onclick = function () { restart(0); };
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
    var b = $('#btnView');
    b.classList.toggle('on', sheetOn());
    b.setAttribute('aria-pressed', sheetOn() ? 'true' : 'false');
  }
  $('#btnView').onclick = function () {
    settings.view = sheetOn() ? 'lane' : 'sheet';
    store.set('pliktra.settings', settings);
    showViewToggle();
    refreshSheet();
  };
  showViewToggle();
  $('#btnAgain').onclick = function () { closeModal('mResult'); restart(st.startIdx); };   // same section again
  $('#btnResSongs').onclick = function () { closeModal('mResult'); renderLibrary(); openModal('mLibrary'); };
  $('#progress').addEventListener('input', function (e) { restart(parseInt(e.target.value, 10) || 0); });
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
    if (document.visibilityState === 'hidden') releaseMidiNotes();
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
})();
