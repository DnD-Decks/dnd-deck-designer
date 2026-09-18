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
