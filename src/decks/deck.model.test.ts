import assert from "node:assert/strict";
import { test } from "node:test";

import { decks } from "./deck.model.ts";

test("wizard deck: 42 spell cards (19 cantrips + 23 lvl-1)", () => {
  const deck = decks.get({ cls: "wizard" });
  assert.equal(deck.cls.label, "Wizard");
  assert.equal(deck.cards.length, 42);
  assert.ok(deck.cards.every((card) => card.kind === "spell"));
});

test("wizard deck includes fire-bolt and magic-missile", () => {
  const deck = decks.get({ cls: "wizard" });
  const ids = deck.cards.map((card) => card.spell.id);
  assert.ok(ids.includes("fire-bolt"));
  assert.ok(ids.includes("magic-missile"));
});

test("wizard deck is ordered by non-decreasing spell level", () => {
  const deck = decks.get({ cls: "wizard" });
  const levels = deck.cards.map((card) => card.spell.level);
  for (let i = 1; i < levels.length; i++) {
    assert.ok(levels[i] >= levels[i - 1], `card ${i} (level ${levels[i]}) before ${levels[i - 1]}`);
  }
  assert.equal(levels.filter((level) => level === 0).length, 19);
});

test("class without vendored spells returns an empty deck", () => {
  const deck = decks.get({ cls: "barbarian" });
  assert.equal(deck.cls.label, "Barbarian");
  assert.deepEqual(deck.cards, []);
});
