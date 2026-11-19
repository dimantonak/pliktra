# Notes for AI assistants and contributors

Read this before changing Pliktra. It explains why the app exists and the rules that keep it working.

## Why Pliktra exists

The author takes piano lessons and practises songs from a printed method book at home on a digital piano.
Commercial apps (e.g. Simply Piano) only offer their own catalogue. Pliktra lets you **type in any song**
(e.g. from your lesson book) and then practises it in "wait mode": it shows the next key(s), with the
right fingers, and waits until you play them on a real piano connected by USB (Web MIDI).

Typical use: a phone or tablet on the piano's music stand, a USB cable to the piano, a song the teacher
assigned this week. So: touch-friendly, works in landscape, no account, no server.

## Hard rules

- **Never commit copyrighted songs.** Songs from lesson books are shared only as `#song=` links
  (the song is inside the URL fragment, which browsers never send to a server). Built-in songs must be
  public domain or written for Pliktra. Photos of sheet music and backup files (`pliktra-songs-*.json`)
  are git-ignored for the same reason.
- **Device-neutral.** README and in-app texts must not assume one tablet, piano model or computer.
- **No build step, no dependencies.** Plain HTML/CSS/JS, classic `<script>` tags (no ES modules), so it
  also runs from `file://`. The only third-party code is vendored VexFlow (MIT) + Bravura (OFL);
  only reuse other code whose licence allows it, and credit it in the README.
- **Licence:** CC BY 4.0 (see LICENSE).
- Keep user data backward compatible: songs, settings and scores live in `localStorage`
  (`pliktra.songs`, `pliktra.settings`, `pliktra.best`, `pliktra.lastSong`, `pliktra.builtinsSeen`).
  Typed songs are re-parsed on load, so parser changes reach existing songs.

## How it works

| File | What it does |
|---|---|
| `js/notation.js` | Note names, the typed-song parser (`parseSongText`), grouping notes into steps (`buildSteps`). |
| `js/midifile.js` | `.mid` reader (tempo map, running status, drums skipped). |
| `js/sheet.js` | Sheet music: lays out bars per hand (`layoutBars`) and draws a grand staff with VexFlow. |
| `js/app.js` | Everything else: practice logic, MIDI in/out, canvas drawing, Listen, A–B loop, library, links, backup, editor, settings. |
| `sw.js`, `manifest.webmanifest` | Offline use / install as an app (network first, cached copy when offline). |

Typed song notation (also in the editor's help): `C4 D4`, chords `C4+E4`, hands `L:`/`R:` (otherwise
below middle C = left hand), fingers `E4/3`, lengths in quarter-note beats `C4_2`, rests `-`,
time signature `3/4` first, `|` and `// comments` ignored. One beat is drawn as 0.5 s.

The sheet music derives each hand's rhythm from the text: a note lasts until that hand's next note,
a rest, or the bar line. Positions snap to 1/8 beat so every bar adds up.

Built-in songs live in `BUILTIN` in `app.js`. If you change one, put its old text in `prev` so unedited
copies on users' devices are upgraded. New built-ins are added once (`pliktra.builtinsSeen`).

## Testing

```
node --test tests/
```

Covers the parser, the MIDI reader and the sheet bar layout (every bar of every built-in song must add up).
For UI changes, also open `index.html` in Chrome: without a piano you can tap the screen keys or use the
computer keyboard (`A W S E D F T G Y H U J K`, `Z`/`X` = octave).

## Publishing

`main` is published by GitHub Pages at https://dimantonak.github.io/pliktra/ about a minute after a push.

## Ideas not done yet

Exercises (scales, note finding, chords), play-along with tempo and timing score, progress tracking,
key signatures in the sheet music, sheet music for imported MIDI files, transpose.
