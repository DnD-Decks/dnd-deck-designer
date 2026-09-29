import type { Character } from "src/characters/character.model";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { characterStorage } from "./character.storage.ts";

const fighter: Character = {
  id: "f1",
  name: "Brünhilde",
  cls: "fighter",
  level: 1,
  picks: { weapons: ["longsword", "shortbow", "dagger"] },
};

const wizard: Character = { id: "w1", name: "Elminster", cls: "wizard", level: 1, picks: {} };

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("characterStorage", () => {
  test("starts empty", () => {
    expect(characterStorage.list()).toEqual([]);
  });

  test("saves characters and reads them back", () => {
    characterStorage.save(fighter);
    characterStorage.save(wizard);
    expect(characterStorage.list()).toEqual([fighter, wizard]);
    expect(characterStorage.get("w1")).toEqual(wizard);
  });

  test("saving an existing id replaces it", () => {
    characterStorage.save(fighter);
    characterStorage.save({ ...fighter, name: "Hilde" });
    expect(characterStorage.list().map(({ name }) => name)).toEqual(["Hilde"]);
  });

  test("remove drops the character and its play state", () => {
    characterStorage.save(fighter);
    characterStorage.setSpent("f1", ["resource-fighter-second-wind-0"]);
    characterStorage.remove("f1");
    expect(characterStorage.list()).toEqual([]);
    expect(characterStorage.spent("f1")).toEqual([]);
  });

  test("keeps spent cards per character", () => {
    characterStorage.setSpent("f1", ["resource-fighter-second-wind-0"]);
    characterStorage.setSpent("w1", ["resource-wizard-mana-0", "resource-wizard-mana-1"]);
    expect(characterStorage.spent("f1")).toEqual(["resource-fighter-second-wind-0"]);
    expect(characterStorage.spent("w1")).toHaveLength(2);
  });

  test("skips corrupt entries and survives corrupt JSON", () => {
    localStorage.setItem(
      "dnd-deck-designer:characters",
      JSON.stringify([fighter, { id: "x", cls: "illithid" }])
    );
    expect(characterStorage.list()).toEqual([fighter]);

    localStorage.setItem("dnd-deck-designer:characters", "{not json");
    localStorage.setItem("dnd-deck-designer:play", "{not json");
    expect(characterStorage.list()).toEqual([]);
    expect(characterStorage.spent("f1")).toEqual([]);
  });

  test("works without storage: reads are empty and writes report failure", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    expect(characterStorage.list()).toEqual([]);
    expect(characterStorage.save(fighter)).toBe(false);
    expect(characterStorage.setSpent("f1", [])).toBe(false);
  });
});
