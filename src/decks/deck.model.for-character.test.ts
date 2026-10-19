import { describe, expect, test } from "vitest";

import { cardKey, decks } from "./deck.model.ts";

import type { Character } from "src/characters/character.model";

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

const keysOf = (character: Character) =>
  decks.forCharacter(character).entries.map(({ key }) => key);

describe("decks.forCharacter()", () => {
  test("keeps only the picked spells and weapons", () => {
    const picked = {
      spells: keysOf(wizard)
        .filter((key) => key.startsWith("spell-"))
        .sort(),
      weapons: keysOf(wizard).filter((key) => key.startsWith("weapon-")),
    };

    expect(picked).toEqual({
      spells: [
        "spell-detect-magic-0",
        "spell-fire-bolt-0",
        "spell-light-0",
        "spell-mage-armor-0",
        "spell-mage-hand-0",
        "spell-magic-missile-0",
        "spell-shield-0",
      ],
      weapons: ["weapon-dagger-0"],
    });
  });

  test("keeps every feat of the class", () => {
    const featKeys = keysOf(wizard).filter((key) => key.startsWith("feat-"));

    const classFeats = decks
      .get({ cls: "wizard" })
      .cards.filter((c) => c.kind === "feat")
      .map((c) => `${cardKey(c)}-0`);

    expect(featKeys).toEqual(classFeats);
  });

  test("expands a resource into one card per copy", () => {
    const mana = keysOf(wizard).filter((key) => key.startsWith("resource-"));

    expect(mana).toEqual(["resource-wizard-mana-long-rest-0", "resource-wizard-mana-long-rest-1"]);
  });

  test("Lay on Hands is five tokens, not a pool", () => {
    const paladin: Character = { id: "p", name: "Paladin", cls: "paladin", level: 1, picks: {} };
    const resources = keysOf(paladin).filter((key) => key.startsWith("resource-"));

    expect(resources).toEqual([
      "resource-paladin-mana-long-rest-0",
      "resource-paladin-mana-long-rest-1",
      "resource-paladin-lay-on-hands-long-rest-0",
      "resource-paladin-lay-on-hands-long-rest-1",
      "resource-paladin-lay-on-hands-long-rest-2",
      "resource-paladin-lay-on-hands-long-rest-3",
      "resource-paladin-lay-on-hands-long-rest-4",
    ]);
  });

  test("keys are unique", () => {
    const keys = keysOf(wizard);

    expect(keys).toEqual([...new Set(keys)]);
  });

  test("ignores picks the class cannot take", () => {
    const fighter: Character = {
      id: "f",
      name: "Fighter",
      cls: "fighter",
      level: 1,
      picks: { weapons: ["longsword"], prepared: ["magic-missile"] },
    };
    const keys = keysOf(fighter);

    expect({
      spells: keys.filter((key) => key.startsWith("spell-")),
      resources: keys.filter((key) => key.startsWith("resource-")),
    }).toEqual({
      spells: [],
      resources: [
        "resource-fighter-second-wind-short-rest-0",
        "resource-fighter-second-wind-long-rest-0",
      ],
    });
  });

  test("adds a same-class card the character did not pick", () => {
    // burning hands is a wizard level-1 spell absent from the picks above
    const hero: Character = {
      ...wizard,
      picks: { ...wizard.picks, custom: ["spell-burning-hands"] },
    };
    const keys = keysOf(hero);

    expect(keys.filter((key) => key.startsWith("spell-burning-hands"))).toEqual([
      "spell-burning-hands-0",
    ]);
    // the picked class cards are still there
    expect(keys).toEqual(
      expect.arrayContaining([
        "spell-fire-bolt-0",
        "resource-wizard-mana-long-rest-0",
        "weapon-dagger-0",
      ])
    );
  });

  test("adds cross-class spell, feat, resource and weapon cards", () => {
    const hero: Character = {
      ...wizard,
      picks: {
        ...wizard.picks,
        custom: [
          "spell-cure-wounds",
          "feat-rogue-sneak-attack",
          "resource-paladin-lay-on-hands-long-rest",
          "weapon-longsword",
        ],
      },
    };
    const keys = keysOf(hero);

    expect(keys).toEqual(
      expect.arrayContaining([
        "spell-cure-wounds-0",
        "feat-rogue-sneak-attack-0",
        "resource-paladin-lay-on-hands-long-rest-0",
        "weapon-longsword-0",
      ])
    );
  });

  test("a custom resource adds only the copies of the rest it was picked for", () => {
    const hero: Character = {
      ...wizard,
      picks: { ...wizard.picks, custom: ["resource-bard-bardic-inspiration-long-rest"] },
    };
    const keys = keysOf(hero).filter((key) => key.startsWith("resource-bard-"));

    expect(keys).toEqual([
      "resource-bard-bardic-inspiration-long-rest-0",
      "resource-bard-bardic-inspiration-long-rest-1",
      "resource-bard-bardic-inspiration-long-rest-2",
    ]);
  });

  test("ignores unknown custom keys", () => {
    const hero: Character = {
      ...wizard,
      picks: { ...wizard.picks, custom: ["spell-not-a-spell", "nonsense"] },
    };

    expect(decks.forCharacter(hero).entries).toEqual(decks.forCharacter(wizard).entries);
  });

  test("does not duplicate a card the character already has", () => {
    const hero: Character = {
      ...wizard,
      picks: {
        ...wizard.picks,
        custom: ["spell-fire-bolt", "spell-cure-wounds", "spell-cure-wounds"],
      },
    };
    const keys = keysOf(hero);

    expect({
      fireBolt: keys.filter((key) => key.startsWith("spell-fire-bolt")),
      cureWounds: keys.filter((key) => key.startsWith("spell-cure-wounds")),
    }).toEqual({
      fireBolt: ["spell-fire-bolt-0"],
      cureWounds: ["spell-cure-wounds-0"],
    });
  });
});
