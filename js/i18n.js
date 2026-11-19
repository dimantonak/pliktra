// Languages. Texts are looked up with t('key', { name: value }); "{name}" in a text is replaced.
// To add a language: copy the `en` block, translate it, add it to LANGS and to the Settings menu.
'use strict';

var LANGS = { en: 'English', de: 'Deutsch' };

var I18N = {
  en: {
    // top bar / practice bar
    songs: 'Songs', noSong: 'No song loaded', starting: 'Starting…', settings: 'Settings',
    both: 'Both', right: 'Right', left: 'Left', hands: 'Hands',
    restart: ' Restart', restartTitle: 'Start again',
    fingers: ' Fingers', fingersTitle: 'Show which finger plays each key',
    sheet: ' Sheet', sheetTitle: 'Show sheet music instead of falling notes', sheetMidi: 'Sheet music is available for typed songs only',
    listen: ' Listen', stop: ' Stop', listenTitle: 'Listen to the song first',
    loop: ' Loop', loopRange: ' Loop {a}–{b}', setEnd: ' Set end', loopTitle: 'Repeat a part: tap at its start, move to its end, tap again',
    position: 'Position in song', loopShort: 'loop', mistakes: 'Mistakes {n}', close: 'Close',
    // hints and messages on the stage
    hintChoose: 'Tap “Songs” to choose a song', hintNoNotes: 'This song has no notes',
    hintNoLeft: 'This song has no left-hand notes', hintNoRight: 'This song has no right-hand notes',
    hintListening: 'Listening… then play it yourself',
    hintLoop: 'Loop: move the slider (or play on) to the last step of the part, then tap “Set end”',
    hintRound: 'Round {n}: {result} — again', roundClean: 'no wrong keys!', roundOne: '1 wrong key', roundMany: '{n} wrong keys',
    hintStart: 'Play the highlighted key to start',
    sheetChoose: 'Choose a song to see its sheet music.',
    sheetNoLib: 'The sheet music could not be loaded. Check the internet connection and reload.',
    sheetFail: 'This song can’t be shown as sheet music yet.',
    // MIDI status
    midiNoBrowser: 'This browser can’t read MIDI — use Chrome', midiBlocked: 'MIDI blocked — allow it via the lock icon in the address bar, then reload',
    midiNone: 'No piano connected',
    // result
    wellDone: 'Well done!', resultSub: 'steps played without a wrong key', resHands: 'Hands', resSteps: 'Steps',
    resWrong: 'Wrong keys', resTime: 'Time', playAgain: 'Play again',
    handsB: 'both hands', handsR: 'right hand', handsL: 'left hand',
    resPartial: 'Started from step {n}, so this run isn’t counted as a best score.',
    resFirst: 'First score saved!', resNewBest: 'New best! (was {p}%)', resBest: 'Your best: {p}%',
    // library
    newSong: '+ New song', importMidi: 'Import MIDI file',
    noSongs: 'No songs yet. Create one or import a MIDI file.',
    metaSteps: '{n} steps', metaStep1: '1 step', metaMidi: 'MIDI file', metaTyped: 'typed', metaBest: 'best {p}%', metaBestHands: 'best: {list}', metaPct: '{p}%',
    libHint: 'Tap a song to practise it. ⋯ edits, shares, duplicates or deletes it.',
    starterSongs: 'Starter songs ({n})', moreActions: 'More', moreActionsFor: 'More for “{t}”',
    shareLinkBtn: 'Share as link', duplicate: 'Duplicate', copyTitle: '{t} (copy)',
    practise: 'Practise', edit: 'Edit', rename: 'Rename', share: 'Share', del: 'Delete',
    songTitlePrompt: 'Song title', confirmDelete: 'Delete “{t}”?',
    backupNote: 'Your songs are saved in this browser only. Keep a backup, or share them all to another device.',
    shareAll: 'Share all songs', saveBackup: 'Save backup file', restoreBackup: 'Restore backup',
    // links and backups
    linkCopied: 'Link copied. Open it on another device to add {what} there.', copyLink: 'Copy this link:',
    theseSongs: 'these {n} songs', nSongs: '{n} songs', allSongsTitle: 'Pliktra songs',
    noTypedSongs: 'There are no typed songs to share yet.',
    linkDamaged: 'This song link is damaged.', backupDamaged: 'This is not a Pliktra backup file, or it is damaged.',
    songHasMistakes: '“{t}” contains mistakes and can’t be added.',
    askAdd: 'Add {names} to your songs', askUpdate: 'Update {names} with the version in the {src}', askUpdateLower: 'update {names} with the version in the {src}',
    srcLink: 'link', srcBackup: 'backup', and: ' and ', backupSame: 'All songs in this backup are already here.',
    quote: '“{t}”', sharedSong: 'Shared song', storageFull: 'This device’s storage for this app is full. Delete a long song and try again.',
    // editor
    editor: 'Song editor', title: 'Title', titlePh: 'e.g. Ode to Joy', notes: 'Notes',
    record: '● Record from piano', stopRecord: '■ Stop recording', clear: 'Clear', cancel: 'Cancel', savePractise: 'Save & practise',
    edInfo: '{n} steps · {hands}', moreErrors: '…and {n} more', addNotes: 'Add some notes first.', untitled: 'Untitled song',
    confirmClear: 'Clear all notes?', confirmCloseEditor: 'Close the editor without saving?',
    howTo: 'How to write notes',
    helpHtml:
      '<li>One step per word: <code>C4 D4 E4</code>. The number is the octave; <code>C4</code> is middle C.</li>' +
      '<li>Sharps and flats: <code>F#4</code>, <code>Bb3</code>.</li>' +
      '<li>Keys played together (chord): join with <code>+</code>, e.g. <code>C4+E4+G4</code>.</li>' +
      '<li>Hands: notes below middle C go to the left hand, the rest to the right. Force a hand with <code>L:</code> or <code>R:</code>, e.g. <code>L:C4+R:E4</code>.</li>' +
      '<li>Fingers: add <code>/</code> and the finger after a note: <code>E4/3</code>, <code>G3/4+B3/2</code>. 1 = thumb, 2 = index, 3 = middle, 4 = ring, 5 = little finger (same numbers for both hands).</li>' +
      '<li>Length in beats: <code>C4_2</code> = 2 beats, <code>G4_0.5</code> = half a beat (1 beat = a quarter note). <code>-</code> is a rest, <code>-_2</code> a 2-beat rest.</li>' +
      '<li>Time signature: write it first, e.g. <code>3/4</code> or <code>6/8</code> (default 4/4). It sets the bars in the sheet music.</li>' +
      '<li>Bar lines <code>|</code> and anything after <code>//</code> are ignored.</li>' +
      '<li><b>Record from piano</b> adds what you play on the piano to the end of the text.</li>',
    // parser errors
    errLength: '"{tok}": the length after _ must be a number', errMeterPos: '"{tok}": a time signature can only be at the start',
    errMeter: '"{tok}" is not a time signature', errFinger: '"{tok}": the finger after / must be 1 to 5', errNote: '"{tok}" is not a note on the piano',
    // MIDI import
    importTitle: 'Import MIDI file', importHelp: 'Choose which hand plays each part of the file.',
    part: 'Part', range: 'Range', hand: 'Hand', rightHand: 'Right hand', leftHand: 'Left hand', split: 'Split at middle C', skip: 'Skip',
    importedSong: 'Imported song', midiReadFail: 'Could not read this MIDI file.', midiNoNotes: 'No piano notes were found in this file.',
    notMidi: 'This is not a MIDI file.', midiDamaged: 'The MIDI file looks damaged.', chooseHand: 'Choose a hand for at least one part.',
    // settings
    language: 'Language', langAuto: 'Automatic (device language)',
    grpKeyboard: 'Keyboard on the screen', keyNames: 'Note names on the keys',
    namesAll: 'All white keys', namesC: 'Only C keys (C3, C4…)', namesOff: 'Off',
    size: 'Size', sizeFit: 'Fit to the song (bigger keys)', sizeFull: 'All 88 keys',
    grpLane: 'Falling notes view', laneNames: 'Note names on the falling notes',
    laneSwitch: 'Switch between sheet music and falling notes with the ♫ Sheet button.',
    grpListen: 'Listen', speed: 'Speed', speedNormal: 'Normal', speed75: 'Slower (75%)', speed50: 'Slow (50%)',
    listenPiano: 'Play on the piano’s own sound when it is connected',
    grpNoPiano: 'Without a piano', tapSound: 'Sound when tapping the screen keys',
    kbdHint: 'You can also play with a computer keyboard: A W S E D F T G Y H U J K = C to C, Z / X = octave down / up.',
    buttonsTitle: 'What the buttons do',
    buttonsHtml:
      '<li><b>Both / Right / Left</b> – practise both hands or one hand. The other hand’s notes are then not counted as mistakes.</li>' +
      '<li><b>↺ Restart</b> – start again from the beginning (or from the start of the loop).</li>' +
      '<li><b>✋ Fingers</b> – show or hide finger numbers (1 = thumb … 5 = little finger).</li>' +
      '<li><b>♫ Sheet</b> – sheet music (lit) or falling notes. Imported MIDI files always use falling notes.</li>' +
      '<li><b>▶︎ Listen</b> – hear the song from where you are; tap ■ to stop and play it yourself.</li>' +
      '<li><b>⟳ Loop</b> – repeat a hard part: tap at its first note, move the slider (or play on) to its last note, tap <i>Set end</i>. Tap Loop again to stop.</li>' +
      '<li><b>Slider</b> – start from any point in the song.</li>' +
      '<li><b>☰ Songs</b> – choose, add, edit, share and back up songs.</li>'
  },

  de: {
    songs: 'Stücke', noSong: 'Kein Stück geladen', starting: 'Startet…', settings: 'Einstellungen',
    both: 'Beide', right: 'Rechts', left: 'Links', hands: 'Hände',
    restart: ' Neustart', restartTitle: 'Von vorne beginnen',
    fingers: ' Finger', fingersTitle: 'Zeigen, welcher Finger welche Taste spielt',
    sheet: ' Noten', sheetTitle: 'Noten statt fallender Töne zeigen', sheetMidi: 'Noten gibt es nur für eingetippte Stücke',
    listen: ' Anhören', stop: ' Stopp', listenTitle: 'Das Stück zuerst anhören',
    loop: ' Schleife', loopRange: ' Schleife {a}–{b}', setEnd: ' Ende setzen', loopTitle: 'Einen Teil wiederholen: am Anfang tippen, zum Ende gehen, nochmal tippen',
    position: 'Position im Stück', loopShort: 'Schleife', mistakes: 'Fehler {n}', close: 'Schließen',
    hintChoose: 'Tippe auf „Stücke“, um ein Stück zu wählen', hintNoNotes: 'Dieses Stück hat keine Noten',
    hintNoLeft: 'Dieses Stück hat keine Noten für die linke Hand', hintNoRight: 'Dieses Stück hat keine Noten für die rechte Hand',
    hintListening: 'Hör zu … dann spiel es selbst',
    hintLoop: 'Schleife: Schieberegler (oder weiterspielen) bis zum letzten Schritt des Teils, dann „Ende setzen“ tippen',
    hintRound: 'Runde {n}: {result} – nochmal', roundClean: 'keine falsche Taste!', roundOne: '1 falsche Taste', roundMany: '{n} falsche Tasten',
    hintStart: 'Spiel die markierte Taste, um zu beginnen',
    sheetChoose: 'Wähle ein Stück, um seine Noten zu sehen.',
    sheetNoLib: 'Die Noten konnten nicht geladen werden. Prüfe die Internetverbindung und lade neu.',
    sheetFail: 'Dieses Stück kann noch nicht als Noten angezeigt werden.',
    midiNoBrowser: 'Dieser Browser kann kein MIDI lesen – nimm Chrome', midiBlocked: 'MIDI blockiert – über das Schloss-Symbol in der Adressleiste erlauben, dann neu laden',
    midiNone: 'Kein Klavier verbunden',
    wellDone: 'Gut gemacht!', resultSub: 'der Schritte ohne falsche Taste', resHands: 'Hände', resSteps: 'Schritte',
    resWrong: 'Falsche Tasten', resTime: 'Zeit', playAgain: 'Nochmal',
    handsB: 'beide Hände', handsR: 'rechte Hand', handsL: 'linke Hand',
    resPartial: 'Ab Schritt {n} gestartet, darum zählt dieser Durchgang nicht als Bestwert.',
    resFirst: 'Erster Wert gespeichert!', resNewBest: 'Neuer Bestwert! (vorher {p} %)', resBest: 'Dein Bestwert: {p} %',
    newSong: '+ Neues Stück', importMidi: 'MIDI-Datei importieren',
    noSongs: 'Noch keine Stücke. Lege eines an oder importiere eine MIDI-Datei.',
    metaSteps: '{n} Schritte', metaStep1: '1 Schritt', metaMidi: 'MIDI-Datei', metaTyped: 'eingetippt', metaBest: 'Bestwert {p} %', metaBestHands: 'Bestwert: {list}', metaPct: '{p} %',
    libHint: 'Tippe auf ein Stück, um es zu üben. ⋯ zum Bearbeiten, Teilen, Duplizieren oder Löschen.',
    starterSongs: 'Beispielstücke ({n})', moreActions: 'Mehr', moreActionsFor: 'Mehr zu „{t}“',
    shareLinkBtn: 'Als Link teilen', duplicate: 'Duplizieren', copyTitle: '{t} (Kopie)',
    practise: 'Üben', edit: 'Bearbeiten', rename: 'Umbenennen', share: 'Teilen', del: 'Löschen',
    songTitlePrompt: 'Titel des Stücks', confirmDelete: '„{t}“ löschen?',
    backupNote: 'Deine Stücke sind nur in diesem Browser gespeichert. Mach eine Sicherung oder teile alle mit einem anderen Gerät.',
    shareAll: 'Alle Stücke teilen', saveBackup: 'Sicherung speichern', restoreBackup: 'Sicherung wiederherstellen',
    linkCopied: 'Link kopiert. Öffne ihn auf einem anderen Gerät, um {what} dort hinzuzufügen.', copyLink: 'Diesen Link kopieren:',
    theseSongs: 'diese {n} Stücke', nSongs: '{n} Stücke', allSongsTitle: 'Pliktra-Stücke',
    noTypedSongs: 'Es gibt noch keine eingetippten Stücke zum Teilen.',
    linkDamaged: 'Dieser Link ist beschädigt.', backupDamaged: 'Das ist keine Pliktra-Sicherung, oder sie ist beschädigt.',
    songHasMistakes: '„{t}“ enthält Fehler und kann nicht hinzugefügt werden.',
    askAdd: '{names} zu deinen Stücken hinzufügen', askUpdate: '{names} mit der Version aus {src} aktualisieren', askUpdateLower: '{names} mit der Version aus {src} aktualisieren',
    srcLink: 'dem Link', srcBackup: 'der Sicherung', and: ' und ', backupSame: 'Alle Stücke aus dieser Sicherung sind schon da.',
    quote: '„{t}“', sharedSong: 'Geteiltes Stück', storageFull: 'Der Speicher dieses Geräts für die App ist voll. Lösche ein langes Stück und versuche es nochmal.',
    editor: 'Stück bearbeiten', title: 'Titel', titlePh: 'z. B. Ode an die Freude', notes: 'Noten',
    record: '● Vom Klavier aufnehmen', stopRecord: '■ Aufnahme stoppen', clear: 'Leeren', cancel: 'Abbrechen', savePractise: 'Speichern & üben',
    edInfo: '{n} Schritte · {hands}', moreErrors: '…und {n} weitere', addNotes: 'Füge zuerst Noten hinzu.', untitled: 'Stück ohne Titel',
    confirmClear: 'Alle Noten löschen?', confirmCloseEditor: 'Editor schließen, ohne zu speichern?',
    howTo: 'So schreibst du Noten',
    helpHtml:
      '<li>Notennamen werden mit <b>englischen Buchstaben</b> geschrieben: <code>B</code> ist das deutsche <b>H</b>, <code>Bb</code> das deutsche <b>B</b>. <code>H</code> geht auch.</li>' +
      '<li>Ein Schritt pro Wort: <code>C4 D4 E4</code>. Die Zahl ist die Oktave; <code>C4</code> ist das mittlere C.</li>' +
      '<li>Kreuz und b: <code>F#4</code> (Fis), <code>Eb4</code> (Es), <code>Bb3</code> (B).</li>' +
      '<li>Tasten, die zusammen gespielt werden (Akkord): mit <code>+</code> verbinden, z. B. <code>C4+E4+G4</code>.</li>' +
      '<li>Hände: Noten unter dem mittleren C spielt die linke Hand, die anderen die rechte. Eine Hand erzwingen mit <code>L:</code> oder <code>R:</code>, z. B. <code>L:C4+R:E4</code>.</li>' +
      '<li>Finger: <code>/</code> und den Finger nach der Note: <code>E4/3</code>, <code>G3/4+B3/2</code>. 1 = Daumen, 2 = Zeigefinger, 3 = Mittelfinger, 4 = Ringfinger, 5 = kleiner Finger (gleiche Zahlen für beide Hände).</li>' +
      '<li>Länge in Schlägen: <code>C4_2</code> = 2 Schläge, <code>G4_0.5</code> = ein halber Schlag (1 Schlag = eine Viertelnote). <code>-</code> ist eine Pause, <code>-_2</code> eine Pause von 2 Schlägen.</li>' +
      '<li>Taktart: zuerst schreiben, z. B. <code>3/4</code> oder <code>6/8</code> (sonst 4/4). Sie bestimmt die Takte in den Noten.</li>' +
      '<li>Taktstriche <code>|</code> und alles nach <code>//</code> werden ignoriert.</li>' +
      '<li><b>Vom Klavier aufnehmen</b> fügt das, was du auf dem Klavier spielst, am Ende des Textes an.</li>',
    errLength: '„{tok}“: nach _ muss eine Zahl stehen', errMeterPos: '„{tok}“: eine Taktart darf nur am Anfang stehen',
    errMeter: '„{tok}“ ist keine Taktart', errFinger: '„{tok}“: der Finger nach / muss 1 bis 5 sein', errNote: '„{tok}“ ist keine Note auf dem Klavier',
    importTitle: 'MIDI-Datei importieren', importHelp: 'Wähle, welche Hand jede Spur der Datei spielt.',
    part: 'Spur', range: 'Umfang', hand: 'Hand', rightHand: 'Rechte Hand', leftHand: 'Linke Hand', split: 'Am mittleren C teilen', skip: 'Weglassen',
    importedSong: 'Importiertes Stück', midiReadFail: 'Diese MIDI-Datei konnte nicht gelesen werden.', midiNoNotes: 'In dieser Datei wurden keine Klaviernoten gefunden.',
    notMidi: 'Das ist keine MIDI-Datei.', midiDamaged: 'Die MIDI-Datei scheint beschädigt zu sein.', chooseHand: 'Wähle für mindestens eine Spur eine Hand.',
    language: 'Sprache', langAuto: 'Automatisch (Gerätesprache)',
    grpKeyboard: 'Tastatur auf dem Bildschirm', keyNames: 'Notennamen auf den Tasten',
    namesAll: 'Alle weißen Tasten', namesC: 'Nur C-Tasten (C3, C4 …)', namesOff: 'Aus',
    size: 'Größe', sizeFit: 'An das Stück anpassen (größere Tasten)', sizeFull: 'Alle 88 Tasten',
    grpLane: 'Ansicht „fallende Töne“', laneNames: 'Notennamen auf den fallenden Tönen',
    laneSwitch: 'Mit dem Knopf ♫ Noten wechselst du zwischen Noten und fallenden Tönen.',
    grpListen: 'Anhören', speed: 'Tempo', speedNormal: 'Normal', speed75: 'Langsamer (75 %)', speed50: 'Langsam (50 %)',
    listenPiano: 'Mit dem Klang des Klaviers abspielen, wenn es verbunden ist',
    grpNoPiano: 'Ohne Klavier', tapSound: 'Ton beim Tippen auf die Bildschirmtasten',
    kbdHint: 'Du kannst auch mit einer Computertastatur spielen: A W S E D F T G Z H U J K = C bis C, Y / X = Oktave runter / hoch.',
    buttonsTitle: 'Was die Knöpfe tun',
    buttonsHtml:
      '<li><b>Beide / Rechts / Links</b> – beide Hände oder eine Hand üben. Die Noten der anderen Hand zählen dann nicht als Fehler.</li>' +
      '<li><b>↺ Neustart</b> – von vorne beginnen (oder vom Anfang der Schleife).</li>' +
      '<li><b>✋ Finger</b> – Fingersatz zeigen oder ausblenden (1 = Daumen … 5 = kleiner Finger).</li>' +
      '<li><b>♫ Noten</b> – Noten (leuchtet) oder fallende Töne. Importierte MIDI-Dateien zeigen immer fallende Töne.</li>' +
      '<li><b>▶︎ Anhören</b> – das Stück ab der aktuellen Stelle hören; ■ tippen, um zu stoppen und selbst zu spielen.</li>' +
      '<li><b>⟳ Schleife</b> – eine schwere Stelle wiederholen: bei ihrer ersten Note tippen, mit dem Schieberegler (oder weiterspielen) zur letzten Note gehen, <i>Ende setzen</i> tippen. Nochmal Schleife tippen zum Beenden.</li>' +
      '<li><b>Schieberegler</b> – an jeder Stelle im Stück beginnen.</li>' +
      '<li><b>☰ Stücke</b> – Stücke wählen, hinzufügen, bearbeiten, teilen und sichern.</li>'
  }
};

