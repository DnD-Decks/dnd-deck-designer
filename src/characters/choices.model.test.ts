import assert from "node:assert/strict";
import { describe, test } from "vitest";

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
      assert.deepEqual([pick("cantrips"), pick("prepared")], [cantrips, prepared]);
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
    assert.deepEqual([rule?.pick, rule?.optional], [count, undefined]);
  });

  test("monk has no spells and optional weapons only", () => {
    const rules = choices.for({ cls: "monk", level: 1 });
    assert.deepEqual(
      rules.map((r) => [r.id, r.optional]),
      [["weapons", true]]
    );
  });
});

describe("choices.options()", () => {
  test.each(classes.list().map(({ id }) => ({ cls: id })))(
    "$cls has enough options for every rule",
    ({ cls }) => {
      const rules = choices.for({ cls, level: 1 });
      assert.deepEqual(
        rules.map((rule) => [rule.id, choices.options({ cls, rule }).length >= rule.pick]),
        rules.map((rule) => [rule.id, true])
      );
    }
  );
});

describe("choices.validate()", () => {
  test("an empty wizard build is missing cantrips and prepared spells", () => {
    const issues = choices.validate({ cls: "wizard", level: 1, picks: {} });
    assert.deepEqual(
      issues.map((i) => [i.rule.id, i.problem, "count" in i && i.count]),
      [
        ["cantrips", "missing", 3],
        ["prepared", "missing", 4],
      ]
    );
  });

  test("a complete fighter build has no issues", () => {
    const picks = { weapons: ["longsword", "greatsword", "longbow"] };
    assert.deepEqual(choices.validate({ cls: "fighter", level: 1, picks }), []);
  });

  test("an optional rule left empty is not an issue", () => {
    assert.deepEqual(choices.validate({ cls: "monk", level: 1, picks: {} }), []);
  });

  test("reports too many picks", () => {
    const issues = choices.validate({
      cls: "fighter",
      level: 1,
      picks: { weapons: ["longsword", "greatsword", "longbow", "dagger"] },
    });
    assert.deepEqual(
      issues.map((i) => [i.problem, "count" in i && i.count]),
      [["too-many", 1]]
    );
  });

  test("reports ids the class cannot pick", () => {
    const issues = choices.validate({
      cls: "wizard",
      level: 1,
      picks: { cantrips: ["fire-bolt", "not-a-spell"] },
    });
    const cantrips = issues.find((i) => i.rule.id === "cantrips");
    assert.deepEqual(cantrips?.problem === "unknown" && cantrips.ids, ["not-a-spell"]);
  });
});

describe("choices.picked()", () => {
  test("groups ids by card kind", () => {
    const picked = choices.picked({
      cls: "paladin",
      level: 1,
      picks: { prepared: ["bless"], weapons: ["longsword"] },
    });
    assert.deepEqual([[...picked.spell], [...picked.weapon]], [["bless"], ["longsword"]]);
  });
});
