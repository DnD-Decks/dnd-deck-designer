import assert from "node:assert/strict";
import { test } from "vitest";

import { decks } from "./deck.model.ts";

// --- wizard level-1 deck ---

test("wizard deck has no level-2 spells", () => {
  const deck = decks.get({ cls: "wizard" });
  const level2 = deck.cards.filter((c) => c.kind === "spell" && c.spell.level === 2);
  assert.equal(level2.length, 0);
});

test("wizard deck section order: resource → feat → spell", () => {
  const deck = decks.get({ cls: "wizard" });
  const firstResource = deck.cards.findIndex((c) => c.kind === "resource");
  const firstFeat = deck.cards.findIndex((c) => c.kind === "feat");
  const firstSpell = deck.cards.findIndex((c) => c.kind === "spell");
  assert.ok(firstResource < firstFeat, "resources before feats");
  assert.ok(firstFeat < firstSpell, "feats before spells");
});

test("wizard deck carries simple weapons only", () => {
  const deck = decks.get({ cls: "wizard" });
  const weaponCards = deck.cards.filter((c) => c.kind === "weapon");
  assert.ok(weaponCards.length > 0);
  assert.ok(weaponCards.every((c) => c.weapon.proficiency === "simple"));
});

// --- fighter level-1 deck ---

test("fighter deck has no spells", () => {
  const deck = decks.get({ cls: "fighter" });
  assert.equal(deck.cards.filter((c) => c.kind === "spell").length, 0);
});

// --- other caster classes: non-empty decks with spell cards ---

const CASTER_CLASSES = ["bard", "cleric", "druid", "sorcerer", "warlock"] as const;

for (const cls of CASTER_CLASSES) {
  test(`${cls} deck: non-empty and contains spell cards`, () => {
    const deck = decks.get({ cls });
    assert.ok(deck.cards.length > 0, `${cls} deck is empty`);
    assert.ok(
      deck.cards.some((card) => card.kind === "spell"),
      `${cls} deck has no spell cards`
    );
  });
}

test("ranger deck has all four card kinds (resource, feat, spell, weapon)", () => {
  const deck = decks.get({ cls: "ranger" });
  assert.equal(deck.cls.label, "Ranger");
  const kinds = new Set(deck.cards.map((card) => card.kind));
  assert.deepEqual([...kinds].sort(), ["feat", "resource", "spell", "weapon"]);
});

test("paladin deck has all four card kinds (resource, feat, spell, weapon)", () => {
  const deck = decks.get({ cls: "paladin" });
  const kinds = new Set(deck.cards.map((card) => card.kind));
  assert.deepEqual([...kinds].sort(), ["feat", "resource", "spell", "weapon"]);
});

test("barbarian deck has resource, feat, and weapon cards", () => {
  const deck = decks.get({ cls: "barbarian" });
  assert.ok(deck.cards.some((card) => card.kind === "resource"));
  assert.ok(deck.cards.some((card) => card.kind === "feat"));
  assert.ok(deck.cards.some((card) => card.kind === "weapon"));
});
