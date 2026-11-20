# Pliktra

*Pliktra* (πλήκτρα) is Greek for "keys". It is a simple "wait mode" piano trainer.

**Open it:** https://dimantonak.github.io/pliktra/

Connect a digital piano or MIDI keyboard, pick a song,
and the app highlights the next key(s) to play and waits until you play them.

## What you need

- A digital piano or keyboard with **USB MIDI** (most modern ones have a "USB to host" / "USB computer" port).
- A device with a browser that supports **Web MIDI**: Chrome, Edge or another Chromium-based browser
  on Android, Windows, macOS, Linux or ChromeOS.
  Safari (iPhone, iPad, Mac) does not support Web MIDI.
- A USB cable. Phones and tablets need a USB-OTG cable or adapter.

Open the link, connect the piano and allow MIDI access when the browser asks.
The pill at the top right shows the piano's name when it is connected.

Without a piano you can tap the on-screen keys or use a computer keyboard
(`A W S E D F T G Y H U J K` = C to C, `Z`/`X` = octave down/up).

## Songs

- **Typed songs**: `C4 D4 E4`, chords `C4+E4+G4`, force a hand with `L:` / `R:`,
  fingers `E4/3`, lengths `C4_2`, rests `-`, time signature `3/4` at the start.
  Full help is in the song editor.
- **Key signatures**: write e.g. `key:G` (or `key:F`, `key:2#`, `key:3b`) at the start, and the sheet
  music shows the ♯/♭ once after the clef, like a printed book. Notes are still written as they are played
  (in G major every F is `F#`); the editor points out notes that don't match the key signature,
  which is often a forgotten ♯ or ♭.
- **Pickup (upbeat)**: if the music starts before the first full bar, write e.g. `pickup:1` at the start;
  the sheet music then begins with a short bar.
- **Starter songs** (public domain, simple arrangements written for Pliktra): C major scale, Ode to Joy,
  Twinkle Twinkle, Jingle Bells, Happy Birthday, Frère Jacques, Row Row Row Your Boat,
  Minuet in G (Petzold) and the opening of Für Elise.
- **Record from piano**: in the editor, press *Record from piano* and play; notes are typed for you.
- **MIDI files** (`.mid`): import from the Songs screen and choose which hand plays each part.
- **Song list**: tap a song to practise it; the songs you played most recently are at the top.
  The starter songs are folded away once you have your own. **⋯** next to a song edits, shares,
  duplicates (e.g. to make an easier version) or deletes it.
- **Groups**: give songs a book or group name (in the editor or under ⋯), e.g. one per lesson book.
  Each group is a foldable section with *Share this group as a link*; the songs arrive grouped on the other device.
- **Song links**: *⋯ → Share as link* on a typed song makes a link; opening it on another device adds the song there.
  The song is inside the link itself (after `#`), so it is never stored on the website or in this repository.

Songs, settings and best scores are saved in the browser on that device (localStorage).
In the Songs screen you can **share all songs** as one link, **save a backup file** (all songs and best scores)
and **restore** it later or on another device.

## Practice views

- **♫ Sheet** (default): the song as sheet music (grand staff). The notes to play are coloured
  (blue = right hand, orange = left hand), played notes fade, and the score scrolls along.
  Each hand's rhythm comes from the song text: a note lasts until that hand's next note,
  a rest or the bar line. Available for typed songs.
- **Learn the symbols**: in the sheet music, tap any note, rest, clef, key or time signature or bar line
  (or point at it with a mouse). A card explains it: its name, how many beats it lasts, where the
  note sits on the staff, ♯/♭/♮, ties, finger numbers. The note's keys light up on the keyboard,
  and *Play* lets you hear it. *Settings → What the symbols mean* lists them all with pictures.
- **Note reading** (Songs → *Note reading*): 8 levels of endless drills, from the landmark notes (C3, F3,
  middle C, G4, C5) to both staves, ledger lines and key signatures. Every round is 16 fresh notes, so it
  can't be learnt by heart; it always uses the sheet music and reading mode. The result lists the notes you
  missed, and *Practise these notes* makes a round with more of them.
