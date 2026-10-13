import { describe, expect, test } from "vitest";

import { skills } from "./skills.model.ts";

describe("skills.findAll()", () => {
  test("groups the skills under their ability", () => {
    expect(skills.findAll({ ability: "str" }).map((s) => s.name)).toEqual(["athletics"]);
  });
});
