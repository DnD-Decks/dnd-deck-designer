import assert from "node:assert/strict";
import { test } from "node:test";

import { spells } from "./spells.model.ts";

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

test("findAll for unknown class returns empty array", () => {
  // cast to bypass TS — runtime guard must hold
  const result = spells.findAll({ cls: "paladin" as "wizard", level: 1 });
  assert.deepEqual(result, []);
});

test("findAll for un-vendored level returns empty array", () => {
  // level2 ids exist in wizard-spells.json but no level-2 spell records are vendored yet
  const result = spells.findAll({ cls: "wizard", level: 2 });
  assert.deepEqual(result, []);
});

test("list returns all cantrips + lvl-1 spells", () => {
  const all = spells.list();
  assert.ok(all.length >= 33 + 54); // 33 cantrips + 54 level-1
});
