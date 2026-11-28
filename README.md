# Capybara Crossing — Travessia das Capivaras

A public, no-login English grammar game with Portuguese controls, 48 crossings, six chapters, and local progress saving.

Play: https://shootpara.github.io/capybara-crossing/

## Development

Use Node.js 22. From `game/`, run `npm ci`, then `npm run dev`.
Run `npm test` for save-code, album and audio tests and `npm run build` for the static release in `game/dist`.

The repository includes the playable source, chapter content, runtime art and audio, and audio cue definitions. Original art production files and Mixcraft sessions stay in the local production archive.

## Picnic invitation and card album

The picnic invitation opens the campaign and its 52-card collection. The music and effects icons stay available during play, and the chapter music softens as a sound effect or victory cue plays. [Game controls](game/README.md) · [Design and implementation handoff](game/docs/title-and-cards.md)

## Publishing

Push to `main` to run tests, build, and deploy through GitHub Actions to GitHub Pages. Only `game/dist` is published. Relative asset paths support the `/capybara-crossing/` project URL. QR codes use the opened game URL and keep progress in the URL fragment.

Progress is stored in the current browser. Players can transfer it using the displayed numeric code or QR code. There are no accounts or server saves. This standalone release is for independent playtesting; TiraDez integration is separate.
