import { describe, expect, test } from "vitest";

import { lookup } from "./lookup.ts";

describe("lookup()", () => {
  const table = lookup({
    items: [{ id: "fire" }, { id: "ice" }],
    key: "id",
    label: "element",
  });

  test("get returns the item for a known key", () => {
    expect(table.get("ice")).toEqual({ id: "ice" });
  });

  test("get throws on an unknown key", () => {
    expect(() => table.get("steam")).toThrow("Unknown element: steam");
  });

  test("find returns undefined on a miss", () => {
    expect(table.find("steam")).toBeUndefined();
  });

  test("list returns the items in order", () => {
    expect(table.list()).toEqual([{ id: "fire" }, { id: "ice" }]);
  });
});
