import { describe, expect, test } from "vitest";

import { classes } from "src/models/class/classes.model.ts";
import { resources } from "./resources.model.ts";

const allResources = () => classes.list().flatMap((c) => resources.findAll({ cls: c.id }));

// every resource has at least one copy, and no rest outside short and long
const invalidResources = () =>
  allResources()
    .filter(({ copies }) => {
      const rests = Object.keys(copies);
      const valid = rests.every((rest) => rest === "short-rest" || rest === "long-rest");
      return !valid || Object.values(copies).every((n) => !n);
    })
    .map((r) => r.id);

describe("resources.findAll()", () => {
  test("warlock mana is the Pact Magic slot: one level-1 copy a short rest brings back", () => {
    expect(resources.findAll({ cls: "warlock" })).toEqual([
      { id: "warlock-mana", name: "Mana", mana: 1, copies: { "short-rest": 1 } },
    ]);
  });

  test("a class with no vendored resources returns none", () => {
    expect(resources.findAll({ cls: "rogue" })).toEqual([]);
  });

  test("resource ids are unique across classes, each with copies on a short or long rest", () => {
    const ids = allResources().map((r) => r.id);

    expect(ids).toEqual([...new Set(ids)]);
    expect(invalidResources()).toEqual([]);
  });
});

describe("resources.recharges()", () => {
  [
    {
      label: "Second Wind: its short-rest copy first",
      id: "fighter-second-wind",
      expected: ["short-rest", "long-rest"],
    },
    {
      label: "Bardic Inspiration: long rest only",
      id: "bard-bardic-inspiration",
      expected: ["long-rest"],
    },
    { label: "Warlock mana: short rest only", id: "warlock-mana", expected: ["short-rest"] },
  ].forEach(({ label, id, expected }) => {
    test(label, () => {
      expect(resources.recharges(resources.get({ id }))).toEqual(expected);
    });
  });

  test("an unknown resource throws", () => {
    expect(() => resources.get({ id: "nope" })).toThrow("Unknown resource: nope");
  });
});
