import './title.css';

const bridgeIcon = `<svg viewBox="0 0 24 16" aria-hidden="true" focusable="false">
  <path d="M2 13C6 5 10 2 12 2s6 3 10 11M3 14c5-2 13-2 18 0M7 7v4m5-9v9m5-4v4"/>
</svg>`;

const albumIcon = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path d="m7 5-3.2.9a1.5 1.5 0 0 0-1 1.8l2.8 10a1.5 1.5 0 0 0 1.8 1l1-.3"/>
  <rect x="8" y="4" width="12" height="16" rx="2"/>
  <path d="m14 9 2.2 3-2.2 3-2.2-3z"/>
</svg>`;

const musicIcon = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path d="M9 17V6l11-2v11M9 9l11-2"/>
  <ellipse cx="6.5" cy="17.5" rx="2.5" ry="1.75" transform="rotate(-16 6.5 17.5)"/>
  <ellipse cx="17.5" cy="15.5" rx="2.5" ry="1.75" transform="rotate(-16 17.5 15.5)"/>
</svg>`;

const effectsIcon = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path d="M3 9h4l5-4v14l-5-4H3zm12 0a4 4 0 0 1 0 6m2.5-8.4a7.5 7.5 0 0 1 0 10.8"/>
</svg>`;

export function titleMarkup() {
  const pond = `${import.meta.env.BASE_URL}art/pond.webp`;

  return `<div class="picnic-title">
    <div class="picnic-composition">
      <div class="picnic-art" aria-hidden="true">
        <img src="${pond}" alt="" width="1280" height="720" fetchpriority="high">
        <div class="picnic-pennants">
          <span></span><span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span>
        </div>
      </div>
      <div class="picnic-invitation">
        <div class="picnic-emblem" aria-hidden="true">${bridgeIcon}</div>
        <h1 id="title-heading" tabindex="-1">Travessia <span><em>das</em> Capivaras</span></h1>
        <p id="title-progress"></p>
        <button class="picnic-play" type="button" id="title-play">Jogar</button>
        <button class="picnic-restore" type="button" id="title-restore">Continuar com um código</button>
      </div>
    </div>
    <div class="picnic-replay" id="title-replay"></div>
  </div>`;
}

export function utilityMarkup() {
  return `<div class="game-utility">
    <button type="button" id="open-album" class="utility-album" aria-haspopup="dialog">
      ${albumIcon}<span>Cartas das capivaras</span>
    </button>
    <div class="utility-sound" role="group" aria-label="Som">
      <label class="utility-toggle">
        <input id="music-toggle" type="checkbox" aria-label="Música" title="Música" checked>
        <span class="utility-icon" aria-hidden="true">${musicIcon}</span>
      </label>
      <label class="utility-toggle">
        <input id="effects-toggle" type="checkbox" aria-label="Efeitos" title="Efeitos" checked>
        <span class="utility-icon" aria-hidden="true">${effectsIcon}</span>
      </label>
    </div>
  </div>`;
}
