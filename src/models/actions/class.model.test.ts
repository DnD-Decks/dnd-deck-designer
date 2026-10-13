import { describe, expect, test } from "vitest";

import type { ClassAction } from "./class.model.ts";
import { classActions } from "./class.model.ts";

const actionNames = (actions: readonly ClassAction[]) => actions.map((a) => a.name);

describe("classActions.findAll()", () => {
  test("a martial fighter gets Second Wind", () => {
    const found = classActions.findAll({ cls: "fighter", classification: "martial" });
    expect(actionNames(found)).toEqual(["Second Wind"]);
  });

  test("a martial rogue gets every Cunning Action variant and Sneak Attack", () => {
    const found = classActions.findAll({ cls: "rogue", classification: "martial" });
    expect(actionNames(found)).toEqual([
      "Cunning Action: Dash",
      "Cunning Action: Disengage",
      "Cunning Action: Hide",
      "Sneak Attack",
    ]);
  });

  test("a spell-caster wizard has no class actions", () => {
    expect(classActions.findAll({ cls: "wizard", classification: "spell-caster" })).toEqual([]);
  });
});
