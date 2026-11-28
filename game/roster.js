const CHAPTER_ROSTER = [
  ['A1', ['Nina', 'Beto', 'Lia', 'Tico', 'Sol', 'Duda', 'Caju', 'Pip']],
  ['A2', ['Iara', 'Maré', 'Jubi', 'Bia', 'Noé', 'Luma', 'Tuca', 'Zizi']],
  ['B1', ['Mina', 'Lelé', 'Rui', 'Neco', 'Pati', 'Dani', 'Tami', 'Nilo', 'Sabi', 'a capivara de chapéu amarelo']],
  ['B2', ['Cora', 'Nani', 'Bento', 'Lua', 'Vivi', 'Teo', 'Yara', 'Miro', 'Avi', 'Ivo']],
  ['C1', ['Rosa', 'Bela', 'Léo', 'Nara', 'Téo', 'Pipa', 'Iris', 'Malu']],
  ['C2', ['Pipa', 'Bento', 'Sol', 'Fafá']],
];

const travelers = CHAPTER_ROSTER.flatMap(([chapter, names]) => names.map((name, index) => {
  const step = String(index + 1).padStart(2, '0');
  const crossingId = `${chapter}-${step}`;
  const travelerId = `traveler.${crossingId.toLowerCase()}`;
  return { name, crossingId, travelerId, portrait: `${travelerId}.webp` };
}));

export const CAPYBARA_NAMES = Object.freeze(travelers.map(({ name }) => name));

const RANKS = [
  ['2', 'dois'], ['3', 'três'], ['4', 'quatro'], ['5', 'cinco'], ['6', 'seis'], ['7', 'sete'],
  ['8', 'oito'], ['9', 'nove'], ['10', 'dez'], ['J', 'valete'], ['Q', 'dama'], ['K', 'rei'], ['A', 'ás'],
];
const TRAVELERS_PER_SUIT = RANKS.length - 1;
const HOST = {
  name: 'Anfitriã',
  crossingId: null,
  travelerId: 'host.original',
  portrait: 'host.original.webp',
};

export const CARD_SUITS = Object.freeze([
  ['paus', 'Paus', '♣'], ['ouros', 'Ouros', '♦'], ['copas', 'Copas', '♥'], ['espadas', 'Espadas', '♠'],
].map(([id, name, pip], suitIndex) => {
  const cards = RANKS.map(([rank, rankName], rankIndex) => {
    const isAce = rank === 'A';
    const ordinal = suitIndex * TRAVELERS_PER_SUIT + rankIndex + 1;
    const character = isAce ? HOST : travelers[ordinal - 1];
    return Object.freeze({
      ...character,
      id: isAce ? `host.${id}` : character.travelerId,
      position: suitIndex * RANKS.length + rankIndex + 1,
      ordinal: isAce ? null : ordinal,
      unlocksAt: isAce ? ordinal - 1 : ordinal,
      rank,
      pip,
      label: `${character.name}, ${rankName} de ${id}`,
    });
  });
  return Object.freeze({ id, name, pip, cards: Object.freeze(cards) });
}));

const cards = CARD_SUITS.flatMap(suit => suit.cards);
const travelerCards = cards.filter(card => card.ordinal !== null);
export const CARD_COUNT = cards.length;

export function cardByPosition(position) {
  return cards[position - 1];
}

export function cardByRosterIndex(index) {
  return travelerCards[index];
}

export function unlockedCardPositions(checkpoint) {
  return cards.filter(card => card.unlocksAt <= checkpoint).map(card => card.position);
}
