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
    // sheet music symbols (js/explain.js)
    sym_notew: 'Whole note',
    sym_noteh: 'Half note',
    sym_notehd: 'Dotted half note',
    sym_noteq: 'Quarter note',
    sym_noteqd: 'Dotted quarter note',
    sym_note8: 'Eighth note',
    sym_note8d: 'Dotted eighth note',
    sym_note16: 'Sixteenth note',
    sym_note16d: 'Dotted sixteenth note',
    sym_note32: 'Thirty-second note',
    sym_restw: 'Whole rest',
    sym_resth: 'Half rest',
    sym_resthd: 'Dotted half rest',
    sym_restq: 'Quarter rest',
    sym_restqd: 'Dotted quarter rest',
    sym_rest8: 'Eighth rest',
    sym_rest8d: 'Dotted eighth rest',
    sym_rest16: 'Sixteenth rest',
    sym_rest16d: 'Dotted sixteenth rest',
    sym_rest32: 'Thirty-second rest',
    chordTitle: 'Chord: {n} notes',
    chordLine: '{name} – press all {n} keys at the same time.',
    lastsBeat1: 'Lasts {n} beat.',
    lastsBeats: 'Lasts {n} beats.',
    silentBeat1: 'Silence for {n} beat.',
    silentBeats: 'Silence for {n} beats.',
    dotRule: 'The dot adds half the length: {a} + {b} = {c} beats.',
    noteLine: '{name}: {pos}',
    fingerPart: ', finger {f}',
    middleC: 'middle C',
    posLine: 'line {n} from the bottom',
    posSpace: 'space {n} from the bottom',
    posJustBelow: 'just below the staff',
    posJustAbove: 'just above the staff',
    posLedgerBelow: 'on ledger line {n} below the staff',
    posBelowLedger: 'below ledger line {n} (under the staff)',
    posLedgerAbove: 'on ledger line {n} above the staff',
    posAboveLedger: 'above ledger line {n} (over the staff)',
    fingerInfo: 'Finger numbers: 1 = thumb, 2 = index, 3 = middle, 4 = ring, 5 = little finger.',
    ledgerInfo: 'Ledger lines are short extra lines for notes too high or too low for the five lines.',
    accSharp: '♯ Sharp: play the next key to the right (a half step higher). It counts until the end of the bar.',
    accFlat: '♭ Flat: play the next key to the left (a half step lower). It counts until the end of the bar.',
    accNatural: '♮ Natural: cancels a ♯ or ♭ (from the key signature or earlier in the bar) until the end of the bar. Play the white key.',
    accCarry: 'No ♯ or ♭ in front of it: the one from earlier in this bar still counts.',
    accCarryNat: 'No sign in front of it: the ♮ from earlier in this bar still counts.',
    accKey: '{sig} from the key signature: every {l} is played as {name}.',
    tieStart: 'A tie (curved line) joins it to the next note of the same pitch: play once and hold for both lengths together.',
    tieEnd: 'The tie (curved line) joins it to the note before: keep holding the key, don’t play it again.',
    beamInfo: 'Short notes are joined by a beam (the thick line) instead of separate flags, so the beats are easy to see.',
    handLineR: 'Right hand: upper staff (treble clef).',
    handLineL: 'Left hand: lower staff (bass clef).',
    restBar: 'A whole rest in an otherwise empty bar means: silent for the whole bar, in any time signature.',
    clefT: 'Treble clef (G clef)',
    clefTInfo: 'Its curl circles the 2nd line from the bottom: notes on that line are {n}, the G above middle C. Usually for the right hand.',
    clefB: 'Bass clef (F clef)',
    clefBInfo: 'Its two dots sit around the 4th line from the bottom: notes on that line are {n}, the F below middle C. Usually for the left hand.',
    timeT: 'Time signature {a}/{b}',
    timeName: 'Time signature',
    timeTop: 'Top number: {a} beats in every bar.',
    timeBottom4: 'Bottom number 4: a quarter note is one beat.',
    timeBottom8: 'Bottom number 8: an eighth note is one beat.',
    timeBottom2: 'Bottom number 2: a half note is one beat.',
    timeBottom16: 'Bottom number 16: a sixteenth note is one beat.',
    timeCount: 'Count: {c}',
    timeGloss: 'Top number: beats in every bar. Bottom number: which note is one beat (4 = quarter note).',
    keyT: 'Key signature: {k}',
    keySigT: 'Key signature',
    keyMajor: '{k} major',
    keyMinor: '{k} minor',
    keyLine: '{n} {sig} right after the clef: play {list}.',
    keyAs: '{a} as {b}',
    keyAll: 'This counts in every octave until the end of the piece, so the {sig} isn’t written in front of these notes again.',
    keyCancel: 'A ♮ in front of a note cancels it until the end of the bar.',
    keyPairInfo: '{n} {sig}: the key signature of {maj} and {min}.',
    keyOrderSharp: 'The ♯ always come in this order: F♯ C♯ G♯ D♯ A♯ E♯ B♯.',
    keyOrderFlat: 'The ♭ always come in this order: B♭ E♭ A♭ D♭ G♭ C♭ F♭.',
    keyGloss: '♯ or ♭ right after the clef count for the whole piece, in every octave. Here: every F is played as F♯ (G major).',
    keyCheck: 'Not as in the key signature ({k}): {list}. The sheet music shows a ♯, ♭ or ♮ in front of them – check them against your book.',
    barT: 'Bar line',
    barInfo: 'Divides the music into bars of {n} beats each.',
    barGloss: 'Divides the music into bars. Each bar has as many beats as the time signature says.',
    endT: 'Final bar line',
    endInfo: 'The end of the piece.',
    braceT: 'Grand staff',
    braceInfo: 'The brace joins the two staves: upper for the right hand, lower for the left. Notes above each other are played at the same time.',
    tieT: 'Tie',
    sharpT: 'Sharp',
    flatT: 'Flat',
    naturalT: 'Natural',
    ledgerT: 'Ledger line (here: middle C)',
    fingerT: 'Finger numbers',
    symbolsTitle: 'What the symbols mean',
    symbolsIntro: 'Tip: in the sheet music view, tap any symbol to see what it means.',
    explainPlay: 'Play',
    groupLabel: 'Book or group (optional)', groupPh: 'e.g. Piano book 1', shareGroup: 'Share this group as a link',
    shareLinkBtn: 'Share as link', duplicate: 'Duplicate', copyTitle: '{t} (copy)',
    edit: 'Edit', rename: 'Rename', del: 'Delete',
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
      '<li>Key signature: also at the start, e.g. <code>key:G</code> (1 ♯), <code>key:F</code> (1 ♭), or by number: <code>key:2#</code>, <code>key:3b</code>. The sheet music then shows the ♯/♭ once after the clef, like your book. Still write every note as it is played: in G major, every F is <code>F#</code>.</li>' +
      '<li>Bar lines <code>|</code> and anything after <code>//</code> are ignored.</li>' +
      '<li><b>Record from piano</b> adds what you play on the piano to the end of the text.</li>',
    // parser errors
    errLength: '"{tok}": the length after _ must be a number', errMeterPos: '"{tok}": a time signature can only be at the start',
    errMeter: '"{tok}" is not a time signature', errKeyPos: '"{tok}": a key signature can only be at the start',
    errKey: '"{tok}" is not a key signature (e.g. key:G, key:F, key:2#)', errFinger: '"{tok}": the finger after / must be 1 to 5', errNote: '"{tok}" is not a note on the piano',
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
    // sheet music symbols (js/explain.js)
    sym_notew: 'Ganze Note',
    sym_noteh: 'Halbe Note',
    sym_notehd: 'Punktierte halbe Note',
    sym_noteq: 'Viertelnote',
    sym_noteqd: 'Punktierte Viertelnote',
    sym_note8: 'Achtelnote',
    sym_note8d: 'Punktierte Achtelnote',
    sym_note16: 'Sechzehntelnote',
    sym_note16d: 'Punktierte Sechzehntelnote',
    sym_note32: 'Zweiunddreißigstelnote',
    sym_restw: 'Ganze Pause',
    sym_resth: 'Halbe Pause',
    sym_resthd: 'Punktierte halbe Pause',
    sym_restq: 'Viertelpause',
    sym_restqd: 'Punktierte Viertelpause',
    sym_rest8: 'Achtelpause',
    sym_rest8d: 'Punktierte Achtelpause',
    sym_rest16: 'Sechzehntelpause',
    sym_rest16d: 'Punktierte Sechzehntelpause',
    sym_rest32: 'Zweiunddreißigstelpause',
    chordTitle: 'Akkord: {n} Töne',
    chordLine: '{name} – alle {n} Tasten gleichzeitig anschlagen.',
    lastsBeat1: 'Dauert {n} Schlag.',
    lastsBeats: 'Dauert {n} Schläge.',
    silentBeat1: 'Stille für {n} Schlag.',
    silentBeats: 'Stille für {n} Schläge.',
    dotRule: 'Der Punkt verlängert um die Hälfte: {a} + {b} = {c} Schläge.',
    noteLine: '{name}: {pos}',
    fingerPart: ', Finger {f}',
    middleC: 'mittleres C',
    posLine: '{n}. Linie von unten',
    posSpace: '{n}. Zwischenraum von unten',
    posJustBelow: 'direkt unter den Notenlinien',
    posJustAbove: 'direkt über den Notenlinien',
    posLedgerBelow: 'auf der {n}. Hilfslinie unten',
    posBelowLedger: 'unter der {n}. Hilfslinie (unten)',
    posLedgerAbove: 'auf der {n}. Hilfslinie oben',
    posAboveLedger: 'über der {n}. Hilfslinie (oben)',
    fingerInfo: 'Fingersatz: 1 = Daumen, 2 = Zeigefinger, 3 = Mittelfinger, 4 = Ringfinger, 5 = kleiner Finger.',
    ledgerInfo: 'Hilfslinien sind kurze Extralinien für Töne, die zu hoch oder zu tief für die fünf Notenlinien sind.',
    accSharp: '♯ Kreuz: die nächste Taste rechts spielen (einen Halbton höher). Gilt bis zum Ende des Takts.',
    accFlat: '♭ Be: die nächste Taste links spielen (einen Halbton tiefer). Gilt bis zum Ende des Takts.',
    accNatural: '♮ Auflösungszeichen: hebt ein ♯ oder ♭ (aus den Vorzeichen oder von vorher im Takt) bis zum Ende des Takts auf. Die weiße Taste spielen.',
    accCarry: 'Kein ♯ oder ♭ davor: das Zeichen von vorher in diesem Takt gilt noch.',
    accCarryNat: 'Kein Zeichen davor: das ♮ von vorher in diesem Takt gilt noch.',
    accKey: '{sig} aus den Vorzeichen: jedes {l} wird als {name} gespielt.',
    tieStart: 'Ein Haltebogen verbindet sie mit der nächsten gleichen Note: einmal anschlagen und beide Längen zusammen halten.',
    tieEnd: 'Der Haltebogen verbindet sie mit der Note davor: Taste weiter halten, nicht neu anschlagen.',
    beamInfo: 'Kurze Noten werden mit einem Balken (dicker Strich) statt einzelner Fähnchen verbunden, so sieht man die Schläge besser.',
    handLineR: 'Rechte Hand: oberes System (Violinschlüssel).',
    handLineL: 'Linke Hand: unteres System (Bassschlüssel).',
    restBar: 'Eine ganze Pause in einem sonst leeren Takt heißt: der ganze Takt ist still, in jeder Taktart.',
    clefT: 'Violinschlüssel (G-Schlüssel)',
    clefTInfo: 'Seine Schnecke umkreist die 2. Linie von unten: Noten auf dieser Linie sind {n}, das G über dem mittleren C. Meist für die rechte Hand.',
    clefB: 'Bassschlüssel (F-Schlüssel)',
    clefBInfo: 'Seine zwei Punkte umrahmen die 4. Linie von unten: Noten auf dieser Linie sind {n}, das F unter dem mittleren C. Meist für die linke Hand.',
    timeT: 'Taktart {a}/{b}',
    timeName: 'Taktart',
    timeTop: 'Obere Zahl: {a} Schläge in jedem Takt.',
    timeBottom4: 'Untere Zahl 4: eine Viertelnote ist ein Schlag.',
    timeBottom8: 'Untere Zahl 8: eine Achtelnote ist ein Schlag.',
    timeBottom2: 'Untere Zahl 2: eine halbe Note ist ein Schlag.',
    timeBottom16: 'Untere Zahl 16: eine Sechzehntelnote ist ein Schlag.',
    timeCount: 'Zählen: {c}',
    timeGloss: 'Obere Zahl: Schläge pro Takt. Untere Zahl: welche Note ein Schlag ist (4 = Viertelnote).',
    keyT: 'Vorzeichen: {k}',
    keySigT: 'Vorzeichen (Tonart)',
    keyMajor: '{k}-Dur',
    keyMinor: '{k}-Moll',
    keyLine: '{n} {sig} direkt nach dem Schlüssel: spiele {list}.',
    keyAs: '{a} als {b}',
    keyAll: 'Das gilt in jeder Oktave bis zum Ende des Stücks, deshalb steht das {sig} nicht noch einmal vor diesen Noten.',
    keyCancel: 'Ein ♮ vor einer Note hebt es bis zum Ende des Takts auf.',
    keyPairInfo: '{n} {sig}: die Vorzeichen von {maj} und {min}.',
    keyOrderSharp: 'Die ♯ kommen immer in dieser Reihenfolge: Fis Cis Gis Dis Ais Eis His.',
    keyOrderFlat: 'Die ♭ kommen immer in dieser Reihenfolge: B Es As Des Ges Ces Fes.',
    keyGloss: '♯ oder ♭ direkt nach dem Schlüssel gelten für das ganze Stück, in jeder Oktave. Hier: jedes F wird als Fis gespielt (G-Dur).',
    keyCheck: 'Anders als die Vorzeichen ({k}): {list}. Die Noten zeigen davor ein ♯, ♭ oder ♮ – vergleiche sie mit deinem Buch.',
    barT: 'Taktstrich',
    barInfo: 'Teilt die Musik in Takte mit je {n} Schlägen.',
    barGloss: 'Teilt die Musik in Takte. Jeder Takt hat so viele Schläge, wie die Taktart sagt.',
    endT: 'Schlussstrich',
    endInfo: 'Das Ende des Stücks.',
    braceT: 'Klaviersystem',
    braceInfo: 'Die Klammer verbindet die beiden Systeme: oben die rechte Hand, unten die linke. Noten übereinander werden gleichzeitig gespielt.',
    tieT: 'Haltebogen',
    sharpT: 'Kreuz',
    flatT: 'Be',
    naturalT: 'Auflösungszeichen',
    ledgerT: 'Hilfslinie (hier: mittleres C)',
    fingerT: 'Fingersatz',
    symbolsTitle: 'Was die Zeichen bedeuten',
    symbolsIntro: 'Tipp: Tippe in der Notenansicht auf ein Zeichen, um zu sehen, was es bedeutet.',
    explainPlay: 'Abspielen',
    groupLabel: 'Buch oder Gruppe (optional)', groupPh: 'z. B. Klavierschule 1', shareGroup: 'Diese Gruppe als Link teilen',
    shareLinkBtn: 'Als Link teilen', duplicate: 'Duplizieren', copyTitle: '{t} (Kopie)',
    edit: 'Bearbeiten', rename: 'Umbenennen', del: 'Löschen',
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
      '<li>Vorzeichen: auch am Anfang, z. B. <code>key:G</code> (1 ♯, G-Dur), <code>key:F</code> (1 ♭, F-Dur), <code>key:Bb</code> (B-Dur) oder nach Anzahl: <code>key:2#</code>, <code>key:3b</code>. Die Noten zeigen die ♯/♭ dann einmal nach dem Schlüssel, wie im Buch. Trotzdem jede Note so schreiben, wie sie gespielt wird: in G-Dur ist jedes F ein <code>F#</code> (Fis).</li>' +
      '<li>Taktstriche <code>|</code> und alles nach <code>//</code> werden ignoriert.</li>' +
      '<li><b>Vom Klavier aufnehmen</b> fügt das, was du auf dem Klavier spielst, am Ende des Textes an.</li>',
    errLength: '„{tok}“: nach _ muss eine Zahl stehen', errMeterPos: '„{tok}“: eine Taktart darf nur am Anfang stehen',
    errMeter: '„{tok}“ ist keine Taktart', errKeyPos: '„{tok}“: Vorzeichen dürfen nur am Anfang stehen',
    errKey: '„{tok}“ ist keine Tonart (z. B. key:G, key:F, key:2#)', errFinger: '„{tok}“: der Finger nach / muss 1 bis 5 sein', errNote: '„{tok}“ ist keine Note auf dem Klavier',
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

// Key names for display: "G" -> "G major" / "G-Dur", "F#m" -> "F♯ minor" / "fis-Moll", "Bb" -> "B♭ major" / "B-Dur".
function localKeyName(key) {
  var r = /^([A-G])([#b]?)(m?)$/.exec(key);
  if (!r) return key;
  var root = localNoteName(r[1] + r[2]);
  if (root === r[1] + r[2]) root = r[1] + (r[2] === '#' ? '♯' : r[2] === 'b' ? '♭' : '');
  if (r[3] && LANG === 'de') root = root.toLowerCase();   // German writes minor keys in lower case: e-Moll
  return t(r[3] ? 'keyMinor' : 'keyMajor', { k: root });
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
  module.exports = { I18N: I18N, LANGS: LANGS, t: t, localNoteName: localNoteName, localKeyName: localKeyName, pickLang: pickLang,
    setLang: function (l) { LANG = l; } };
}
