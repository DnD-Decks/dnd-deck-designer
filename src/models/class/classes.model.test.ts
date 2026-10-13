import { describe, expect, test } from "vitest";

import { classes } from "./classes.model.ts";

const VALID_CLASSIFICATIONS = ["martial", "spell-caster", "versatile"];

const invalidClasses = () =>
  classes
    .list()
    .filter(
      (c) =>
        !c.id || !c.label || !c.hitDie || !VALID_CLASSIFICATIONS.includes(c.manualClassification)
    )
    .map((c) => c.id);

describe("classes{}", () => {
  test("every class carries id, label, hit die and a valid classification", () => {
    expect(invalidClasses()).toEqual([]);
  });
});
