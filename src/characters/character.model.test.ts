import assert from "node:assert/strict";
import { describe, test } from "vitest";

import { brunhilde } from "./character.fixture.ts";
import { characters } from "./character.model.ts";

describe("characters.create()", () => {
  test("create starts a level-1 character with no picks", () => {
    const hero = characters.create({ name: "Elminster", cls: "wizard" });
    assert.equal(hero.level, 1);
    assert.deepEqual(hero.picks, {});
    assert.ok(hero.id.length > 0);
  });

  test("create gives every character its own id", () => {
    const a = characters.create({ name: "A", cls: "fighter" });
    const b = characters.create({ name: "B", cls: "fighter" });
    assert.notEqual(a.id, b.id);
  });
});

describe("characters.parse()", () => {
  test("keeps a well-formed character", () => {
    assert.deepEqual(characters.parse(brunhilde()), {
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
    {
      label: "a weapon the class cannot pick",
      value: { ...brunhilde(), picks: { weapons: ["x"] } },
    },
  ].forEach(({ label, value }) =>
    test(`rejects ${label}`, () => {
      assert.equal(characters.parse(value), undefined);
    })
  );
});

describe("characters.toShareCode()", () => {
  test("is URL-safe", () => {
    assert.match(characters.toShareCode(brunhilde()), /^[A-Za-z0-9_-]+$/);
  });
});

describe("characters.fromShareCode()", () => {
  test("round-trips the build under a new id", () => {
    const imported = characters.fromShareCode(characters.toShareCode(brunhilde()));
    assert.deepEqual(
      { ...imported, id: "new" },
      {
        id: "new",
        name: "Brünhilde",
        cls: "fighter",
        level: 1,
        picks: { weapons: ["longsword", "shortbow", "dagger"] },
      }
    );
    assert.notEqual(imported?.id, "f1");
  });

  [
    { label: "not base64", code: "%%%" },
    { label: "not JSON", code: btoa("fighter") },
    { label: "an invalid build", code: btoa(JSON.stringify({ cls: "illithid" })) },
    { label: "empty", code: "" },
  ].forEach(({ label, code }) =>
    test(`a code that is ${label} decodes to nothing`, () => {
      assert.equal(characters.fromShareCode(code), undefined);
    })
  );
});
