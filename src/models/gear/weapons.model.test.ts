import assert from "node:assert/strict";
import { test } from "vitest";

import { weaponMastery } from "./weapon-mastery.model.ts";
import { weaponIcon, weapons } from "./weapons.model.ts";

// --- weapons.get ---

test("get throws on unknown weapon", () => {
  assert.throws(() => weapons.get({ id: "excalibur" as "longsword" }), /Unknown weapon/);
});

// --- weapons.find ---

test("find returns undefined for unknown weapon", () => {
  assert.equal(weapons.find({ id: "excalibur" }), undefined);
});

// --- weapons.list ---

test("every weapon's mastery resolves against the weapon-mastery model", () => {
  for (const w of weapons.list()) {
    assert.ok(
      weaponMastery.find({ id: w.mastery }) !== undefined,
      `weapon ${w.id} references unknown mastery: ${w.mastery}`
    );
  }
});

test("list contains both simple and martial weapons", () => {
  const all = weapons.list();
  assert.ok(all.some((w) => w.proficiency === "simple"));
  assert.ok(all.some((w) => w.proficiency === "martial"));
});

test("list contains both melee and ranged weapons", () => {
  const all = weapons.list();
  assert.ok(all.some((w) => w.range === "melee"));
  assert.ok(all.some((w) => w.range === "ranged"));
});

// --- weapons.findAll ---

test("martial classes are proficient with every weapon", () => {
  assert.equal(weapons.findAll({ cls: "fighter" }).length, weapons.list().length);
});

test("wizards get simple weapons only", () => {
  const found = weapons.findAll({ cls: "wizard" });
  assert.ok(found.length > 0);
  assert.ok(found.every((w) => w.proficiency === "simple"));
});

test("rogues get martial weapons only with Finesse or Light", () => {
  const martial = weapons.findAll({ cls: "rogue" }).filter((w) => w.proficiency === "martial");
  const ids = martial.map((w) => w.id);
  assert.ok(ids.includes("rapier") && ids.includes("hand-crossbow"));
  assert.ok(!ids.includes("longsword"));
});

// --- weaponIcon ---

test("weaponIcon follows the /icons/weapon-<id>.png convention", () => {
  assert.equal(weaponIcon("longsword"), "/icons/weapon-longsword.png");
  assert.equal(weaponIcon("war-pick"), "/icons/weapon-war-pick.png");
});

test("weaponIcon is undefined for weapons BG3 has no icon for", () => {
  for (const id of ["lance", "whip", "blowgun", "musket", "pistol"] as const) {
    assert.equal(weaponIcon(id), undefined, id);
  }
});
