import assert from "node:assert/strict";
import { describe, test } from "vitest";

import { decks } from "./deck.model.ts";

import type { Character } from "src/characters/character.model";

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

// --- character decks ---
const wizard: Character = {
  id: "w",
  name: "Wizard",
  cls: "wizard",
  level: 1,
  picks: {
    cantrips: ["fire-bolt", "light", "mage-hand"],
    prepared: ["magic-missile", "shield", "mage-armor", "detect-magic"],
    weapons: ["dagger"],
  },
};

describe("decks.forCharacter()", () => {
  test("keeps only the picked spells and weapons", () => {
    const { entries } = decks.forCharacter(wizard);
    const spellIds = entries.flatMap(({ card }) => (card.kind === "spell" ? [card.spell.id] : []));
    const weaponIds = entries.flatMap(({ card }) =>
      card.kind === "weapon" ? [card.weapon.id] : []
    );
    assert.deepEqual(spellIds.sort(), [
      "detect-magic",
      "fire-bolt",
      "light",
      "mage-armor",
      "mage-hand",
      "magic-missile",
      "shield",
    ]);
    assert.deepEqual(weaponIds, ["dagger"]);
  });

  test("keeps every feat of the class", () => {
    const featCount = decks.get({ cls: "wizard" }).cards.filter((c) => c.kind === "feat").length;
    const { entries } = decks.forCharacter(wizard);
    assert.equal(entries.filter(({ card }) => card.kind === "feat").length, featCount);
  });

  test("expands stacked resources into one card per use", () => {
    const { entries } = decks.forCharacter(wizard);
    const mana = entries.filter(({ card }) => card.kind === "resource");
    assert.deepEqual(
      mana.map(({ key }) => key),
      ["resource-wizard-mana-0", "resource-wizard-mana-1"]
    );
  });

  test("keeps a pool resource as a single card", () => {
    const paladin: Character = { id: "p", name: "Paladin", cls: "paladin", level: 1, picks: {} };
    const keys = decks.forCharacter(paladin).entries.map(({ key }) => key);
    assert.deepEqual(
      keys.filter((key) => key.startsWith("resource-")),
      ["resource-paladin-mana-0", "resource-paladin-mana-1", "resource-paladin-lay-on-hands-0"]
    );
  });

  test("keys are unique", () => {
    const { entries } = decks.forCharacter(wizard);
    assert.equal(new Set(entries.map(({ key }) => key)).size, entries.length);
  });

  test("ignores picks the class cannot take", () => {
    const fighter: Character = {
      id: "f",
      name: "Fighter",
      cls: "fighter",
      level: 1,
      picks: { weapons: ["longsword"], prepared: ["magic-missile"] },
    };
    const { entries } = decks.forCharacter(fighter);
    assert.ok(entries.every(({ card }) => card.kind !== "spell"));
    assert.equal(entries.filter(({ card }) => card.kind === "resource").length, 2);
  });
});
