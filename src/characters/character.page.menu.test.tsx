import { fireEvent, screen, within } from "@testing-library/react";
import { characterStorage } from "src/services/character.storage";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { menuItems, renderAt, seedBrunhildeOnGrid, spend } from "./character-page.fixture.tsx";

beforeEach(seedBrunhildeOnGrid);
afterEach(() => vi.restoreAllMocks());

describe("<CharacterPage />", () => {
  describe("menu{}", () => {
    test("the play view replaces the workbench nav with its own menu", () => {
      const memory = renderAt("/character/f1");
      screen.getByRole("heading", { name: "D&D Deck Designer", level: 1 });
      expect(screen.queryByRole("navigation", { name: "Main" })).toBeNull();

      const menu = screen.getByRole("navigation", { name: "Character menu" });
      expect(menuItems(menu)).toEqual([
        "Edit",
        "Share",
        "—",
        "Your characters",
        "Card catalog",
        "Add cards",
        "—",
        "Delete character",
      ]);
      fireEvent.click(within(menu).getByRole("link", { name: "Card catalog" }));
      expect(memory.history.slice(-1)).toEqual(["/catalog/wizard"]);
    });

    test("Add cards in the menu opens the catalog in selection mode on the character's class", () => {
      const memory = renderAt("/character/f1");
      const menu = screen.getByRole("navigation", { name: "Character menu" });
      fireEvent.click(within(menu).getByRole("link", { name: "Add cards" }));

      expect(memory.history.slice(-1)).toEqual(["/character/f1/add/fighter"]);
      screen.getByRole("region", { name: "Fighter cards" });
    });

    test("the back arrow goes home, not back through history", () => {
      const memory = renderAt("/character/f1");
      fireEvent.click(screen.getByRole("link", { name: "Back to your characters" }));
      expect(memory.history.slice(-1)).toEqual(["/"]);
    });
  });

  describe("delete{}", () => {
    test("deleting asks first, and Cancel keeps the character", () => {
      renderAt("/character/f1");
      fireEvent.click(screen.getByRole("button", { name: "Delete character" }));
      const confirm = within(screen.getByRole("dialog", { name: "Delete Brünhilde?" }));
      fireEvent.click(confirm.getByRole("button", { name: "Cancel" }));

      expect(screen.queryByRole("dialog")).toBeNull();
      expect(characterStorage.get("f1")?.name).toBe("Brünhilde");
    });

    test("Escape cancels the delete and focus goes back to the menu", () => {
      renderAt("/character/f1");
      fireEvent.click(screen.getByRole("button", { name: "Delete character" }));
      fireEvent.keyDown(document, { key: "Escape" });

      expect(screen.queryByRole("dialog")).toBeNull();
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Menu" }));
    });

    test("while the delete is asked, the table behind can't be reached", () => {
      renderAt("/character/f1");
      fireEvent.click(screen.getByRole("button", { name: "Delete character" }));

      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Cancel" }));
      expect(screen.getByRole("main").closest("[inert]")).not.toBeNull();
    });

    test("confirming the delete removes the character and its play state, then goes home", async () => {
      const memory = renderAt("/character/f1");
      await spend("Second Wind (Short Rest)");

      fireEvent.click(screen.getByRole("button", { name: "Delete character" }));
      fireEvent.click(screen.getByRole("button", { name: "Delete Brünhilde" }));

      expect(memory.history.slice(-1)).toEqual(["/"]);
      expect({ saved: characterStorage.get("f1"), spent: characterStorage.spent("f1") }).toEqual({
        saved: undefined,
        spent: [],
      });
    });
  });
});
