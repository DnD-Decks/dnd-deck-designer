import { describe, expect, test } from "vitest";

import { dicePile, diceTower } from "src/models/damage/dice-pile.model";

describe("dicePile()", () => {
  [
    { dice: "1d10", expected: ["10"] },
    { dice: "2d6", expected: ["6", "6"] },
    { dice: "12d6", expected: ["6", "6", "6", "6", "6", "6"] },
    { dice: "1d10+2d6", expected: ["10", "6", "6"] },
    { dice: "2d10+4d6", expected: ["10", "10", "6", "6", "6", "6"] },
    { dice: "6d10+2d6", expected: ["10", "10", "10", "10", "10", "6"] },
    { dice: "1", expected: [] },
    { dice: "1d8+MOD", expected: ["8"] },
  ].forEach(({ dice, expected }) => {
    test(`"${dice}" piles ${expected.length} dice`, () => {
      expect(dicePile(dice)).toEqual(expected);
    });
  });
});

describe("diceTower()", () => {
  [
    { pile: ["a"], expected: [["a"]] },
    { pile: ["a", "b"], expected: [["a", "b"]] },
    { pile: ["a", "b", "c"], expected: [["a"], ["b", "c"]] },
    {
      pile: ["a", "b", "c", "d"],
      expected: [
        ["a", "b"],
        ["c", "d"],
      ],
    },
    {
      pile: ["a", "b", "c", "d", "e"],
      expected: [
        ["a", "b"],
        ["c", "d", "e"],
      ],
    },
  ].forEach(({ pile, expected }) => {
    test(`${pile.length} dice stack as ${expected.map((row) => row.length).join(" over ")}`, () => {
      expect(diceTower(pile)).toEqual(expected);
    });
  });
});
