import assert from "node:assert/strict";
import { describe, test } from "vitest";

import type { Character } from "src/characters/character.model";
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

const fighter: Character = {
  id: "f1",
  name: "Brünhilde",
  cls: "fighter",
  level: 1,
  picks: { weapons: ["longsword", "shortbow", "dagger"] },
};

describe("characters.parse()", () => {
  test("keeps a well-formed character", () => {
    assert.deepEqual(characters.parse(structuredClone(fighter)), fighter);
  });

  test.each([
    { label: "a non-object", value: "fighter" },
    { label: "a missing id", value: { ...fighter, id: undefined } },
    { label: "a blank name", value: { ...fighter, name: "  " } },
    { label: "an unknown class", value: { ...fighter, cls: "illithid" } },
    { label: "a level beyond 1", value: { ...fighter, level: 2 } },
    { label: "a rule the class does not have", value: { ...fighter, picks: { cantrips: [] } } },
    { label: "picks that are not strings", value: { ...fighter, picks: { weapons: [1] } } },
    { label: "a weapon the class cannot pick", value: { ...fighter, picks: { weapons: ["x"] } } },
  ])("rejects $label", ({ value }) => {
    assert.equal(characters.parse(value), undefined);
  });
});

describe("characters share code", () => {
  test("round-trips the build under a new id", () => {
    const imported = characters.fromShareCode(characters.toShareCode(fighter));
    assert.ok(imported);
    const { id, ...build } = imported;
    const { id: originalId, ...original } = fighter;
    assert.deepEqual(build, original);
    assert.notEqual(id, originalId);
  });

  test("is URL-safe", () => {
    assert.match(characters.toShareCode(fighter), /^[A-Za-z0-9_-]+$/);
  });

  test.each([
    { label: "not base64", code: "%%%" },
    { label: "not JSON", code: btoa("fighter") },
    { label: "an invalid build", code: btoa(JSON.stringify({ cls: "illithid" })) },
    { label: "empty", code: "" },
  ])("a code that is $label decodes to nothing", ({ code }) => {
    assert.equal(characters.fromShareCode(code), undefined);
  });
});
