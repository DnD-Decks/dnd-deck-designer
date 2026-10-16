import assert from "node:assert/strict";
import { describe, expect, test } from "vitest";

import { classes } from "src/models/class/classes.model.ts";
import { choices } from "./choices.model.ts";

import type { CharacterClass } from "src/models/class/classes.model";
import { progression } from "src/models/class/progression.model";

const ruleOf = ({ cls, id }: { cls: CharacterClass; id: string }) =>
  choices.for({ cls, level: 1 }).find((rule) => rule.id === id);

describe("choices.for()", () => {
  test.each<{ cls: CharacterClass; prepared: number[] }>([
    { cls: "bard", prepared: [4, 5, 6] },
    { cls: "cleric", prepared: [4, 5, 6] },
    { cls: "druid", prepared: [4, 5, 6] },
    { cls: "wizard", prepared: [4, 5, 6] },
    { cls: "sorcerer", prepared: [2, 4, 6] },
    { cls: "warlock", prepared: [2, 3, 4] },
    { cls: "paladin", prepared: [2, 3, 4] },
    { cls: "ranger", prepared: [2, 3, 4] },
  ])("$cls prepared choices follow SRD progression", ({ cls, prepared }) => {
    assert.deepEqual(
      progression.levels.map(
        (level) => choices.for({ cls, level }).find((rule) => rule.id === "prepared")?.pick
      ),
      prepared
    );
  });
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
  for (const { id: cls } of classes.list()) {
    for (const level of progression.levels) {
      test(`${cls} level ${level} can complete all choices`, () => {
        const picks = Object.fromEntries(
          choices
            .for({ cls, level })
            .map((rule) => [rule.id, choices.options({ cls, rule }).slice(0, rule.pick)])
        );
        assert.deepEqual(choices.validate({ cls, level, picks }), []);
      });
    }
  }

  test("level-three wizard can mix first- and second-level prepared spells", () => {
    const prepared = (level: 1 | 2 | 3) =>
      choices.for({ cls: "wizard", level }).find((rule) => rule.id === "prepared");
    const options = (level: 1 | 2 | 3) => {
      const rule = prepared(level);
      assert.ok(rule);
      return choices.options({ cls: "wizard", rule });
    };
    assert.ok(options(3).includes("misty-step"));
    assert.ok(options(3).includes("shield"));
    assert.ok(!options(2).includes("misty-step"));
  });

  test("always-prepared spells do not consume a spell choice", () => {
    const rule = choices.for({ cls: "cleric", level: 3 }).find((rule) => rule.id === "prepared");
    assert.ok(rule);
    assert.equal(rule.pick, 6);
    assert.ok(!choices.options({ cls: "cleric", rule }).includes("bless"));
    assert.ok(choices.picked({ cls: "cleric", level: 3, picks: {} }).spell.has("bless"));
  });
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

describe("choices.reconcile()", () => {
  test("downgrading removes unavailable spells, trims counts, and retains valid choices", () => {
    assert.deepEqual(
      choices.reconcile({
        cls: "wizard",
        level: 1,
        picks: {
          cantrips: ["fire-bolt"],
          prepared: [
            "misty-step",
            "shield",
            "magic-missile",
            "mage-armor",
            "detect-magic",
            "sleep",
          ],
          weapons: ["dagger"],
        },
      }),
      {
        cantrips: ["fire-bolt"],
        prepared: ["shield", "magic-missile", "mage-armor", "detect-magic"],
        weapons: ["dagger"],
      }
    );
  });

  test("old ranger picks remain readable when Hunter's Mark becomes automatic", () => {
    const picks = { prepared: ["hunters-mark", "cure-wounds"] };
    assert.ok(
      !choices
        .validate({ cls: "ranger", level: 1, picks })
        .some((issue) => issue.problem === "unknown")
    );
    assert.deepEqual(choices.reconcile({ cls: "ranger", level: 1, picks }), {
      prepared: ["cure-wounds"],
    });
    assert.ok(
      choices
        .validate({ cls: "ranger", level: 1, picks: { weapons: ["hunters-mark"] } })
        .some((issue) => issue.problem === "unknown")
    );
  });
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
