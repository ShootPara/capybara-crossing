# Audio cue sheet

**All 21 cues use Brian’s Mixcraft exports.** The original stereo MP3s and Mixcraft sessions are in [Capybara Music](Capybara%20Music/). [AUDIO-CUE-SHEET.json](AUDIO-CUE-SHEET.json) contains every cue and crossing/slot binding, preserving historical source tags as provenance.

| Cue | Type | Target seconds | Direction |
|---|---|---:|---|
| music.a1 | loop | 32 | warm plucked theme |
| victory.a1 | one_shot | 4 | Same motif, increasing orchestration, not peak level |
| music.a2 | loop | 32 | add reed-like soft sustained line |
| victory.a2 | one_shot | 4 | Same motif, increasing orchestration, not peak level |
| music.b1 | loop | 32 | soft rain pulse; preserve motif |
| victory.b1 | one_shot | 4 | Same motif, increasing orchestration, not peak level |
| music.b2 | loop | 32 | open brighter counterline |
| victory.b2 | one_shot | 4 | Same motif, increasing orchestration, not peak level |
| music.c1 | loop | 32 | light bell/firefly texture |
| victory.c1 | one_shot | 4 | Same motif, increasing orchestration, not peak level |
| music.c2 | loop | 32 | quiet moonwater full ensemble |
| victory.c2 | one_shot | 4 | Same motif, increasing orchestration, not peak level |
| sfx.scene | one_shot | 1 | soft acknowledgment |
| sfx.prop | one_shot | 1 | short wood/paper prop movement |
| sfx.clip | one_shot | 1 | clip light click |
| sfx.flag | one_shot | 1 | small cloth snap |
| sfx.dock | one_shot | 1 | gentle dock knock |
| sfx.paper | one_shot | 1 | paper fleet rustle |
| sfx.duck | one_shot | 1 | one playful quack |
| sfx.retry | one_shot | 1 | optional gentle neutral tap |
| victory.finale | one_shot | 4 | Six-layer resolution without sudden loudness increase |

The six 32-second chapter loops share one motif. Render each chapter as a single mixed loop. Add instrumentation by chapter without increasing perceived loudness. B1 rain and clearing remain visual/weather states within its chapter tier; any alternate mix needs a named reviewed revision. Chapter endings may use a longer tail of the same victory family, not an unlisted new melody.

Start music only after user activation. Music and effects have separate controls. Restore selects the checkpoint’s tier without playing earned victories. S1/S2 optional effects fire after their evidence is rendered; S3 victory fires only on the first resolved landing. Never advance game state from an audio callback. Suppress duplicate victory on replay/restore. The C2-03 quack follows its accepted S3 travel; C2-04 finale follows actual lantern placement, not its preview card. The optional retry cue is globally available, not among the 193 crossing-specific bindings.

## Delivery and playback

The note and speaker icons control the music and effects channels independently. The chapter loop ducks to 32% gain with a 50 ms attack during audible foreground cues, holds through the queue, and returns over 300 ms. [Sound controls and background-music ducking](../game/docs/title-and-cards.md#sound-icons-and-background-music-ducking)

Keep hosting bandwidth and storage low for free-tier deployment.

- Keep the original compressed exports with their cue IDs and source/license information in the production archive. The web build contains only the runtime MP3s.
- Ship one mono MP3 per cue at 44.1 kHz and 48 kbps constant bitrate. Include all 21 files within a combined 1.5 MiB ceiling, including file metadata.
- Defer audio downloads until user activation. Load the current chapter's loop and fetch one-shots as needed. Use one looping music player and one one-shot player. Switch chapter tracks directly and stop the active sound immediately when its control is muted.
- Mix all music layers into the chapter files. Keep the six loops at a similar perceived level and keep one-shots gentle. Check rendered files for clipping and listen for audible gaps or clicks at loop seams.
- Verify activation, separate controls, mute, chapter switching, and restore on desktop and mobile. If audio fails to load or play, gameplay continues. Visual states and semantic text carry all essential information. The build uses no spoken narration.

Run `node tools/render_audio.mjs` to prepare the web copies from the source files listed in the JSON cue sheet. Victories 1 through 6 follow chapter order. Victory 7 plays at the finale. The renderer folds each export to mono and applies a fixed gain per cue before encoding. Each web copy retains the decoded sample count of its source. Together the 21 runtime MP3s occupy 1,371,622 bytes.
