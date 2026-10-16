import { describe, expect, test } from "vitest";

import type { CharacterClass } from "src/models/class/classes.model.ts";
import cantripsData from "../../data/spells/spells-level-0.json" with { type: "json" };
import spellsLevel1Data from "../../data/spells/spells-level-1.json" with { type: "json" };
import spellsLevel2Data from "../../data/spells/spells-level-2.json" with { type: "json" };
import spellsLevel3Data from "../../data/spells/spells-level-3.json" with { type: "json" };
import spellsLevel4Data from "../../data/spells/spells-level-4.json" with { type: "json" };
import spellsLevel5Data from "../../data/spells/spells-level-5.json" with { type: "json" };
import spellsLevel6Data from "../../data/spells/spells-level-6.json" with { type: "json" };
import spellsLevel7Data from "../../data/spells/spells-level-7.json" with { type: "json" };
import spellsLevel8Data from "../../data/spells/spells-level-8.json" with { type: "json" };
import spellsLevel9Data from "../../data/spells/spells-level-9.json" with { type: "json" };
import type { Spell } from "./spells.model.ts";
import { spells } from "./spells.model.ts";

const CASTER_CLASSES: CharacterClass[] = [
  "bard",
  "cleric",
  "druid",
  "sorcerer",
  "warlock",
  "wizard",
];

const unresolved = (list: readonly Spell[]) =>
  list.filter((s) => !s.id || !s.name).map((s) => s.id);

const spellIds = ({ cls, level }: { cls: CharacterClass; level: Spell["level"] }) =>
  spells.findAll({ cls, level }).map((s) => s.id);

describe("spells{}", () => {
  test("no spell id repeats across the level files", () => {
    const rawTotal =
      Object.keys(cantripsData).length +
      Object.keys(spellsLevel1Data).length +
      Object.keys(spellsLevel2Data).length +
      Object.keys(spellsLevel3Data).length +
      Object.keys(spellsLevel4Data).length +
      Object.keys(spellsLevel5Data).length +
      Object.keys(spellsLevel6Data).length +
      Object.keys(spellsLevel7Data).length +
      Object.keys(spellsLevel8Data).length +
      Object.keys(spellsLevel9Data).length;

    expect(new Set(spells.list().map((s) => s.id)).size).toBe(rawTotal);
  });
});

describe("spells.findAll()", () => {
  test.each(CASTER_CLASSES.map((cls) => ({ cls })))(
    "$cls cantrips are non-empty and fully resolved",
    ({ cls }) => {
      const cantrips = spells.findAll({ cls, level: 0 });

      expect(cantrips.length).toBeGreaterThan(0);
      expect(unresolved(cantrips)).toEqual([]);
    }
  );

  test.each(CASTER_CLASSES.map((cls) => ({ cls })))(
    "$cls level-1 spells are non-empty and fully resolved",
    ({ cls }) => {
      const level1 = spells.findAll({ cls, level: 1 });

      expect(level1.length).toBeGreaterThan(0);
      expect(unresolved(level1)).toEqual([]);
    }
  );

  test("the wizard list reaches level 2", () => {
    const level2 = spells.findAll({ cls: "wizard", level: 2 });

    expect(level2.length).toBeGreaterThan(0);
    expect(level2.filter((s) => s.level !== 2).map((s) => s.id)).toEqual([]);
  });

  test.each([{ cls: "paladin" as const }, { cls: "ranger" as const }])(
    "$cls knows no cantrips in the 2024 rules",
    ({ cls }) => {
      expect(spells.findAll({ cls, level: 0 })).toEqual([]);
    }
  );

  test("a paladin's level-1 list includes Bless and Cure Wounds", () => {
    expect(spellIds({ cls: "paladin", level: 1 })).toEqual(
      expect.arrayContaining(["bless", "cure-wounds"])
    );
  });

  test("a ranger's level-1 list includes Hunter's Mark and Cure Wounds", () => {
    expect(spellIds({ cls: "ranger", level: 1 })).toEqual(
      expect.arrayContaining(["hunters-mark", "cure-wounds"])
    );
  });

  test("a martial class has no spell list", () => {
    // fighter is absent from the per-class spell tables; the guard must hold at runtime
    expect(spells.findAll({ cls: "fighter", level: 1 })).toEqual([]);
  });

  test.each(
    CASTER_CLASSES.flatMap((cls) =>
      ([3, 4, 5, 6, 7, 8, 9] as const).map((level) => ({ cls, level }))
    )
  )("$cls level-$level spells resolve at the requested level", ({ cls, level }) => {
    const list = spells.findAll({ cls, level });
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((spell) => spell.level === level)).toBe(true);
    expect(unresolved(list)).toEqual([]);
  });

  test.each(["paladin", "ranger"] as const)("%s spell list ends at level 5", (cls) => {
    for (const level of [3, 4, 5] as const) {
      expect(spells.findAll({ cls, level }).length).toBeGreaterThan(0);
    }
    for (const level of [6, 7, 8, 9] as const) {
      expect(spells.findAll({ cls, level })).toEqual([]);
    }
  });

  test("higher-level spells are available by id and assigned to their SRD classes", () => {
    expect(spells.get({ id: "fireball" })).toMatchObject({ name: "Fireball", level: 3 });
    expect(spellIds({ cls: "wizard", level: 3 })).toContain("fireball");
    expect(spellIds({ cls: "cleric", level: 3 })).not.toContain("fireball");
    expect(spellIds({ cls: "wizard", level: 9 })).toContain("wish");
    expect(spellIds({ cls: "warlock", level: 9 })).toContain("weird");
  });
});

