import assert from "node:assert/strict";
import type { Character } from "src/characters/character.model";
import { characters } from "src/characters/character.model";
import { choices } from "src/characters/choices.model";
import { decks } from "src/decks/deck.model";
import { classes } from "src/models/class/classes.model";
import { progression } from "src/models/class/progression.model";
import { describe, test } from "vitest";

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

describe("level progression", () => {
  for (const { id: cls } of classes.list()) {
    for (const level of [2, 3] as const) {
      test(`${cls} level ${level} survives sharing and assembles a complete deck`, () => {
        const picks = Object.fromEntries(
          choices
            .for({ cls, level })
            .map((rule) => [rule.id, choices.options({ cls, rule }).slice(0, rule.pick)])
        );
        const hero: Character = { id: cls, cls, level, picks, name: cls };
        const shared = characters.fromShareCode(characters.toShareCode(hero));
        assert.ok(shared);
        const { entries } = decks.forCharacter(shared);
        assert.ok(entries.length > 0);
        assert.equal(new Set(entries.map(({ key }) => key)).size, entries.length);
        const shown = entries.flatMap(({ card }) => (card.kind === "spell" ? [card.spell.id] : []));
        for (const id of progression.alwaysPrepared(hero))
          assert.ok(shown.includes(id), `${id} is missing`);
        assert.ok(
          entries.every(({ card }) => card.kind !== "feat" || (card.feat.level ?? 1) <= level)
        );
      });
    }
  }

  test("fighter progression unlocks Action Surge at two and Champion at three without changing the level-one catalog", () => {
    const names = (level: 1 | 2 | 3) =>
      decks
        .get({ cls: "fighter", level })
        .cards.flatMap((card) =>
          card.kind === "feat"
            ? [card.feat.name]
            : card.kind === "resource"
              ? [card.resource.name]
              : []
        );
    assert.ok(!names(1).includes("Action Surge"));
    assert.ok(names(2).includes("Action Surge"));
    assert.ok(!names(2).includes("Improved Critical"));
    assert.ok(names(3).includes("Improved Critical"));
    assert.ok(names(3).includes("Remarkable Athlete"));
    assert.ok(
      !decks
        .get({ cls: "fighter" })
        .cards.some((card) => card.kind === "feat" && card.feat.name === "Improved Critical")
    );
  });

  test("a level-three wizard keeps a picked second-level spell and gains four first-level and two second-level slots", () => {
    const hero: Character = {
      ...wizard,
      level: 3,
      picks: {
        ...wizard.picks,
        prepared: ["misty-step", "shield", "mage-armor", "magic-missile", "detect-magic", "sleep"],
      },
    };
    const { entries } = decks.forCharacter(hero);
    assert.ok(entries.some(({ card }) => card.kind === "spell" && card.spell.id === "misty-step"));
    assert.equal(
      entries.filter(({ card }) => card.kind === "resource" && card.resource.id === "wizard-mana")
        .length,
      4
    );
    assert.equal(
      entries.filter(({ card }) => card.kind === "resource" && card.resource.id === "wizard-mana-2")
        .length,
      2
    );
  });

  test("druid land selection grants cross-class spells and stays isolated in the deck cache", () => {
    const hero: Character = { ...wizard, cls: "druid", level: 3, picks: {} };
    const ids = (land: "arid" | "temperate") =>
      decks
        .forCharacter({ ...hero, land })
        .entries.flatMap(({ card }) => (card.kind === "spell" ? [card.spell.id] : []));
    assert.deepEqual(ids("arid").sort(), [
      "blur",
      "burning-hands",
      "fire-bolt",
      "speak-with-animals",
    ]);
    assert.deepEqual(ids("temperate").sort(), [
      "misty-step",
      "shocking-grasp",
      "sleep",
      "speak-with-animals",
    ]);
    assert.deepEqual(ids("arid").sort(), [
      "blur",
      "burning-hands",
      "fire-bolt",
      "speak-with-animals",
    ]);
  });

  test("rogue Sneak Attack scales to 2d6 only at level three", () => {
    for (const level of progression.levels) {
      const card = decks
        .get({ cls: "rogue", level })
        .cards.find((card) => card.kind === "feat" && card.feat.id === "rogue-sneak-attack");
      assert.ok(card?.kind === "feat");
      assert.ok(card.feat.description.includes(level === 3 ? "2d6" : "1d6"));
    }
  });
});
