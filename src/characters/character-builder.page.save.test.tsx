import { fireEvent, screen } from "@testing-library/react";
import { brunhilde } from "src/characters/character.fixture";
import { choices } from "src/characters/choices.model";
import type { CharacterClass } from "src/models/class/classes.model";
import { characterStorage } from "src/services/character.storage";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  button,
  checkbox,
  click,
  completeRequired,
  nameCharacter,
  nameField,
  next,
  pickClass,
  renderAt,
  selectFighterWeapons,
} from "./character-builder-page.fixture.tsx";

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("<CharacterBuilderPage />", () => {
  describe("build deck{}", () => {
    test("the last step asks for a name, then builds a trimmed-name fighter", () => {
      renderAt();
      pickClass("Fighter");
      next();
      screen.getByText("Weapon Mastery: choose 3 more.");
      selectFighterWeapons();
      screen.getByText("Enter a character name.");
      nameCharacter("   ");
      expect(button("Build deck").disabled).toBe(true);
      nameCharacter("  Ada  ");
      screen.getByText("Every card is chosen.");
      click("Build deck");
      expect(characterStorage.list()).toEqual([
        {
          id: expect.any(String),
          name: "Ada",
          cls: "fighter",
          level: 1,
          picks: { weapons: ["longsword", "shortbow", "dagger"] },
        },
      ]);
      screen.getByRole("heading", { name: "Ada" });
    });

    test("submitting the name builds the deck", () => {
      renderAt();
      pickClass("Monk");
      next();
      nameCharacter("Kwai");
      fireEvent.submit(screen.getByRole("form", { name: "Builder actions" }));
      expect(characterStorage.list()[0]?.name).toBe("Kwai");
    });

    (
      [
        { label: "Barbarian", cls: "barbarian" },
        { label: "Bard", cls: "bard" },
        { label: "Cleric", cls: "cleric" },
        { label: "Druid", cls: "druid" },
        { label: "Fighter", cls: "fighter" },
        { label: "Monk", cls: "monk" },
        { label: "Paladin", cls: "paladin" },
        { label: "Ranger", cls: "ranger" },
        { label: "Rogue", cls: "rogue" },
        { label: "Sorcerer", cls: "sorcerer" },
        { label: "Warlock", cls: "warlock" },
        { label: "Wizard", cls: "wizard" },
      ] satisfies { label: string; cls: CharacterClass }[]
    ).forEach(({ label, cls }) => {
      test(`${label} builds once every required card is chosen`, () => {
        renderAt();
        pickClass(label);
        const kinds = new Set(choices.for({ cls, level: 1 }).map((rule) => rule.from.kind));
        if (kinds.has("spell")) {
          next();
          completeRequired({ cls, kind: "spell" });
        }
        next();
        completeRequired({ cls, kind: "weapon" });
        nameCharacter(label);
        click("Build deck");
        expect(characterStorage.list()[0]?.cls).toBe(cls);
      });
    });
  });

  describe("persistence{}", () => {
    test("edit prefills and saves the same ID while preserving play state", () => {
      characterStorage.save(brunhilde());
      characterStorage.setSpent({ id: "f1", spent: ["resource-fighter-second-wind-0"] });
      const memory = renderAt("/character/f1");
      fireEvent.click(screen.getByRole("link", { name: "Edit" }));
      expect(memory.history.slice(-1)).toEqual(["/character/f1/edit"]);
      screen.getByRole("heading", { name: "Edit character" });
      expect(button(/^Fighter/).getAttribute("aria-pressed")).toBe("true");
      next();
      expect(checkbox("Longsword").checked).toBe(true);
      expect(nameField().value).toBe("Brünhilde");
      nameCharacter("Renamed");
      click("Build deck");
      expect(characterStorage.list()).toEqual([
        {
          id: "f1",
          name: "Renamed",
          cls: "fighter",
          level: 1,
          picks: { weapons: ["longsword", "shortbow", "dagger"] },
        },
      ]);
      expect(characterStorage.spent("f1")).toEqual(["resource-fighter-second-wind-0"]);
    });

    [
      { label: "new character", path: "/new" },
      { label: "existing character", path: "/character/f1/edit" },
    ].forEach(({ label, path }) =>
      test(`cancel ${label} does not mutate storage`, () => {
        characterStorage.save(brunhilde());
        characterStorage.setSpent({ id: "f1", spent: ["resource-fighter-second-wind-0"] });
        renderAt(path);
        pickClass("Monk");
        next();
        fireEvent.click(checkbox("Dagger"));
        nameCharacter("Discard me");
        fireEvent.click(screen.getByRole("link", { name: "Cancel" }));
        expect(characterStorage.list()).toEqual([brunhilde()]);
        expect(characterStorage.spent("f1")).toEqual(["resource-fighter-second-wind-0"]);
      })
    );

    test("storage failures keep the draft and allow retry", () => {
      renderAt();
      pickClass("Monk");
      next();
      fireEvent.click(checkbox("Dagger"));
      nameCharacter("Persistent");
      const write = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw Error("quota");
      });
      click("Build deck");
      screen.getByRole("alert");
      expect(characterStorage.list()).toEqual([]);
      expect(nameField().value).toBe("Persistent");
      expect(checkbox("Dagger").checked).toBe(true);
      write.mockRestore();
      click("Build deck");
      expect(characterStorage.list()).toEqual([
        {
          id: expect.any(String),
          name: "Persistent",
          cls: "monk",
          level: 1,
          picks: { weapons: ["dagger"] },
        },
      ]);
    });

    test("missing edit ID explains the problem without starting a new character", () => {
      renderAt("/character/missing/edit");
      screen.getByRole("heading", { name: "Character not found" });
      screen.getByRole("link", { name: "Back to your characters" });
      expect(screen.queryByRole("button", { name: "Build deck" })).toBeNull();
      expect(characterStorage.list()).toEqual([]);
    });
  });
});