describe("spell metadata", () => {
  test("Fireball exposes its damage, saving throw, and slot scaling", () => {
    expect(spells.get({ id: "fireball" })).toMatchObject({
      damage: { dice: "8d6", type: ["fire"] },
      save: "Dexterity",
      atHigherLevels: "The damage increases by 1d6 for each spell slot level above 3.",
    });
  });

  test("Acid Arrow and Mind Spike retain their distinct damage and saves", () => {
    const acidArrow = spells.get({ id: "melfs-acid-arrow" });
    expect(acidArrow.damage).toEqual({ dice: "4d4 + 2d4", type: ["acid"] });
    expect(acidArrow.save).toBeUndefined();
    expect(spells.get({ id: "mind-spike" })).toMatchObject({
      damage: { dice: "3d8", type: ["psychic"] },
      save: "Wisdom",
    });
  });

  test("Inflict Wounds uses the damage and Constitution save in its description", () => {
    expect(spells.get({ id: "inflict-wounds" })).toMatchObject({
      damage: { dice: "2d10", type: ["necrotic"] },
      save: "Constitution",
    });
    expect(spells.get({ id: "ray-of-sickness" }).save).toBeUndefined();
  });

  test("combined damage and alternative saves remain visible", () => {
    expect(spells.get({ id: "meteor-swarm" }).damage).toEqual({
      dice: "20d6 + 20d6",
      type: ["fire", "bludgeoning"],
    });
    expect(spells.get({ id: "wall-of-ice" })).toMatchObject({
      damage: { dice: "10d6 / 5d6", type: ["cold"] },
      save: "Dexterity / Constitution",
    });
  });

  test("summoned creatures expose their attack damage and ability saves", () => {
    const dragon = spells.get({ id: "summon-dragon" });
    expect(dragon.damage?.type).toContain("piercing");
    expect(dragon.save).toBe("Dexterity");
    expect(spells.get({ id: "giant-insect" }).save).toBe("Constitution");
  });

  test("buffs, healing, and weapon damage do not become fixed damage or forced saves", () => {
    for (const id of ["haste", "beacon-of-hope", "cure-wounds", "true-strike"]) {
      const spell = spells.get({ id });
      expect(spell.damage).toBeUndefined();
      expect(spell.save).toBeUndefined();
    }
    expect(spells.get({ id: "color-spray" }).atHigherLevels).toBeUndefined();
    expect(spells.get({ id: "wall-of-force" }).atHigherLevels).toBeUndefined();
    expect(spells.get({ id: "true-strike" }).atHigherLevels).toContain("levels 5 (1d6)");
  });
});
