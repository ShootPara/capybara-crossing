# Travessia das Capivaras

## Local testing

From this directory, run `npm ci` to install dependencies, then start the local server.

```powershell
npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Open [the local game](http://127.0.0.1:5173/) and select **Jogar**. All 48 crossings from A1 through C2 are playable in campaign order. Each chapter pack loads when play begins. Replays preserve earned progress.

Run `npm.cmd test` to check save codes and `npm.cmd run build` to generate the static site in `dist`.

The QR points to the same entry URL the player opened. For phone testing, serve the build at an address reachable by both devices. Local saves are scoped to the site's browser origin. The player can use the displayed code to move between origins.

## Audio checks

Select **Jogar** to activate audio. Let a chapter track play through its loop and toggle **Música** and **Efeitos** independently. Check that the chapter track changes when advancing or restoring a checkpoint, and that restoring a checkpoint does not replay a victory. Victory cues play on first clear, with the finale cue at lantern placement.

The game uses 21 web MP3s prepared from the Mixcraft exports. After updating an export, run `node tools/render_audio.mjs` from the project root with FFmpeg on PATH. Rebuild the static site if testing from `dist`. [Audio cue sheet](../production/AUDIO-CUE-SHEET.md)