- **Lessons** (Songs → *Lessons*): eight short lessons, one skill each: finding your way on the keyboard,
  the five-finger position, holding notes, loud and soft, alternating hands, thumb under, the scale in
  contrary motion, and major and minor chords. Each lesson is a row of small steps:
  - *cards* explain the skill, with a keyboard picture (the keys you press light up in it) and *Listen*;
    some ask you to find keys on your piano (e.g. every C);
  - *play steps* are short pieces, from a few notes to a little piece at the end. A step is passed at 80%
    right first time, plus its own check: long notes held to the end (the app notices a key let go too
    early), or loud and soft clearly different (this needs a piano connected by USB, which tells how
    strongly each key was struck; the result shows it as a chart).
  ○ not started, ◐ started, ✓ learnt (every play step passed). The *Lesson* button at the top opens the
  steps again; lessons are played in wait mode. The fingers and the hand shape can't be checked – the
  lessons show and explain them.
- **Reading mode** (👁 Read, with the sheet music): the screen keyboard no longer shows which key to play,
  so you read the notes from the sheet music instead. After a wrong key the right one lights up; tapping a
  note in the score shows its keys too.
- **Falling notes** (tap ♫ Sheet to switch): notes fall onto the keys; the app waits for the right keys.
  Imported MIDI files are always shown this way.
- **Note names** are shown on all white keys; in Settings you can reduce them to the C keys or turn them off.
- **✋ Fingers**: finger numbers (1 = thumb … 5 = little finger) on notes, keys and score.
- **▶ Listen**: plays the song (the hands you are practising) from the current position, on the piano's
  own sound when it is connected, otherwise through the device. Speed can be lowered in Settings.
- **⟳ Loop**: repeat a hard part. Tap Loop at its first step, move the slider (or play on) to its last step
  and tap *Set end*. Each round shows your wrong keys; tap Loop again to stop.
- **Tempo (play along)**: choose 40, 60, 80 or 100% of the speed. Press any key for a one-bar count-in; then
  the music runs on and doesn't wait. Every note counts as in time, a bit early or late, or missed; the result
  shows a timing score, with a best score per speed. Optional metronome; when you practise one hand, the app
  can play the other one. With a loop, each round shows its score. *Off (wait)* is the usual wait mode.

## Languages

English and German (Deutsch). Pliktra follows the device's language; change it in ⚙ Settings → *Language / Sprache*.
In German, note names on the keys use German names (H for B, B for B♭, Fis, Es …).
Songs are always typed with English letters (`B4`, `Bb4`; `H4` also works), so song links work in every language.

To add a language, copy the `en` block in `js/i18n.js`, translate it and add it to `LANGS` and the Settings menu;
`node --test tests/` checks that no text is missing.

## Install / offline

On the website, use the browser's *Install app* or *Add to Home screen*. Pliktra then opens like an app
and also works without internet (the newest version is loaded whenever you are online).

## Files

- `index.html`, `styles.css` - page and layout
- `js/app.js` - MIDI input, practice logic, drawing, song library/editor/import
- `js/i18n.js` - texts in English and German, German note names
- `js/notation.js` - note names, typed-song parser, grouping notes into steps
- `js/midifile.js` - `.mid` file reader
- `js/sheet.js` - sheet music view (lays out bars and rests, draws with VexFlow)
- `js/explain.js` - explanations of the sheet music symbols (tap a symbol)
- `js/drills.js` - note reading drills (generates the rounds)
- `js/lessons.js` - the lessons: their steps, the keyboard pictures, the checks (held notes, loud and soft)
- `js/tempo.js` - play along: count-in clicks, timing of each key, score
- `vendor/vexflow/` - [VexFlow](https://www.vexflow.com) 4.2.5 with the Bravura music font
- `sw.js`, `manifest.webmanifest`, `icons/` - offline use and installing as an app
- `tests/` - automated tests: `node --test tests/`

No build step and no dependencies to install: plain HTML + JavaScript.
To host your own copy, put the folder on any https web host (e.g. GitHub Pages);
browsers only allow MIDI on secure pages.

## Licence

© 2026 Dimitris Antonakis. Licensed under
[Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/);
see [LICENSE](LICENSE). You may reuse and adapt it, including commercially, as long as you give credit.

Sheet music is drawn with VexFlow, © 2010 Mohit Muthanna Cheppudira, MIT licence
(see [vendor/vexflow/LICENSE](vendor/vexflow/LICENSE)). Its Bravura music font, © Steinberg Media Technologies GmbH,
is under the SIL Open Font License 1.1 (see [vendor/vexflow/BRAVURA-FONT-LICENSE.txt](vendor/vexflow/BRAVURA-FONT-LICENSE.txt)).
