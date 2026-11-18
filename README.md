# Pliktra

*Pliktra* (πλήκτρα) is Greek for "keys". It is a simple "wait mode" piano trainer.

**Open it:** https://dimantonak.github.io/pliktra/

Connect a MIDI piano (Roland FP-60X) by USB, pick a song,
and the app highlights the next key(s) to play and waits until you play them.

No build step, no dependencies: plain HTML + JavaScript.

## Run it on the PC (for testing)

1. Connect the FP-60X's **USB COMPUTER** port to the PC.
2. Open `index.html` in **Chrome** (double-click it, or drag it into Chrome).
3. Allow MIDI access when Chrome asks. The pill at the top right should show the piano's name.

Without a piano you can tap the on-screen keys or use the computer keyboard
(`A W S E D F T G Y H U J K` = C to C, `Z`/`X` = octave down/up).

## Use it on the tablet

Browsers only allow MIDI on secure (https) pages, so the folder must be hosted online
(e.g. GitHub Pages or Netlify, both free). Then open the link in Chrome on the Fire tablet and
connect the piano with a USB-B to USB-C cable.

## Songs

- **Typed songs**: `C4 D4 E4`, chords `C4+E4+G4`, force a hand with `L:` / `R:`,
  lengths `C4_2`, rests `-`. Full help is in the song editor.
- **Record from piano**: in the editor, press *Record from piano* and play; notes are typed for you.
- **MIDI files** (`.mid`): import from the Songs screen and choose which hand plays each part.
- **Song links**: *Share* on a typed song makes a link; opening it on another device adds the song there.
  The song is inside the link itself (after `#`), so it is never stored on the website or in this repository.

Songs, settings and best scores are saved in the browser on that device (localStorage).

## Files

- `index.html`, `styles.css` - page and layout
- `js/app.js` - MIDI input, practice logic, drawing, song library/editor/import
- `js/notation.js` - note names, typed-song parser, grouping notes into steps
- `js/midifile.js` - `.mid` file reader

## Licence

© 2026 Dimitris Antonakis. Licensed under
[Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/);
see [LICENSE](LICENSE). You may reuse and adapt it, including commercially, as long as you give credit.
