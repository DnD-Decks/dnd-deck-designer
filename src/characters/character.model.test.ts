import { describe, expect, test } from "vitest";

import { brunhilde } from "./character.fixture.ts";
import { characters } from "./character.model.ts";

describe("characters.create()", () => {
  test("starts a level-1 character with no picks", () => {
    const hero = characters.create({ name: "Elminster", cls: "wizard" });

    expect(hero).toEqual({
      id: expect.any(String),
      name: "Elminster",
      cls: "wizard",
      level: 1,
      picks: {},
    });
  });

  test("gives every character its own id", () => {
    const a = characters.create({ name: "A", cls: "fighter" });
    const b = characters.create({ name: "B", cls: "fighter" });

    expect(a.id).not.toBe(b.id);
  });
});

describe("characters.parse()", () => {
  test("keeps a well-formed character", () => {
    expect(characters.parse(brunhilde())).toEqual({
      id: "f1",
      name: "Brünhilde",
      cls: "fighter",
      level: 1,
      picks: { weapons: ["longsword", "shortbow", "dagger"] },
    });
  });

  [
    { label: "a non-object", value: "fighter" },
    { label: "a missing id", value: { ...brunhilde(), id: undefined } },
    { label: "a blank name", value: { ...brunhilde(), name: "  " } },
    { label: "an unknown class", value: { ...brunhilde(), cls: "illithid" } },
    { label: "a level beyond 1", value: { ...brunhilde(), level: 2 } },
    { label: "a rule the class does not have", value: { ...brunhilde(), picks: { cantrips: [] } } },
    { label: "picks that are not strings", value: { ...brunhilde(), picks: { weapons: [1] } } },
    { label: "a custom that is not a list", value: { ...brunhilde(), picks: { custom: "x" } } },
    {
      label: "custom keys that are not strings",
      value: { ...brunhilde(), picks: { custom: [7] } },
    },
    {
      label: "a weapon the class cannot pick",
      value: { ...brunhilde(), picks: { weapons: ["x"] } },
    },
  ].forEach(({ label, value }) =>
    test(`rejects ${label}`, () => {
      expect(characters.parse(value)).toBeUndefined();
    })
  );
});

describe("characters.toShareCode()", () => {
  test("is URL-safe", () => {
    expect(characters.toShareCode(brunhilde())).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe("characters.fromShareCode()", () => {
  test("round-trips the build under a new id", () => {
    const imported = characters.fromShareCode(characters.toShareCode(brunhilde()));

    expect({ ...imported, id: "new" }).toEqual({
      id: "new",
      name: "Brünhilde",
      cls: "fighter",
      level: 1,
      picks: { weapons: ["longsword", "shortbow", "dagger"] },
    });
    expect(imported?.id).not.toBe("f1");
  });

  test("round-trips custom card keys", () => {
    const hero = {
      ...brunhilde(),
      picks: { ...brunhilde().picks, custom: ["spell-cure-wounds", "feat-rogue-sneak-attack"] },
    };

    const imported = characters.fromShareCode(characters.toShareCode(hero));

    expect(imported?.picks.custom).toEqual(["spell-cure-wounds", "feat-rogue-sneak-attack"]);
  });

  test("a payload without custom still parses", () => {
    const imported = characters.fromShareCode(characters.toShareCode(brunhilde()));

    expect(imported?.picks.custom).toBeUndefined();
    expect(imported?.picks.weapons).toEqual(["longsword", "shortbow", "dagger"]);
  });

  [
    { label: "not base64", code: "%%%" },
    { label: "not JSON", code: btoa("fighter") },
    { label: "an invalid build", code: btoa(JSON.stringify({ cls: "illithid" })) },
    { label: "empty", code: "" },
  ].forEach(({ label, code }) =>
    test(`a code that is ${label} decodes to nothing`, () => {
      expect(characters.fromShareCode(code)).toBeUndefined();
    })
  );
});
