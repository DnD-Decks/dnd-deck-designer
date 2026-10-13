import { describe, expect, test } from "vitest";

import { weaponMastery } from "./weapon-mastery.model.ts";

describe("weaponMastery{}", () => {
  test("every mastery has a non-empty description", () => {
    const missing = weaponMastery
      .list()
      .filter((m) => !m.description)
      .map((m) => m.id);
    expect(missing).toEqual([]);
  });
});
