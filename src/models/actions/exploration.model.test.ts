import { describe, expect, test } from "vitest";

import type { ManualClassification } from "src/models/class/classes.model.ts";
import type { ExplorationAction } from "./exploration.model.ts";
import { explorationActions } from "./exploration.model.ts";

const actionNames = (actions: readonly ExplorationAction[]) => actions.map((a) => a.name);

describe("explorationActions.findAll()", () => {
  test("martial gets the unrestricted actions only", () => {
    const found = explorationActions.findAll({ classification: "martial" });
    expect(actionNames(found)).toEqual(["Hide", "Search", "Study", "Utilize", "Influence"]);
  });

  test.each<{ classification: ManualClassification }>([
    { classification: "spell-caster" },
    { classification: "versatile" },
  ])("$classification also gets Cast Ritual Spell", ({ classification }) => {
    const found = explorationActions.findAll({ classification });
    expect(actionNames(found)).toEqual([
      "Hide",
      "Search",
      "Study",
      "Utilize",
      "Influence",
      "Cast Ritual Spell",
    ]);
  });
});
