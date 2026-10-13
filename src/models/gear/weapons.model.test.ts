import { describe, expect, test } from "vitest";

import { weaponMastery } from "./weapon-mastery.model.ts";
import type { WeaponId } from "./weapons.model.ts";
import { weaponIcon, weapons } from "./weapons.model.ts";

const unknownMasteries = () =>
  weapons
    .list()
    .filter((w) => !weaponMastery.find({ id: w.mastery }))
    .map((w) => `${w.id}: ${w.mastery}`);

describe("weapons{}", () => {
  test("every weapon's mastery resolves against the weapon-mastery model", () => {
    expect(unknownMasteries()).toEqual([]);
  });

  test("the data spans both proficiencies and both ranges", () => {
    expect({
      proficiencies: [...new Set(weapons.list().map((w) => w.proficiency))].sort(),
      ranges: [...new Set(weapons.list().map((w) => w.range))].sort(),
    }).toEqual({
      proficiencies: ["martial", "simple"],
      ranges: ["melee", "ranged"],
    });
  });
});

describe("weapons.findAll()", () => {
  test("martial classes are proficient with every weapon", () => {
    expect(weapons.findAll({ cls: "fighter" })).toEqual(weapons.list());
  });

  test("wizards are proficient with simple weapons only", () => {
    expect(weapons.findAll({ cls: "wizard" })).toEqual(
      weapons.list().filter((w) => w.proficiency === "simple")
    );
  });

  test("rogues get martial weapons only when they are Finesse or Light", () => {
    const martial = weapons
      .findAll({ cls: "rogue" })
      .filter((w) => w.proficiency === "martial")
      .map((w) => w.id);

    expect(martial).toEqual(["rapier", "scimitar", "shortsword", "whip", "hand-crossbow"]);
  });
});

describe("weaponIcon()", () => {
  test.each<{ id: WeaponId; icon: string }>([
    { id: "longsword", icon: "/icons/weapon-longsword.png" },
    { id: "war-pick", icon: "/icons/weapon-war-pick.png" },
  ])("builds $icon for $id", ({ id, icon }) => {
    expect(weaponIcon(id)).toBe(icon);
  });

  test("is undefined for weapons BG3 has no icon for", () => {
    const noIcon: WeaponId[] = ["lance", "whip", "blowgun", "musket", "pistol"];
    const leaked = noIcon.filter((id) => weaponIcon(id) !== undefined);

    expect(leaked).toEqual([]);
  });
});
