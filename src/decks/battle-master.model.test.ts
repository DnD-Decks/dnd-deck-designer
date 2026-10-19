import type { Character } from "src/characters/character.model";
import { characters } from "src/characters/character.model";
import { choices } from "src/characters/choices.model";
import { play } from "src/characters/play.model";
import { cardName, cardProvenance, decks } from "src/decks/deck.model";
import { feats } from "src/models/feats/feats.model";
import { describe, expect, test } from "vitest";

const battleMaster: Character = {
  id: "battle-master",
  name: "Tactician",
  cls: "fighter",
  level: 3,
  subclass: "battle-master",
  picks: {
    weapons: ["longsword", "dagger", "shortbow"],
    maneuvers: ["fighter-precision-attack", "fighter-riposte", "fighter-trip-attack"],
  },
};

describe("Battle Master (PHB 2024)", () => {
  test("keeps Fighter features and only the three chosen maneuvers, without Champion features", () => {
    const names = decks.forCharacter(battleMaster).entries.map(({ card }) => cardName(card));
    expect(names).toEqual(
      expect.arrayContaining([
        "Second Wind",
        "Action Surge",
        "Tactical Mind",
        "Combat Superiority",
        "Student of War",
        "Precision Attack",
        "Riposte",
        "Trip Attack",
      ])
    );
    expect(names).not.toContain("Improved Critical");
    expect(names).not.toContain("Remarkable Athlete");
    expect(names).not.toContain("Lunging Attack");
    const maneuvers = decks
      .forCharacter(battleMaster)
      .entries.filter(({ card }) => card.kind === "feat" && card.feat.choice === "maneuvers");
    expect(maneuvers).toHaveLength(3);
  });

  test("four individual d8 dice recover completely on either rest", () => {
    const entries = decks.forCharacter(battleMaster).entries;
    const dice = entries.filter(
      ({ card }) => card.kind === "resource" && card.resource.id === "fighter-superiority-dice"
    );
    expect(dice.map(({ key }) => key)).toEqual([
      "resource-fighter-superiority-dice-0",
      "resource-fighter-superiority-dice-1",
      "resource-fighter-superiority-dice-2",
      "resource-fighter-superiority-dice-3",
    ]);
    expect(dice.every(play.spendable)).toBe(true);
    const spent = dice.map(({ key }) => key);
    for (const rest of ["short-rest", "long-rest"] as const)
      expect(play.recovered({ entries, spent, rest })).toEqual(dice);
  });

  test("Champion stays the default, with no Battle Master cards leaking through the cache", () => {
    decks.get(battleMaster);
    const champion = decks.forCharacter({
      ...battleMaster,
      subclass: undefined,
      picks: { weapons: battleMaster.picks.weapons },
    });
    const names = champion.entries.map(({ card }) => cardName(card));
    expect(names).toContain("Improved Critical");
    expect(names).not.toContain("Superiority Die");
    expect(names).not.toContain("Combat Superiority");
    expect(
      decks
        .forCharacter(battleMaster)
        .entries.filter(({ card }) => cardName(card) === "Superiority Die")
    ).toHaveLength(4);
  });

  test("shares the subclass and chosen maneuvers under a new identity", () => {
    const imported = characters.fromShareCode(characters.toShareCode(battleMaster));
    expect(imported).toEqual({ ...battleMaster, id: expect.any(String) });
    expect(imported?.id).not.toBe(battleMaster.id);
    expect(characters.classLine(battleMaster)).toBe("Level 3 Fighter · Battle Master");
    expect(choices.validate(battleMaster)).toEqual([]);
  });

  test.each([
    { ...battleMaster, level: 2 },
    { ...battleMaster, cls: "rogue" },
    { ...battleMaster, subclass: "eldritch-knight" },
    { ...battleMaster, picks: { maneuvers: ["fighter-improved-critical"] } },
  ])("rejects invalid subclass or maneuver data: %j", (value) => {
    expect(characters.parse(value)).toBeUndefined();
  });

  test("requires three distinct maneuvers and rejects arbitrary features", () => {
    const issues = choices.validate({
      ...battleMaster,
      picks: { ...battleMaster.picks, maneuvers: ["fighter-trip-attack", "fighter-trip-attack"] },
    });
    expect(issues.map(({ problem }) => problem)).toEqual(["missing"]);
    expect(
      choices
        .validate({
          ...battleMaster,
          picks: { ...battleMaster.picks, maneuvers: ["fighter-fighting-style"] },
        })
        .map(({ problem }) => problem)
    ).toEqual(["unknown"]);
  });

  test("switching subclass or level removes maneuvers while retaining weapons and custom cards", () => {
    const build = {
      ...battleMaster,
      picks: { ...battleMaster.picks, custom: ["spell-cure-wounds"] },
    };
    const expected = { weapons: battleMaster.picks.weapons, custom: ["spell-cure-wounds"] };
    expect(choices.reconcile({ ...build, subclass: "champion" })).toEqual(expected);
    expect(choices.reconcile({ ...build, level: 2 })).toEqual(expected);
  });

  test("all 20 PHB 2024 maneuvers are tagged, with 2024-specific effects", () => {
    const available = feats.findAll(battleMaster).filter((feat) => feat.choice === "maneuvers");
    expect(available).toHaveLength(20);
    expect(new Set(available.map(({ id }) => id)).size).toBe(20);
    expect(available.every((feat) => feat.provenance?.source === "phb-2024")).toBe(true);
    expect(feats.get({ id: "fighter-parry" }).description).toContain("Strength or Dexterity");
    expect(feats.get({ id: "fighter-rally" }).description).toContain("half your Fighter level");
    expect(feats.get({ id: "fighter-lunging-attack" }).description).toContain("Dash");
  });

  test("every Battle Master card has non-open provenance; default cards resolve to SRD", () => {
    const cards = decks.forCharacter(battleMaster).entries.map(({ card }) => card);
    const nonOpen = cards.filter((card) => !cardProvenance(card).openContent);
    expect(nonOpen).toHaveLength(9);
    expect(
      nonOpen.every((card) => {
        const origin = cardProvenance(card);
        return (
          origin.id === "phb-2024" &&
          origin.license === null &&
          [93, 94, 95].includes(origin.page ?? 0)
        );
      })
    ).toBe(true);
    expect(cards.filter((card) => cardProvenance(card).openContent).map(cardName)).not.toContain(
      "Trip Attack"
    );
    expect(
      cardProvenance(cards.find((card) => cardName(card) === "Longsword") ?? cards[0])
    ).toMatchObject({ id: "srd-5.2.1", license: "CC-BY-4.0", openContent: true });
  });
});
