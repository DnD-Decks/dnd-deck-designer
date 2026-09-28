import assert from "node:assert/strict";
import { describe, test } from "vitest";

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