// Built-in song titles shown in the user's language (stored titles stay English so updates still match).
var BUILTIN_TITLES = {
  de: {
    'C major scale (both hands)': 'C-Dur-Tonleiter (beide Hände)',
    'Ode to Joy (right hand)': 'Ode an die Freude (rechte Hand)',
    'Twinkle Twinkle (both hands)': 'Twinkle Twinkle Little Star (beide Hände)',
    'Jingle Bells (chorus, both hands)': 'Jingle Bells (Refrain, beide Hände)'
  }
};

var LANG = 'en';

function pickLang(setting) {
  if (setting && I18N[setting]) return setting;
  var list = (typeof navigator !== 'undefined' && (navigator.languages || [navigator.language])) || [];
  for (var i = 0; i < list.length; i++) {
    var code = String(list[i] || '').slice(0, 2).toLowerCase();
    if (I18N[code]) return code;
  }
  return 'en';
}

function t(key, vars) {
  var s = (I18N[LANG] && I18N[LANG][key]) || I18N.en[key];
  if (s == null) return key;
  if (vars) s = s.replace(/\{(\w+)\}/g, function (all, k) { return vars[k] != null ? vars[k] : all; });
  return s;
}

// Note names for display. German: B = H, Bb = B, sharps -is, flats -es (Fis, Es, As, Des...).
function localNoteName(name) {
  if (LANG !== 'de') return name;
  var r = /^([A-G])([#b]?)(-?\d*)$/.exec(name);
  if (!r) return name;
  var L = r[1], acc = r[2], base;
  if (acc === '#') base = (L === 'B' ? 'H' : L) + 'is';
  else if (acc === 'b') base = L === 'B' ? 'B' : L === 'E' ? 'Es' : L === 'A' ? 'As' : L + 'es';
  else base = L === 'B' ? 'H' : L;
  return base + r[3];
}

// Fills the page's fixed texts: data-i18n (text), data-i18n-html, -title, -aria (aria-label), -ph (placeholder).
function applyI18n(root) {
  root = root || document;
  document.documentElement.lang = LANG;
  root.querySelectorAll('[data-i18n]').forEach(function (e) { e.textContent = t(e.getAttribute('data-i18n')); });
  root.querySelectorAll('[data-i18n-html]').forEach(function (e) { e.innerHTML = t(e.getAttribute('data-i18n-html')); });
  root.querySelectorAll('[data-i18n-title]').forEach(function (e) { e.title = t(e.getAttribute('data-i18n-title')); });
  root.querySelectorAll('[data-i18n-aria]').forEach(function (e) { e.setAttribute('aria-label', t(e.getAttribute('data-i18n-aria'))); });
  root.querySelectorAll('[data-i18n-ph]').forEach(function (e) { e.placeholder = t(e.getAttribute('data-i18n-ph')); });
}

if (typeof module !== 'undefined') {
  module.exports = { I18N: I18N, LANGS: LANGS, t: t, localNoteName: localNoteName, pickLang: pickLang,
    setLang: function (l) { LANG = l; } };
}
