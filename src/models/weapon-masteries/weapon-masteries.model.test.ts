import assert from "node:assert/strict";
import { test } from "vitest";

import { weapons } from "src/models/gear/weapons.model.ts";
import { weaponMasteries } from "./weapon-masteries.model.ts";

test("weapon-mastery classes get all 8 mastery cards", () => {
  assert.equal(weaponMasteries.findAll({ cls: "fighter" }).length, 8);
  assert.equal(weaponMasteries.findAll({ cls: "barbarian" }).length, 8);
});

test("classes without the Weapon Mastery feature get no mastery cards", () => {
  assert.deepEqual(weaponMasteries.findAll({ cls: "wizard" }), []);
  assert.deepEqual(weaponMasteries.findAll({ cls: "bard" }), []);
});

test("every mastery lists its weapons, and together they cover the whole weapons table", () => {
  const all = weaponMasteries.list();
  for (const m of all) assert.ok(m.weapons.length >= 2, `${m.id} has too few weapons`);
  const ids = all.flatMap((m) => m.weapons.map((w) => w.id));
  assert.equal(new Set(ids).size, ids.length, "a weapon appears under two masteries");
  assert.equal(ids.length, weapons.list().length);
});
