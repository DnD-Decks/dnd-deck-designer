import { describe, expect, test } from "vitest";

import { headerDamage } from "src/models/damage/header-damage.model";

describe("headerDamage()", () => {
  [
    {
      label: "one type",
      damage: { dice: "1d10", types: ["fire"] },
      expected: { shown: "1d10", pile: ["10"], word: "fire", glyphs: ["fire"] },
    },
    {
      label: "one type per dice term",
      damage: { dice: "1d10 + 2d6", types: ["piercing", "cold"] },
      expected: {
        shown: "1d10+2d6",
        pile: ["10", "6", "6"],
        word: "piercing + cold",
        glyphs: ["piercing", "cold"],
      },
    },
    {
      label: "a choice of types",
      damage: { dice: "3d8", types: ["acid", "cold", "fire", "lightning", "poison", "thunder"] },
      expected: { shown: "3d8", pile: ["8", "8", "8"], word: "varies", glyphs: ["wildcard"] },
    },
    {
      label: "physical or magical",
      damage: { dice: "1d8 + spellcasting ability modifier", types: ["bludgeoning", "force"] },
      expected: { shown: "1d8+MOD", pile: ["8"], word: "force | normal", glyphs: ["force"] },
    },
    {
      label: "alternative formulas",
      damage: {
        dice: "5d8 / 4d6 + spellcasting ability modifier",
        types: ["force", "bludgeoning"],
      },
      expected: {
        shown: "5d8",
        pile: ["8", "8", "8", "8", "8"],
        word: "varies",
        glyphs: ["wildcard"],
      },
    },
    {
      label: "a multiplied formula",
      damage: { dice: "3x(1d4+1)", types: ["force"] },
      expected: { shown: "3x(1d4+1)", pile: ["4"], word: "force", glyphs: ["force"] },
    },
    {
      label: "two magical types to choose from",
      damage: { dice: "3d8", types: ["radiant", "necrotic"] },
      expected: { shown: "3d8", pile: ["8", "8", "8"], word: "varies", glyphs: ["wildcard"] },
    },
    {
      label: "two physical types to choose from",
      damage: { dice: "7d8", types: ["piercing", "slashing"] },
      expected: {
        shown: "7d8",
        pile: ["8", "8", "8", "8", "8", "8"],
        word: "varies",
        glyphs: ["wildcard"],
      },
    },
    {
      label: "spell level and a note",
      damage: { dice: "1d6 + 3 + spell level (Rend); 2d6 (breath)", types: ["piercing"] },
      expected: { shown: "1d6+3+SL", pile: ["6"], word: "piercing", glyphs: ["piercing"] },
    },
  ].forEach(({ label, damage, expected }) => {
    test(label, () => {
      expect(headerDamage(damage)).toEqual(expected);
    });
  });
});
