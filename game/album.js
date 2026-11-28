import { CARD_COUNT, CARD_SUITS, unlockedCardPositions } from './roster.js';
import './album.css';

function cardIndex(card, reverse = false) {
  const index = document.createElement('span');
  index.className = reverse ? 'album-card-index album-card-index-reverse' : 'album-card-index';
  index.setAttribute('aria-hidden', 'true');
  index.append(card.rank, document.createElement('br'), card.pip);
  return index;
}

function cardSlot(card, revealed) {
  const slot = document.createElement('li');
  const surface = document.createElement('div');
  surface.setAttribute('role', 'img');
  slot.append(surface);

  if (!revealed) {
    surface.className = 'album-card album-card-back';
    surface.setAttribute('aria-label', `Carta virada para baixo, posição ${card.position} de ${CARD_COUNT}`);
    const medallion = document.createElement('span');
    medallion.className = 'album-card-medallion';
    medallion.setAttribute('aria-hidden', 'true');
    surface.append(medallion);
    return slot;
  }

  surface.className = card.rank === 'A' ? 'album-card album-card-face album-card-ace' : 'album-card album-card-face';
  if (card.crossingId === 'B1-10') surface.classList.add('album-card-long-caption');
  surface.setAttribute('aria-label', card.label);
  const portrait = document.createElement('img');
  portrait.className = 'album-card-portrait';
  portrait.alt = '';
  portrait.setAttribute('aria-hidden', 'true');
  portrait.loading = 'lazy';
  portrait.decoding = 'async';
  portrait.width = 320;
  portrait.height = 320;
  portrait.src = `${import.meta.env.BASE_URL}cards/${card.portrait}`;
  const caption = document.createElement('span');
  caption.className = 'album-card-caption';
  caption.setAttribute('aria-hidden', 'true');
  caption.textContent = card.name;
  surface.append(cardIndex(card), portrait, caption, cardIndex(card, true));
  return slot;
}

function suitSection(suit, revealedPositions) {
  const section = document.createElement('section');
  section.className = 'album-suit';
  const heading = document.createElement('h3');
  heading.id = `album-${suit.id}`;
  section.setAttribute('aria-labelledby', heading.id);
  const pip = document.createElement('span');
  pip.setAttribute('aria-hidden', 'true');
  pip.textContent = suit.pip;
  heading.append(pip, suit.name);

  const grid = document.createElement('ul');
  grid.className = 'album-grid';
  grid.setAttribute('role', 'list');
  grid.append(...suit.cards.map(card => cardSlot(card, revealedPositions.has(card.position))));
  section.append(heading, grid);
  return section;
}

export function createAlbum(dialog) {
  dialog.setAttribute('aria-labelledby', 'album-heading');
  dialog.innerHTML = `
    <div class="album-header">
      <h2 id="album-heading" tabindex="-1" autofocus>Cartas das capivaras</h2>
      <p class="album-count" aria-live="polite"></p>
      <button type="button" class="album-close" aria-label="Fechar" title="Fechar">
        <span aria-hidden="true">×</span>
      </button>
    </div>
    <div class="album-collection"></div>
  `;
  const heading = dialog.querySelector('#album-heading');
  const closeButton = dialog.querySelector('.album-close');
  const count = dialog.querySelector('.album-count');
  const collection = dialog.querySelector('.album-collection');

  function render(checkpoint) {
    const revealed = new Set(unlockedCardPositions(checkpoint));
    count.textContent = `${revealed.size} de ${CARD_COUNT} cartas`;
    collection.replaceChildren(...CARD_SUITS.map(suit => suitSection(suit, revealed)));
  }

  function close() {
    if (dialog.open) dialog.close();
  }

  closeButton.addEventListener('click', close);
  dialog.addEventListener('close', () => {
    if (!dialog.open) collection.replaceChildren();
  });
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    // The close button is the album's only sequential focus target.
    event.preventDefault();
    closeButton.focus();
  });

  return {
    open(checkpoint, opener) {
      if (dialog.open) return;
      render(checkpoint);
      opener?.focus({ preventScroll: true });
      dialog.showModal();
      dialog.scrollTop = 0;
      heading.focus({ preventScroll: true });
    },
    refresh(checkpoint) {
      if (dialog.open) render(checkpoint);
    },
    close,
  };
}
