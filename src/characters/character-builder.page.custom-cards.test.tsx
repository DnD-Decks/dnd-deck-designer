import { screen, within } from "@testing-library/react";
import { brunhilde } from "src/characters/character.fixture";
import { characterStorage } from "src/services/character.storage";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  button,
  click,
  next,
  pickClass,
  renderAt,
  stepNames,
} from "./character-builder-page.fixture.tsx";

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

const withCustom = (custom: string[] = ["spell-cure-wounds"]) => {
  characterStorage.save({
    ...brunhilde(),
    picks: { ...brunhilde().picks, custom },
  });
};

describe("<CharacterBuilderPage />", () => {
  describe("custom cards{}", () => {
    test("a new character never gets the step", () => {
      renderAt();
      pickClass("Fighter");
      expect(stepNames().map(({ text }) => text)).toEqual(["1 Class", "2 Weapons"]);
    });

    test("editing a character with custom cards lists them on their own step", () => {
      withCustom();
      renderAt("/character/f1/edit");

      expect(stepNames().map(({ text }) => text)).toEqual([
        "1 Class",
        "2 Weapons",
        "3 Custom cards",
      ]);
      next();
      next();
      screen.getByRole("heading", { name: "Custom cards" });
      screen.getByRole("article", { name: "Cure Wounds" });
      screen.getByRole("button", { name: "Remove Cure Wounds" });
    });

    test("removing a custom card persists on save", () => {
      withCustom();
      const memory = renderAt("/character/f1/edit");
      next();
      next();
      click("Remove Cure Wounds");

      // the empty step is gone, the view settles on the step before it
      expect(stepNames().map(({ text }) => text)).toEqual(["1 Class", "2 Weapons"]);
      screen.getByRole("heading", { name: "Weapons" });

      click("Build deck");
      expect(memory.history.slice(-1)).toEqual(["/character/f1"]);
      expect(characterStorage.get("f1")?.picks.custom).toEqual([]);
    });

    test("custom cards that all no longer exist drop the step and the stored key", () => {
      withCustom(["spell-does-not-exist"]);
      const memory = renderAt("/character/f1/edit");

      expect(stepNames().map(({ text }) => text)).toEqual(["1 Class", "2 Weapons"]);

      next();
      click("Build deck");
      expect(memory.history.slice(-1)).toEqual(["/character/f1"]);
      expect(characterStorage.get("f1")?.picks.custom).toBeUndefined();
    });

    test("a mix of missing and existing custom cards keeps the step and saves only the existing ones", () => {
      withCustom(["spell-does-not-exist", "spell-cure-wounds"]);
      const memory = renderAt("/character/f1/edit");

      expect(stepNames().map(({ text }) => text)).toEqual([
        "1 Class",
        "2 Weapons",
        "3 Custom cards",
      ]);
      next();
      next();
      screen.getByRole("article", { name: "Cure Wounds" });

      click("Build deck");
      expect(memory.history.slice(-1)).toEqual(["/character/f1"]);
      expect(characterStorage.get("f1")?.picks.custom).toEqual(["spell-cure-wounds"]);
    });

    test("the custom step renders the cards as a list", () => {
      withCustom(["spell-cure-wounds", "weapon-greataxe"]);
      renderAt("/character/f1/edit");
      next();
      next();

      const custom = screen
        .getAllByRole("list")
        .find((list) => within(list).queryAllByRole("button", { name: /^Remove / }).length > 0);
      expect(custom).toBeDefined();
      if (!custom) return;
      // card faces carry their own trait lists — count the items that hold a Remove button
      const items = within(custom)
        .getAllByRole("listitem")
        .filter((item) => within(item).queryByRole("button", { name: /^Remove / }));
      expect(items).toHaveLength(2);
    });

    test("removing a custom card announces it, even the last one", () => {
      withCustom(["spell-cure-wounds", "weapon-greataxe"]);
      renderAt("/character/f1/edit");
      next();
      next();

      click("Remove Cure Wounds");
      expect(screen.getByRole("status").textContent).toBe("Cure Wounds removed");

      // the step is gone with the last card, but the live region stays —
      // the step it falls back to adds its own status outputs, so match the text
      click("Remove Greataxe");
      expect(screen.queryByRole("button", { name: /^Remove / })).toBeNull();
      screen.getByText("Greataxe removed");
    });

    test("removing a custom card keeps focus on the neighbouring Remove button", () => {
      withCustom(["spell-cure-wounds", "weapon-greataxe", "weapon-greatsword"]);
      renderAt("/character/f1/edit");
      next();
      next();

      // removing the first card moves focus to the next card's button
      button("Remove Cure Wounds").focus();
      click("Remove Cure Wounds");
      expect(document.activeElement).toBe(button("Remove Greataxe"));

      // removing the last card moves focus to the previous card's button
      button("Remove Greatsword").focus();
      click("Remove Greatsword");
      expect(document.activeElement).toBe(button("Remove Greataxe"));
    });

    test("changing class drops the custom cards with the rest of the picks", () => {
      withCustom();
      renderAt("/character/f1/edit");

      pickClass("Cleric");
      expect(stepNames().map(({ text }) => text)).toEqual(["1 Class", "2 Spells", "3 Weapons"]);
    });
  });
});
