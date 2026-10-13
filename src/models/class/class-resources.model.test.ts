import { describe, expect, test } from "vitest";

import {
  classResources,
  resolveResourceResetOn,
  resolveResourcesForLevel,
} from "./class-resources.model.ts";

import type { AbilityScores } from "../abilities/abilities.model.ts";

// Standard array scores for most tests.
const DEFAULT_SCORES: AbilityScores = {
  str: 15,
  dex: 14,
  con: 13,
  int: 12,
  wis: 10,
  cha: 8,
};

describe("classResources{}", () => {
  test("lists a resource shared by classes once", () => {
    const occurrences = classResources
      .list()
      .filter((r) => r.id === "spell-slot-1st")
      .map((r) => r.id);

    expect(occurrences).toEqual(["spell-slot-1st"]);
  });
});

describe("resolveResourceResetOn()", () => {
  test("the warlock pact slot resets on a short rest", () => {
    expect(resolveResourceResetOn({ cls: "warlock", id: "pact-magic-slot" })).toBe("short-rest");
  });

  test("throws for a resource the class does not have", () => {
    expect(() => resolveResourceResetOn({ cls: "barbarian", id: "pact-magic-slot" })).toThrow(
      /Unknown resource/
    );
  });

  test("throws for an unknown class", () => {
    expect(() => resolveResourceResetOn({ cls: "artificer" as "barbarian", id: "rage" })).toThrow(
      /unknown class/
    );
  });
});

describe("resolveResourcesForLevel()", () => {
  test.each([
    { level: 1, expected: [{ resourceId: "rage", current: 2, max: 2 }] },
    { level: 3, expected: [{ resourceId: "rage", current: 3, max: 3 }] },
  ])("barbarian rage uses scale with level (L$level)", ({ level, expected }) => {
    expect(resolveResourcesForLevel({ cls: "barbarian", level, scores: DEFAULT_SCORES })).toEqual(
      expected
    );
  });

  test.each([
    {
      label: "the cha modifier",
      scores: { ...DEFAULT_SCORES, cha: 16 },
      expected: [{ resourceId: "bardic-inspiration", current: 3, max: 3 }],
    },
    {
      label: "a floor of 1",
      scores: DEFAULT_SCORES,
      expected: [{ resourceId: "bardic-inspiration", current: 1, max: 1 }],
    },
  ])("bardic inspiration at L1 sizes from $label", ({ scores, expected }) => {
    const found = resolveResourcesForLevel({ cls: "bard", level: 1, scores });
    expect(found).toEqual([...expected, { resourceId: "spell-slot-1st", current: 2, max: 2 }]);
  });

  test.each([
    { level: 1, expected: [] },
    { level: 2, expected: [{ resourceId: "discipline-points", current: 2, max: 2 }] },
  ])("monk resources at L$level", ({ level, expected }) => {
    expect(resolveResourcesForLevel({ cls: "monk", level, scores: DEFAULT_SCORES })).toEqual(
      expected
    );
  });

  test.each([{ level: 1 }, { level: 5 }])("rogue has no resources at L$level", ({ level }) => {
    expect(resolveResourcesForLevel({ cls: "rogue", level, scores: DEFAULT_SCORES })).toEqual([]);
  });

  test("wizard at L1 has arcane-recovery and two level-1 slots", () => {
    expect(resolveResourcesForLevel({ cls: "wizard", level: 1, scores: DEFAULT_SCORES })).toEqual([
      { resourceId: "arcane-recovery", current: 1, max: 1 },
      { resourceId: "spell-slot-1st", current: 2, max: 2 },
    ]);
  });

  test("paladin at L1 has only lay-on-hands (no slots or channel divinity yet)", () => {
    expect(resolveResourcesForLevel({ cls: "paladin", level: 1, scores: DEFAULT_SCORES })).toEqual([
      { resourceId: "lay-on-hands", current: 5, max: 5 },
    ]);
  });

  test("throws for a level outside 1–5", () => {
    expect(() =>
      resolveResourcesForLevel({ cls: "barbarian", level: 0, scores: DEFAULT_SCORES })
    ).toThrow(/level must be an integer 1–5/);
  });

  test("throws for an unknown class", () => {
    expect(() =>
      resolveResourcesForLevel({
        cls: "artificer" as "barbarian",
        level: 1,
        scores: DEFAULT_SCORES,
      })
    ).toThrow(/no data for class/);
  });
});
