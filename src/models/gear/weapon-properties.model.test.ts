import { describe, expect, test } from "vitest";

import { weaponProperties } from "./weapon-properties.model.ts";

const undescribed = () =>
  weaponProperties
    .list()
    .filter((p) => !p.description)
    .map((p) => p.id);

describe("weaponProperties{}", () => {
  test("every property has a unique id and a non-empty description", () => {
    const ids = weaponProperties.list().map((p) => p.id);

    expect(ids).toEqual([...new Set(ids)]);
    expect(undescribed()).toEqual([]);
  });
});
