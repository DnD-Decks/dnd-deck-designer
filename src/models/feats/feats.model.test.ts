import { describe, expect, test } from "vitest";

import { classes } from "src/models/class/classes.model.ts";
import { feats } from "./feats.model.ts";

const allFeatIds = () =>
  classes.list().flatMap((c) => feats.findAll({ cls: c.id }).map((f) => f.id));

const malformedFeats = () =>
  classes.list().flatMap((c) =>
    feats
      .findAll({ cls: c.id })
      .filter((f) => !f.id.startsWith(`${c.id}-`) || !f.description)
      .map((f) => `${c.id}: ${f.id}`)
  );

describe("feats.findAll()", () => {
  test("every class has at least one feat", () => {
    const missing = classes
      .list()
      .filter((c) => feats.findAll({ cls: c.id }).length === 0)
      .map((c) => c.id);

    expect(missing).toEqual([]);
  });

  test("feat ids are unique across classes, prefixed by their class, and described", () => {
    const ids = allFeatIds();

    expect(ids).toEqual([...new Set(ids)]);
    expect(malformedFeats()).toEqual([]);
  });
});
