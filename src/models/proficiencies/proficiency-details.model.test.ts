import { describe, expect, test } from "vitest";

import { proficiencyDetails } from "./proficiency-details.model.ts";

describe("proficiencyDetails{}", () => {
  test("injects the data key as each entry's id", () => {
    expect(proficiencyDetails.find({ id: "shields" })).toEqual({
      id: "shields",
      label: "Shields",
      icon: "vol8/icon-vol8_120",
    });
  });
});
