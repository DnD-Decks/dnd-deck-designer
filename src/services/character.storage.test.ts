import { brunhilde, elminster } from "src/characters/character.fixture";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { characterStorage } from "./character.storage.ts";

const blockStorage = () => {
  const blocked = () => {
    throw new DOMException("blocked", "SecurityError");
  };
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(blocked);
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(blocked);
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("characterStorage{}", () => {
  test("starts empty", () => {
    expect(characterStorage.list()).toEqual([]);
  });

  test("saves characters and reads them back", () => {
    characterStorage.save(brunhilde());
    characterStorage.save(elminster());
    expect(characterStorage.list()).toEqual([brunhilde(), elminster()]);
    expect(characterStorage.get("w1")).toEqual(elminster());
  });

  test("saving an existing id replaces it", () => {
    characterStorage.save(brunhilde());
    characterStorage.save({ ...brunhilde(), name: "Hilde" });
    expect(characterStorage.list()).toEqual([{ ...brunhilde(), name: "Hilde" }]);
  });

  test("remove drops the character and its play state", () => {
    characterStorage.save(brunhilde());
    characterStorage.setSpent({ id: "f1", spent: ["resource-fighter-second-wind-0"] });
    characterStorage.remove("f1");
    expect({ list: characterStorage.list(), spent: characterStorage.spent("f1") }).toEqual({
      list: [],
      spent: [],
    });
  });

  test("keeps spent cards per character", () => {
    characterStorage.setSpent({ id: "f1", spent: ["resource-fighter-second-wind-0"] });
    characterStorage.setSpent({ id: "w1", spent: ["resource-wizard-mana-0"] });
    expect({ f1: characterStorage.spent("f1"), w1: characterStorage.spent("w1") }).toEqual({
      f1: ["resource-fighter-second-wind-0"],
      w1: ["resource-wizard-mana-0"],
    });
  });

  test("remembers the last played character", () => {
    characterStorage.save(brunhilde());
    characterStorage.save(elminster());
    characterStorage.setLastPlayed("f1");
    characterStorage.setLastPlayed("w1");
    expect(characterStorage.lastPlayed()).toEqual(elminster());
  });

  [
    { label: "nothing was played", setup: () => {} },
    { label: "the id is unknown", setup: () => characterStorage.setLastPlayed("nobody") },
    {
      label: "the last played character was removed",
      setup: () => {
        characterStorage.setLastPlayed("f1");
        characterStorage.remove("f1");
      },
    },
    {
      label: "the stored id is stale",
      setup: () => localStorage.setItem("dnd-deck-designer:last-played", JSON.stringify("gone")),
    },
  ].forEach(({ label, setup }) => {
    test(`has no last played character when ${label}`, () => {
      characterStorage.save(brunhilde());
      setup();
      expect(characterStorage.lastPlayed()).toBeUndefined();
    });
  });

  test("removing another character keeps the last played one", () => {
    characterStorage.save(brunhilde());
    characterStorage.save(elminster());
    characterStorage.setLastPlayed("f1");
    characterStorage.remove("w1");
    expect(characterStorage.lastPlayed()).toEqual(brunhilde());
  });

  test("skips a stored entry that is not a valid character", () => {
    const corrupt = { id: "x", cls: "illithid" };
    localStorage.setItem("dnd-deck-designer:characters", JSON.stringify([brunhilde(), corrupt]));
    expect(characterStorage.list()).toEqual([brunhilde()]);
  });

  test("reads corrupt JSON as empty", () => {
    localStorage.setItem("dnd-deck-designer:characters", "{not json");
    localStorage.setItem("dnd-deck-designer:play", "{not json");
    expect({ list: characterStorage.list(), spent: characterStorage.spent("f1") }).toEqual({
      list: [],
      spent: [],
    });
  });

  test("without storage, reads are empty and writes report failure", () => {
    blockStorage();
    expect({
      list: characterStorage.list(),
      saved: characterStorage.save(brunhilde()),
      spentSaved: characterStorage.setSpent({ id: "f1", spent: [] }),
      lastPlayed: characterStorage.lastPlayed(),
    }).toEqual({ list: [], saved: false, spentSaved: false, lastPlayed: undefined });
  });
});
