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
- **Record from piano**: in the editor, press *Record from piano* and play; notes are typed for you.
- **MIDI files** (`.mid`): import from the Songs screen and choose which hand plays each part.
- **Song links**: *Share* on a typed song makes a link; opening it on another device adds the song there.
  The song is inside the link itself (after `#`), so it is never stored on the website or in this repository.

Songs, settings and best scores are saved in the browser on that device (localStorage).
In the Songs screen you can **share all songs** as one link, **save a backup file** (all songs and best scores)
and **restore** it later or on another device.

## Practice views

- **♫ Sheet** (default): the song as sheet music (grand staff). The notes to play are coloured
  (blue = right hand, orange = left hand), played notes fade, and the score scrolls along.
  Each hand's rhythm comes from the song text: a note lasts until that hand's next note,
  a rest or the bar line. Available for typed songs.
- **Falling notes** (tap ♫ Sheet to switch): notes fall onto the keys; the app waits for the right keys.
  Imported MIDI files are always shown this way.
- **Note names** are shown on all white keys; in Settings you can reduce them to the C keys or turn them off.
- **✋ Fingers**: finger numbers (1 = thumb … 5 = little finger) on notes, keys and score.
- **▶ Listen**: plays the song (the hands you are practising) from the current position, on the piano's
  own sound when it is connected, otherwise through the device. Speed can be lowered in Settings.
- **⟳ Loop**: repeat a hard part. Tap Loop at its first step, move the slider (or play on) to its last step
  and tap *Set end*. Each round shows your wrong keys; tap Loop again to stop.

## Install / offline

On the website, use the browser's *Install app* or *Add to Home screen*. Pliktra then opens like an app
and also works without internet (the newest version is loaded whenever you are online).

## Files

- `index.html`, `styles.css` - page and layout
- `js/app.js` - MIDI input, practice logic, drawing, song library/editor/import
- `js/notation.js` - note names, typed-song parser, grouping notes into steps
- `js/midifile.js` - `.mid` file reader
- `js/sheet.js` - sheet music view (lays out bars and rests, draws with VexFlow)
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
