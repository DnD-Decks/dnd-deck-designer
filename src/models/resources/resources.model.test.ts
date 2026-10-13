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
