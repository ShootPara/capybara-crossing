# Travessia das Capivaras

## Local testing

From this directory, run `npm ci` to install dependencies, then start the local server.

```powershell
npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Open [the local game](http://127.0.0.1:5173/) to see the picnic invitation. The main action starts a new game, continues at the next crossing, or opens the completed pond. All 48 crossings from A1 through C2 are playable in campaign order. Chapter packs load when play begins. Replays preserve earned progress.

Open **Cartas das capivaras** from the invitation or any crossing screen. First landings reveal each traveler's card. The host aces turn up after crossings 12, 24, 36, and 48, for 52 cards in a completed album. The album reads the same checkpoint used for the progress meter and restore codes. Press Escape or select **Fechar** to return to play.

Run `npm.cmd test` to check save codes, card progression, and the audio queue and gain. Run `npm.cmd run build` to generate the static site in `dist`.

The QR points to the same entry URL the player opened. For phone testing, serve the build at an address reachable by both devices. Local saves are scoped to the site's browser origin. The player can use the displayed code to move between origins.

## Audio checks

Selecting **Jogar** or **Continuar** on the invitation activates audio when starting a crossing. The musical-note checkbox controls **Música**, and the speaker checkbox controls **Efeitos**, including victory cues. A slash marks a muted channel. Opening the invitation or album is silent.

When an effect plays, the chapter loop keeps its place and drops to 32% of its usual gain over 50 ms. It stays low through consecutive cues, such as the quack and victory on the same crossing, then returns over 300 ms. Muting effects releases the duck. Victory cues play on first clear, with the finale cue at lantern placement.

The game uses 21 web MP3s prepared from the Mixcraft exports. After updating an export, run `node tools/render_audio.mjs` from the project root with FFmpeg on PATH. Rebuild the static site if testing from `dist`. [Audio cue sheet](../production/AUDIO-CUE-SHEET.md)

The 49 transparent runtime card portraits are included in the checkout. The production archive is needed only to regenerate them with [the offline export script](tools/export-card-portraits.py). [Title and album design](docs/title-and-cards.md)
