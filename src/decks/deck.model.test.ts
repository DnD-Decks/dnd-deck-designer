import { describe, expect, test } from "vitest";

import { cardSection, decks } from "./deck.model.ts";

import type { CharacterClass } from "src/models/class/classes.model";
import type { DeckCard } from "./deck.model.ts";

const kinds = (deck: { cards: readonly DeckCard[] }) =>
  [...new Set(deck.cards.map((card) => card.kind))].sort();

describe("decks.get()", () => {
  test("the wizard deck is scoped to level 1 and orders resources, feats, spells", () => {
    const deck = decks.get({ cls: "wizard" });

    const outOfScope = deck.cards.filter((c) => c.kind === "spell" && c.spell.level > 1);
    expect(outOfScope).toEqual([]);

    const positions = (["resource", "feat", "spell"] as const).map((kind) =>
      deck.cards.findIndex((c) => c.kind === kind)
    );
    // findIndex gives -1 for a missing kind: sorted === as-built means all three exist, in order
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(positions.every((p) => p >= 0)).toBe(true);
  });

  test("the wizard deck carries simple weapons only", () => {
    const martial = decks
      .get({ cls: "wizard" })
      .cards.filter((c) => c.kind === "weapon" && c.weapon.proficiency !== "simple");

    expect(martial).toEqual([]);
  });

  test("the fighter deck has no spells", () => {
    const spellCards = decks.get({ cls: "fighter" }).cards.filter((c) => c.kind === "spell");

    expect(spellCards).toEqual([]);
  });

  test.each<{ cls: CharacterClass }>([
    { cls: "bard" },
    { cls: "cleric" },
    { cls: "druid" },
    { cls: "sorcerer" },
    { cls: "warlock" },
  ])("the $cls deck is non-empty and has spell cards", ({ cls }) => {
    const deck = decks.get({ cls });

    expect(deck.cards.length).toBeGreaterThan(0);
    expect(deck.cards.some((card) => card.kind === "spell")).toBe(true);
  });

  test.each<{ cls: CharacterClass; expected: string[] }>([
    { cls: "ranger", expected: ["action", "feat", "resource", "spell", "weapon"] },
    { cls: "paladin", expected: ["action", "feat", "resource", "spell", "weapon"] },
    { cls: "barbarian", expected: ["action", "feat", "resource", "weapon"] },
    { cls: "wizard", expected: ["feat", "resource", "spell", "weapon"] },
  ])("the $cls deck has $expected card kinds", ({ cls, expected }) => {
    expect(kinds(decks.get({ cls }))).toEqual(expected);
  });
});

describe("decks.get() resources", () => {
  test("a resource with copies on both rests is two cards, short rest first", () => {
    const cards = decks
      .get({ cls: "fighter" })
      .cards.flatMap((card) =>
        card.kind === "resource" ? `${card.resource.id} ${card.recharge}` : []
      );

    expect(cards).toEqual(["fighter-second-wind short-rest", "fighter-second-wind long-rest"]);
  });
});

describe("decks.findCard()", () => {
  test("resolves a card key of every kind", () => {
    const kindsOf = [
      "spell-cure-wounds",
      "feat-rogue-sneak-attack",
      "resource-fighter-second-wind-short-rest",
      "action-fighter-second-wind",
      "weapon-longsword",
    ].map((key) => decks.findCard({ key })?.kind);

    expect(kindsOf).toEqual(["spell", "feat", "resource", "action", "weapon"]);
  });

  test("returns nothing for an unknown key", () => {
    expect(decks.findCard({ key: "spell-not-a-spell" })).toBeUndefined();
  });
});

describe("cardSection()", () => {
  // ranger's deck has every card kind
  const deck = decks.get({ cls: "ranger" });
  const first = (kind: DeckCard["kind"]) => {
    const card = deck.cards.find((c) => c.kind === kind);
    if (!card) throw new Error(`no ${kind} card in the ranger deck`);
    return card;
  };

  test("labels each card kind", () => {
    expect([
      cardSection(first("resource")),
      cardSection(first("action")),
      cardSection(first("feat")),
      cardSection(first("weapon")),
    ]).toEqual(["Resources", "Class Actions", "Class Features", "Weapons"]);
  });

  test("labels cantrips and level-1 spells separately", () => {
    // rangers know no cantrips; the wizard deck has both spell levels
    const spells = decks.get({ cls: "wizard" }).cards;
    const cantrip = spells.find((c) => c.kind === "spell" && c.spell.level === 0);
    const level1 = spells.find((c) => c.kind === "spell" && c.spell.level === 1);
    if (!cantrip || !level1) throw new Error("wizard deck missing spell levels");

    expect([cardSection(cantrip), cardSection(level1)]).toEqual(["Cantrips", "Level 1"]);
  });
});
