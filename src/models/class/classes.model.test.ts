import assert from "node:assert/strict";
import { test } from "node:test";

import { classes } from "./classes.model.ts";

test("wizard has correct base stats", () => {
  const wizard = classes.get({ id: "wizard" });
  assert.equal(wizard.label, "Wizard");
  assert.equal(wizard.hitDie, "d6");
  assert.equal(wizard.manualClassification, "spell-caster");
  assert.equal(wizard.saves, "Intelligence & Wisdom");
});

test("list returns all 12 PHB classes", () => {
  assert.equal(classes.list().length, 12);
});

test("get unknown class throws", () => {
  assert.throws(() => classes.get({ id: "artificer" as "wizard" }), /Unknown class/);
});

test("find unknown class returns undefined", () => {
  assert.equal(classes.find({ id: "artificer" }), undefined);
});

test("every class has id, label, hitDie, manualClassification", () => {
  for (const c of classes.list()) {
    assert.ok(c.id, "missing id");
    assert.ok(c.label, `missing label on ${c.id}`);
    assert.ok(c.hitDie, `missing hitDie on ${c.id}`);
    assert.ok(
      ["martial", "spell-caster", "versatile"].includes(c.manualClassification),
      `bad classification on ${c.id}: ${c.manualClassification}`
    );
  }
});
