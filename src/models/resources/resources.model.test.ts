import assert from "node:assert/strict";
import { describe, expect, test } from "vitest";

import { classes } from "src/models/class/classes.model.ts";
import { resources } from "./resources.model.ts";

const VALID_RECHARGES = ["short-rest", "long-rest"];

const allResources = () => classes.list().flatMap((c) => resources.findAll({ cls: c.id }));

const invalidResources = () =>
  allResources()
    .filter((r) => r.uses < 1 || !VALID_RECHARGES.includes(r.recharge))
    .map((r) => r.id);

describe("resources.findAll()", () => {
  test("warlock mana is the Pact Magic slot: 1 use, short-rest recharge", () => {
    const summary = resources
      .findAll({ cls: "warlock" })
      .map(({ id, uses, recharge }) => ({ id, uses, recharge }));

    expect(summary).toEqual([{ id: "warlock-mana", uses: 1, recharge: "short-rest" }]);
  });

  test("a class with no vendored resources returns none", () => {
    expect(resources.findAll({ cls: "rogue" })).toEqual([]);
  });

  test("resource ids are unique across classes, with uses and a valid recharge", () => {
    const ids = allResources().map((r) => r.id);

    expect(ids).toEqual([...new Set(ids)]);
    expect(invalidResources()).toEqual([]);
  });
});

test("warlock reaches two level-two Pact Magic slots, without ordinary spell slots", () => {
  const cards = resources.findAll({ cls: "warlock", level: 3 });
  const mana = cards.find((card) => card.id === "warlock-mana");
  assert.equal(mana?.uses, 2);
  assert.equal(mana?.recharge, "short-rest");
  assert.match(mana?.description ?? "", /level-2 Pact Magic/);
  assert.ok(!cards.some((card) => card.name === "Level 2 Mana"));
  assert.ok(cards.some((card) => card.name === "Magical Cunning"));
});

test("level-three full casters have four first-level and two second-level slots", () => {
  for (const cls of ["bard", "cleric", "druid", "sorcerer", "wizard"] as const) {
    const cards = resources.findAll({ cls, level: 3 });
    assert.equal(cards.find((card) => card.id === `${cls}-mana`)?.uses, 4, cls);
    assert.equal(cards.find((card) => card.id === `${cls}-mana-2`)?.uses, 2, cls);
  }
});

test("half casters retain only first-level slots through level three", () => {
  for (const cls of ["paladin", "ranger"] as const) {
    const cards = resources.findAll({ cls, level: 3 });
    assert.equal(cards.find((card) => card.id === `${cls}-mana`)?.uses, 3);
    assert.ok(!cards.some((card) => card.id === `${cls}-mana-2`));
  }
});

test("level-three resources use SRD pool sizes", () => {
  for (const [cls, id, uses] of [
    ["barbarian", "rage", 3],
    ["cleric", "channel-divinity", 2],
    ["druid", "wild-shape", 2],
    ["monk", "focus-points", 3],
    ["paladin", "lay-on-hands", 15],
    ["paladin", "channel-divinity", 2],
    ["sorcerer", "sorcery-points", 3],
  ] as const) {
    assert.equal(
      resources.findAll({ cls, level: 3 }).find((card) => card.id === `${cls}-${id}`)?.uses,
      uses,
      `${cls} ${id}`
    );
  }
});
