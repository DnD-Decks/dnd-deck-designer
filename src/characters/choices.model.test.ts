import { describe, expect, test } from "vitest";

import { classes } from "src/models/class/classes.model.ts";
import { choices } from "./choices.model.ts";

import type { CharacterClass } from "src/models/class/classes.model";

const ruleOf = ({ cls, id }: { cls: CharacterClass; id: string }) =>
  choices.for({ cls, level: 1 }).find((rule) => rule.id === id);

describe("choices.for()", () => {
  // 2024 PHB level-1 cantrips / prepared spells
  test.each<{ cls: CharacterClass; cantrips: number; prepared: number }>([
    { cls: "bard", cantrips: 2, prepared: 4 },
    { cls: "cleric", cantrips: 3, prepared: 4 },
    { cls: "druid", cantrips: 2, prepared: 4 },
    { cls: "sorcerer", cantrips: 4, prepared: 2 },
    { cls: "warlock", cantrips: 2, prepared: 2 },
    { cls: "wizard", cantrips: 3, prepared: 4 },
    { cls: "paladin", cantrips: 0, prepared: 2 },
    { cls: "ranger", cantrips: 0, prepared: 2 },
  ])(
    "$cls picks $cantrips cantrips and $prepared prepared spells",
    ({ cls, cantrips, prepared }) => {
      const pick = (id: string) => ruleOf({ cls, id })?.pick ?? 0;
      expect([pick("cantrips"), pick("prepared")]).toEqual([cantrips, prepared]);
    }
  );

  test.each<{ cls: CharacterClass; count: number }>([
    { cls: "barbarian", count: 2 },
    { cls: "fighter", count: 3 },
    { cls: "paladin", count: 2 },
    { cls: "ranger", count: 2 },
    { cls: "rogue", count: 2 },
  ])("$cls must pick $count Weapon Mastery weapons", ({ cls, count }) => {
    const rule = ruleOf({ cls, id: "weapons" });
    expect([rule?.pick, rule?.optional]).toEqual([count, undefined]);
  });

  test("monk has no spells and optional weapons only", () => {
    const rules = choices.for({ cls: "monk", level: 1 });
    expect(rules.map((r) => [r.id, r.optional])).toEqual([["weapons", true]]);
  });
});

describe("choices.options()", () => {
  test.each(classes.list().map(({ id }) => ({ cls: id })))(
    "$cls has enough options for every rule",
    ({ cls }) => {
      const shortfalls = choices
        .for({ cls, level: 1 })
        .filter((rule) => choices.options({ cls, rule }).length < rule.pick)
        .map((rule) => rule.id);

      expect(shortfalls).toEqual([]);
    }
  );
});

describe("choices.validate()", () => {
  test("an empty wizard build is missing cantrips and prepared spells", () => {
    const issues = choices.validate({ cls: "wizard", level: 1, picks: {} });
    expect(issues.map((i) => [i.rule.id, i.problem, "count" in i && i.count])).toEqual([
      ["cantrips", "missing", 3],
      ["prepared", "missing", 4],
    ]);
  });

  test("a complete fighter build has no issues", () => {
    const picks = { weapons: ["longsword", "greatsword", "longbow"] };
    expect(choices.validate({ cls: "fighter", level: 1, picks })).toEqual([]);
  });

  test("an optional rule left empty is not an issue", () => {
    expect(choices.validate({ cls: "monk", level: 1, picks: {} })).toEqual([]);
  });

  test("reports too many picks", () => {
    const issues = choices.validate({
      cls: "fighter",
      level: 1,
      picks: { weapons: ["longsword", "greatsword", "longbow", "dagger"] },
    });
    expect(issues.map((i) => [i.problem, "count" in i && i.count])).toEqual([["too-many", 1]]);
  });

  test("reports ids the class cannot pick", () => {
    const issues = choices.validate({
      cls: "wizard",
      level: 1,
      picks: { cantrips: ["fire-bolt", "not-a-spell"] },
    });
    const cantrips = issues.find((i) => i.rule.id === "cantrips");
    expect(cantrips?.problem === "unknown" && cantrips.ids).toEqual(["not-a-spell"]);
  });
});

describe("choices.picked()", () => {
  test("groups ids by card kind", () => {
    const picked = choices.picked({
      cls: "paladin",
      level: 1,
      picks: { prepared: ["bless"], weapons: ["longsword"] },
    });
    expect([[...picked.spell], [...picked.weapon]]).toEqual([["bless"], ["longsword"]]);
  });
});
