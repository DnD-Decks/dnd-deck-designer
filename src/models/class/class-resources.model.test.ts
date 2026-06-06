import assert from "node:assert/strict";
import { test } from "node:test";

import { classResources } from "src/models/class/class-resources.model";

test("wizard lvl 1 resources: arcane-recovery + spell-slot-1st", () => {
  const resources = classResources.findAll({ cls: "wizard", level: 1 });
  assert.equal(resources.length, 2);

  const arcane = resources.find((r) => r.id === "arcane-recovery");
  assert.ok(arcane, "arcane-recovery missing");
  assert.equal(arcane.max, 1);
  assert.equal(arcane.resetOn, "long-rest");

  const slots = resources.find((r) => r.id === "spell-slot-1st");
  assert.ok(slots, "spell-slot-1st missing");
  assert.equal(slots.max, 2);
  assert.equal(slots.resetOn, "long-rest");
});

test("spell-slot-2nd absent at wizard lvl 1", () => {
  const resources = classResources.findAll({ cls: "wizard", level: 1 });
  assert.ok(!resources.some((r) => r.id === "spell-slot-2nd"));
});

test("spell-slot-2nd present at wizard lvl 3", () => {
  const resources = classResources.findAll({ cls: "wizard", level: 3 });
  const slot2 = resources.find((r) => r.id === "spell-slot-2nd");
  assert.ok(slot2, "spell-slot-2nd should appear at lvl 3");
  assert.equal(slot2.max, 2);
});

test("get arcane-recovery returns definition with description and icon", () => {
  const r = classResources.get({ id: "arcane-recovery" });
  assert.equal(r.id, "arcane-recovery");
  assert.ok(r.description, "missing description");
  assert.ok(r.icon, "missing icon");
});

test("get unknown resource throws", () => {
  assert.throws(() => classResources.get({ id: "not-a-resource" }), /Unknown resource/);
});

test("find unknown resource returns undefined", () => {
  assert.equal(classResources.find({ id: "not-a-resource" }), undefined);
});

test("list returns all resources across classes without duplicates", () => {
  const all = classResources.list();
  const ids = all.map((r) => r.id);
  const unique = new Set(ids);
  assert.equal(ids.length, unique.size, "duplicate resource ids found");
  assert.ok(all.length > 0);
});
