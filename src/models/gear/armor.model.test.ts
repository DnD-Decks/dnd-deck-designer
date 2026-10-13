import { describe, expect, test } from "vitest";

import { armor } from "./armor.model.ts";

const VALID_CATEGORIES = ["light", "medium", "heavy", "shield"];

const invalidCategories = () =>
  armor
    .list()
    .filter((a) => !VALID_CATEGORIES.includes(a.category))
    .map((a) => a.id);

describe("armor{}", () => {
  test("every armor has a unique id and a valid category", () => {
    const ids = armor.list().map((a) => a.id);

    expect(ids).toEqual([...new Set(ids)]);
    expect(invalidCategories()).toEqual([]);
  });
});
