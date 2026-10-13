import { fireEvent, screen, within } from "@testing-library/react";
import { choices } from "src/characters/choices.model";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  button,
  checkbox,
  click,
  completeRequired,
  next,
  optionName,
  pickClass,
  renderAt,
  selectFighterWeapons,
  stepNames,
} from "./character-builder-page.fixture.tsx";

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("<CharacterBuilderPage />", () => {
  describe("steps{}", () => {
    test("home opens the builder on the class step, with Next locked", () => {
      const memory = renderAt("/");
      fireEvent.click(screen.getByRole("link", { name: "New character" }));
      expect(memory.history.slice(-1)).toEqual(["/new"]);
      expect(stepNames()).toEqual([{ text: "1 Class", current: "step" }]);
      expect(screen.queryAllByRole("button", { pressed: true })).toEqual([]);
      screen.getByText("Choose a class.");
      expect(button("Next").disabled).toBe(true);
    });

    [
      { label: "Wizard", steps: ["1 Class", "2 Spells", "3 Weapons"] },
      { label: "Fighter", steps: ["1 Class", "2 Weapons"] },
    ].forEach(({ label, steps }) =>
      test(`a ${label} walks through ${steps.join(", ")}`, () => {
        renderAt();
        pickClass(label);
        expect(stepNames().map(({ text }) => text)).toEqual(steps);
      })
    );

    test("each step moves focus to its heading, and Back returns", () => {
      renderAt();
      pickClass("Wizard");
      next();
      expect(document.activeElement).toBe(screen.getByRole("heading", { name: "Spells" }));
      expect(stepNames()[1]).toEqual({ text: "2 Spells", current: "step" });
      click("Back");
      expect(document.activeElement).toBe(screen.getByRole("heading", { name: "Class" }));
    });
  });

  describe("zoom{}", () => {
    test("zoom lifts a card into the spotlight without choosing it, even when locked", async () => {
      renderAt();
      pickClass("Fighter");
      next();
      selectFighterWeapons();
      click("Zoom Greatsword");
      within(screen.getByRole("dialog", { name: "Greatsword" })).getByRole("article", {
        name: "Greatsword",
      });
      click("Put it back");
      await vi.waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      // focus returns in a passive cleanup, a tick after the dialog leaves the DOM
      await vi.waitFor(() => expect(document.activeElement).toBe(button("Zoom Greatsword")));
      expect(checkbox("Greatsword").checked).toBe(false);
      screen.getByText("3 of 3 chosen");
    });

    test("the spotlight steps through the cards of the same hand", () => {
      renderAt();
      pickClass("Wizard");
      next();
      const [first, second] = choices.options({
        cls: "wizard",
        rule: choices.for({ cls: "wizard", level: 1 })[0],
      });
      const firstName = optionName({ kind: "spell", id: first });
      const secondName = optionName({ kind: "spell", id: second });
      click(`Zoom ${firstName}`);
      expect(screen.queryByRole("button", { name: /^Previous card/ })).toBeNull();
      click(`Next card: ${secondName}`);
      screen.getByRole("dialog", { name: secondName });
    });
  });

  describe("cards{}", () => {
    test("the spells step lays out spell cards and locks Next until they are chosen", () => {
      renderAt();
      pickClass("Wizard");
      next();
      const cantrips = within(screen.getByRole("group", { name: "Cantrips" }));
      cantrips.getByText("Choose 3.");
      cantrips.getByRole("article", { name: "Fire Bolt" });
      expect(screen.queryByRole("group", { name: "Weapons" })).toBeNull();
      fireEvent.click(checkbox("Fire Bolt"));
      cantrips.getByText("1 of 3 chosen");
      screen.getByText("Cantrips: choose 2 more.");
      expect(button("Next").disabled).toBe(true);
      fireEvent.click(checkbox("Fire Bolt"));
      completeRequired({ cls: "wizard", kind: "spell" });
      screen.getByText("Done. Next up: Weapons.");
      expect(button("Next").disabled).toBe(false);
    });

    test("a full hand disables the cards left out until one is put back", () => {
      renderAt();
      pickClass("Fighter");
      next();
      within(screen.getByRole("group", { name: "Weapon Mastery" })).getByRole("article", {
        name: "Greatsword",
      });
      selectFighterWeapons();
      screen.getByText("3 of 3 chosen");
      expect(checkbox("Greatsword").disabled).toBe(true);
      expect(checkbox("Longsword").disabled).toBe(false);
      fireEvent.click(checkbox("Dagger"));
      expect(checkbox("Greatsword").disabled).toBe(false);
    });

    test("optional choices still enforce their limit", () => {
      renderAt();
      pickClass("Monk");
      next();
      screen.getByText("Optional — choose up to 2.");
      fireEvent.click(checkbox("Club"));
      fireEvent.click(checkbox("Dagger"));
      expect(checkbox("Quarterstaff").disabled).toBe(true);
    });

    test("changing class clears picks; picking the same class keeps them", () => {
      renderAt();
      pickClass("Fighter");
      next();
      fireEvent.click(checkbox("Longsword"));
      click("Back");
      pickClass("Fighter");
      next();
      expect(checkbox("Longsword").checked).toBe(true);
      click("Back");
      pickClass("Monk");
      pickClass("Fighter");
      next();
      expect(checkbox("Longsword").checked).toBe(false);
    });
  });
});
