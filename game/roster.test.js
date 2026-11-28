import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import {
  CAPYBARA_NAMES, CARD_COUNT, CARD_SUITS, cardByPosition, cardByRosterIndex, unlockedCardPositions,
} from './roster.js';

const EXPECTED_SUITS = [
  ['paus', 'Paus', '♣'], ['ouros', 'Ouros', '♦'], ['copas', 'Copas', '♥'], ['espadas', 'Espadas', '♠'],
];
const EXPECTED_RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const EXPECTED_NAMES = [
  'Nina, Beto, Lia, Tico, Sol, Duda, Caju, Pip, Iara, Maré, Jubi, Bia',
  'Noé, Luma, Tuca, Zizi, Mina, Lelé, Rui, Neco, Pati, Dani, Tami, Nilo',
  'Sabi, a capivara de chapéu amarelo, Cora, Nani, Bento, Lua, Vivi, Teo, Yara, Miro, Avi, Ivo',
  'Rosa, Bela, Léo, Nara, Téo, Pipa, Iris, Malu, Pipa, Bento, Sol, Fafá',
].flatMap(row => row.split(', '));

test('all 52 cards retain suit order, rank, character identity, and accessible captions', async () => {
  const chapters = await Promise.all(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(async id => {
    const file = await readFile(new URL(`../release/${id}.json`, import.meta.url), 'utf8');
    return JSON.parse(file).chapter.crossings;
  }));
  const crossings = chapters.flat();
  assert.equal(crossings.length, 48);
  assert.equal(CARD_COUNT, 52);
  assert.deepEqual(CAPYBARA_NAMES, EXPECTED_NAMES);

  const ids = new Set();
  CARD_SUITS.forEach((suit, suitIndex) => {
    assert.deepEqual([suit.id, suit.name, suit.pip], EXPECTED_SUITS[suitIndex]);
    assert.deepEqual(suit.cards.map(card => card.rank), EXPECTED_RANKS);
    suit.cards.forEach((card, rankIndex) => {
      const position = suitIndex * 13 + rankIndex + 1;
      assert.equal(cardByPosition(position), card);
      assert.equal(card.position, position);
      assert.equal(card.pip, suit.pip);
      assert.ok(!ids.has(card.id));
      ids.add(card.id);

      if (rankIndex === 12) {
        assert.equal(card.ordinal, null);
        assert.equal(card.crossingId, null);
        assert.equal(card.travelerId, 'host.original');
        assert.equal(card.portrait, 'host.original.webp');
        assert.equal(card.label, `Anfitriã, ás de ${suit.id}`);
        return;
      }

      const rosterIndex = suitIndex * 12 + rankIndex;
      const crossing = crossings[rosterIndex];
      assert.equal(cardByRosterIndex(rosterIndex), card);
      assert.equal(card.ordinal, crossing.ordinal);
      assert.equal(card.crossingId, crossing.id);
      assert.equal(card.travelerId, crossing.travelerId);
      assert.equal(card.name, EXPECTED_NAMES[rosterIndex]);
      assert.equal(card.portrait, `${crossing.travelerId}.webp`);
      assert.ok(card.label.startsWith(`${card.name}, `));
      assert.ok(card.label.endsWith(` de ${suit.id}`));
    });
  });
  assert.equal(ids.size, 52);
  assert.equal(cardByPosition(1).label, 'Nina, dois de paus');
});

test('all card positions follow each of the 49 committed checkpoints, including relocking', () => {
  for (let checkpoint = 48; checkpoint >= 0; checkpoint--) {
    const shownPositions = unlockedCardPositions(checkpoint);
    const shownCount = checkpoint + Math.floor(checkpoint / 12);
    assert.equal(shownPositions.length, shownCount, `checkpoint ${checkpoint}`);
    assert.deepEqual(shownPositions, Array.from({ length: shownCount }, (_, index) => index + 1));

    const shown = new Set(shownPositions);
    for (let position = 1; position <= 52; position++) {
      const acesBefore = Math.floor((position - 1) / 13);
      const isAce = position % 13 === 0;
      const milestone = position - acesBefore - Number(isAce);
      assert.equal(cardByPosition(position).unlocksAt, milestone);
      assert.equal(shown.has(position), checkpoint >= milestone, `checkpoint ${checkpoint}, position ${position}`);
    }
  }
});

test('the 49 distinct transparent WebPs are present with the reserved dimensions', async () => {
  const portraits = new Set(CARD_SUITS.flatMap(suit => suit.cards.map(card => card.portrait)));
  const folder = new URL('./public/cards/', import.meta.url);
  assert.equal(portraits.size, 49);
  assert.deepEqual((await readdir(folder)).sort(), [...portraits].sort());
  await Promise.all([...portraits].map(async portrait => {
    const bytes = await readFile(new URL(portrait, folder));
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF', portrait);
    assert.equal(bytes.toString('ascii', 8, 16), 'WEBPVP8X', portrait);
    assert.ok(bytes[20] & 0x10, `${portrait} has alpha`);
    assert.equal(bytes.readUIntLE(24, 3) + 1, 320, `${portrait} width`);
    assert.equal(bytes.readUIntLE(27, 3) + 1, 320, `${portrait} height`);
  }));
});
