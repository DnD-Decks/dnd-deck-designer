import { describe, expect, test } from "vitest";

import { abilities, computeModifier } from "./abilities.model.ts";

describe("computeModifier()", () => {
  test.each([
    { score: 8, modifier: -1 },
    { score: 10, modifier: 0 },
    { score: 15, modifier: 2 },
    { score: 16, modifier: 3 },
  ])("a score of $score gives a modifier of $modifier", ({ score, modifier }) => {
    expect(computeModifier(score)).toBe(modifier);
  });
});

describe("abilities{}", () => {
  test("lists the six abilities in canonical order", () => {
    expect(abilities.list().map((a) => a.id)).toEqual(["str", "dex", "con", "int", "wis", "cha"]);
  });
});
