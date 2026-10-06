import assert from "node:assert/strict";
import { describe, test } from "vitest";

import type { Character } from "src/characters/character.model";
import type { CharacterClass } from "src/models/class/classes.model";
import type { RestType } from "src/models/rest/rest-actions.model";
import { decks } from "../decks/deck.model.ts";
import { brunhilde } from "./character.fixture.ts";
import { play } from "./play.model.ts";

const hero = (cls: CharacterClass): Character => ({ ...brunhilde(), cls, picks: {} });

const entriesOf = (cls: CharacterClass) => decks.forCharacter(hero(cls)).entries;

const keysOf = (entries: readonly { key: string }[]) => entries.map(({ key }) => key);

type SpendableCase = { label: string; cls: CharacterClass; key: string; expected: boolean };
type RecoveredCase = {
  label: string;
  cls: CharacterClass;
  rest: RestType;
  spent: string[];
  expected: string[];
};
type RestoresCase = { cls: CharacterClass; rest: RestType; expected: string[] };

describe("play.spendable()", () => {
  (
    [
      {
        label: "a resource",
        cls: "fighter",
        key: "resource-fighter-second-wind-0",
        expected: true,
      },
      { label: "a feature", cls: "fighter", key: "feat-fighter-fighting-style-0", expected: false },
    ] satisfies SpendableCase[]
  ).forEach(({ label, cls, key, expected }) => {
    test(`${label}: ${expected}`, () => {
      const entry = entriesOf(cls).find((e) => e.key === key);
      assert.ok(entry);
      assert.equal(play.spendable(entry), expected);
    });
  });
});

describe("play.recovered()", () => {
  (
    [
      {
        label: "a short rest brings back one Second Wind",
        cls: "fighter",
        rest: "short-rest",
        spent: ["resource-fighter-second-wind-0", "resource-fighter-second-wind-1"],
        expected: ["resource-fighter-second-wind-0"],
      },
      {
        label: "a long rest brings back every Second Wind",
        cls: "fighter",
        rest: "long-rest",
        spent: ["resource-fighter-second-wind-0", "resource-fighter-second-wind-1"],
        expected: ["resource-fighter-second-wind-0", "resource-fighter-second-wind-1"],
      },
      {
        label: "a short rest brings back all Warlock mana",
        cls: "warlock",
        rest: "short-rest",
        spent: ["resource-warlock-mana-0"],
        expected: ["resource-warlock-mana-0"],
      },
      {
        label: "a short rest leaves wizard mana spent",
        cls: "wizard",
        rest: "short-rest",
        spent: ["resource-wizard-mana-0", "resource-wizard-mana-1"],
        expected: [],
      },
      {
        label: "a short rest brings back one Rage",
        cls: "barbarian",
        rest: "short-rest",
        spent: ["resource-barbarian-rage-1"],
        expected: ["resource-barbarian-rage-1"],
      },
      {
        label: "a long rest refills the Lay on Hands pool",
        cls: "paladin",
        rest: "long-rest",
        spent: ["resource-paladin-lay-on-hands-0"],
        expected: ["resource-paladin-lay-on-hands-0"],
      },
      {
        label: "nothing spent, nothing to bring back",
        cls: "fighter",
        rest: "long-rest",
        spent: [],
        expected: [],
      },
    ] satisfies RecoveredCase[]
  ).forEach(({ label, cls, rest, spent, expected }) => {
    test(label, () => {
      const recovered = play.recovered({
        entries: entriesOf(cls),
        spent,
        rest,
      });
      assert.deepEqual(keysOf(recovered), expected);
    });
  });
});

describe("play.restores()", () => {
  (
    [
      { cls: "fighter", rest: "short-rest", expected: ["Second Wind"] },
      { cls: "wizard", rest: "short-rest", expected: [] },
      { cls: "paladin", rest: "long-rest", expected: ["Mana", "Lay on Hands"] },
    ] satisfies RestoresCase[]
  ).forEach(({ cls, rest, expected }) => {
    test(`${cls} after a ${rest}: ${expected.join(", ") || "nothing"}`, () => {
      const entries = entriesOf(cls);
      assert.deepEqual(play.restores({ entries, rest }), expected);
    });
  });
});
