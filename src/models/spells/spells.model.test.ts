import { describe, expect, test } from "vitest";

import type { CharacterClass } from "src/models/class/classes.model.ts";
import cantripsData from "../../data/spells/spells-level-0.json" with { type: "json" };
import spellsLevel1Data from "../../data/spells/spells-level-1.json" with { type: "json" };
import spellsLevel2Data from "../../data/spells/spells-level-2.json" with { type: "json" };
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
      Object.keys(spellsLevel2Data).length;

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

  test("no spells beyond level 2 are vendored", () => {
    expect(spells.findAll({ cls: "wizard", level: 3 })).toEqual([]);
  });
});
