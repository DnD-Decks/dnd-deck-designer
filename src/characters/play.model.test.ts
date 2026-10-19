import { describe, expect, test } from "vitest";

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

describe("play.sections()", () => {
  test("groups the deck in table order: Resources, Weapons, Features, Cantrips, Spells", () => {
    const pick = (key: string) => {
      const card = decks.findCard({ key });
      if (!card) throw new Error(`unknown card ${key}`);
      return { key, card };
    };
    const entries = [
      pick("spell-magic-missile"),
      pick("spell-fire-bolt"),
      pick("feat-fighter-fighting-style"),
      pick("weapon-longsword"),
      pick("resource-fighter-second-wind"),
    ];

    const labels = play.sections(entries).map(({ label }) => label);
    expect(labels).toEqual(["Resources", "Weapons", "Features", "Cantrips", "Spells"]);
  });

  test("a level-0 spell sits in Cantrips, a levelled one in Spells", () => {
    const cantrip = decks.findCard({ key: "spell-fire-bolt" });
    const level1 = decks.findCard({ key: "spell-magic-missile" });
    if (!cantrip || !level1) throw new Error("fixture cards missing");

    expect(play.sectionOf(cantrip)).toBe("Cantrips");
    expect(play.sectionOf(level1)).toBe("Spells");
  });

  test("empty sections are dropped", () => {
    // a fresh fighter has only resources and features
    const labels = play.sections(entriesOf("fighter")).map(({ label }) => label);
    expect(labels).toEqual(["Resources", "Features"]);
  });
});

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
      if (!entry) throw new Error(`no entry ${key}`);

      expect(play.spendable(entry)).toBe(expected);
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
      expect(keysOf(recovered)).toEqual(expected);
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
      expect(play.restores({ entries, rest })).toEqual(expected);
    });
  });
});

// The newer play controls must recover the right number of level-unlocked resources.
describe("level-three resource recovery", () => {
  test.each([
    { cls: "cleric", id: "channel-divinity" },
    { cls: "druid", id: "wild-shape" },
    { cls: "paladin", id: "channel-divinity" },
  ] as const)("$cls restores one $id use on a Short Rest", ({ cls, id }) => {
    const entries = decks.forCharacter({ ...hero(cls), level: 3 }).entries;
    const spent = entries
      .filter(({ card }) => card.kind === "resource" && card.resource.id === `${cls}-${id}`)
      .map(({ key }) => key);
    expect(spent).toHaveLength(2);
    expect(play.recovered({ entries, spent, rest: "short-rest" }).map(({ key }) => key)).toEqual(
      spent.slice(0, 1)
    );
    expect(play.recovered({ entries, spent, rest: "long-rest" }).map(({ key }) => key)).toEqual(
      spent
    );
  });

  test.each([
    { cls: "monk", id: "focus-points", short: 3 },
    { cls: "sorcerer", id: "sorcery-points", short: 0 },
  ] as const)(
    "$cls can spend each point and recover it at the right rest",
    ({ cls, id, short }) => {
      const entries = decks.forCharacter({ ...hero(cls), level: 3 }).entries;
      const points = entries.filter(
        ({ card }) => card.kind === "resource" && card.resource.id === `${cls}-${id}`
      );
      const spent = points.map(({ key }) => key);
      expect(points).toHaveLength(3);
      expect(points.every(play.spendable)).toBe(true);
      expect(play.recovered({ entries, spent, rest: "short-rest" })).toHaveLength(short);
      expect(play.recovered({ entries, spent, rest: "long-rest" })).toHaveLength(3);
    }
  );
});
