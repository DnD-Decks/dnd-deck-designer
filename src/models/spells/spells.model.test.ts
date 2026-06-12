import assert from "node:assert/strict";
import { test } from "node:test";

import { spells } from "./spells.model.ts";

// --- wizard (anchor class with exact expected counts) ---

test("wizard cantrips: 19 entries including fire-bolt", () => {
  const cantrips = spells.findAll({ cls: "wizard", level: 0 });
  assert.equal(cantrips.length, 19);
  assert.ok(cantrips.some((s) => s.id === "fire-bolt"));
});

test("wizard lvl-1 spells: 23 entries including magic-missile", () => {
  const level1 = spells.findAll({ cls: "wizard", level: 1 });
  assert.equal(level1.length, 23);
  assert.ok(level1.some((s) => s.id === "magic-missile"));
});

test("wizard lvl-2 spells: 35 entries, all level 2", () => {
  const level2 = spells.findAll({ cls: "wizard", level: 2 });
  assert.equal(level2.length, 35);
  assert.ok(level2.every((s) => s.level === 2));
});

test("every wizard cantrip resolves to a defined spell", () => {
  for (const s of spells.findAll({ cls: "wizard", level: 0 })) {
    assert.ok(s !== undefined, "cantrip undefined");
    assert.ok(s.id, "missing id");
    assert.ok(s.name, `missing name on ${s.id}`);
  }
});

test("every wizard lvl-1 spell resolves to a defined spell", () => {
  for (const s of spells.findAll({ cls: "wizard", level: 1 })) {
    assert.ok(s !== undefined, "spell undefined");
    assert.ok(s.id, "missing id");
    assert.ok(s.name, `missing name on ${s.id}`);
  }
});

// --- all caster classes: cantrips + level1 non-empty and fully resolved ---

const CASTER_CLASSES = ["bard", "cleric", "druid", "sorcerer", "warlock", "wizard"] as const;

for (const cls of CASTER_CLASSES) {
  test(`${cls} cantrips: non-empty and every entry has id and name`, () => {
    const cantrips = spells.findAll({ cls, level: 0 });
    assert.ok(cantrips.length > 0, `${cls} has no cantrips`);
    for (const s of cantrips) {
      assert.ok(s.id, `${cls} cantrip missing id`);
      assert.ok(s.name, `${cls} cantrip ${s.id} missing name`);
    }
  });

  test(`${cls} level-1 spells: non-empty and every entry has id and name`, () => {
    const level1 = spells.findAll({ cls, level: 1 });
    assert.ok(level1.length > 0, `${cls} has no level-1 spells`);
    for (const s of level1) {
      assert.ok(s.id, `${cls} lvl-1 spell missing id`);
      assert.ok(s.name, `${cls} lvl-1 spell ${s.id} missing name`);
    }
  });
}

// --- half-casters and martial classes: empty results ---

test("paladin (half-caster, no spells vendored) returns empty for cantrips", () => {
  assert.deepEqual(spells.findAll({ cls: "paladin", level: 0 }), []);
});

test("paladin (half-caster, no spells vendored) returns empty for level-1", () => {
  assert.deepEqual(spells.findAll({ cls: "paladin", level: 1 }), []);
});

test("findAll for martial class returns empty array", () => {
  // cast to bypass TS — runtime guard must hold for classes absent from CLASS_DATA
  const result = spells.findAll({ cls: "fighter" as "wizard", level: 1 });
  assert.deepEqual(result, []);
});

test("findAll for level 3+ returns empty array", () => {
  const result = spells.findAll({ cls: "wizard", level: 3 });
  assert.deepEqual(result, []);
});

// --- spells.get / find / list ---

test("get alarm returns expected fields", () => {
  const alarm = spells.get({ id: "alarm" });
  assert.equal(alarm.name, "Alarm");
  assert.equal(alarm.level, 1);
  assert.equal(alarm.school, "Abjuration");
  assert.equal(alarm.ritual, true);
  assert.equal(alarm.concentration, false);
});

test("get unknown spell throws", () => {
  assert.throws(() => spells.get({ id: "not-a-spell" }), /Unknown spell/);
});

test("find unknown spell returns undefined", () => {
  assert.equal(spells.find({ id: "not-a-spell" }), undefined);
});

test("list returns all cantrips + lvl-1 + lvl-2 spells", () => {
  const all = spells.list();
  assert.ok(all.length >= 33 + 54 + 35); // 33 cantrips + 54 level-1 + 35 level-2
});
