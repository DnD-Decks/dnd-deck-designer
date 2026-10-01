import { fireEvent, render, screen, within } from "@testing-library/react";
import { App } from "src/app/app.component";
import { brunhilde } from "src/characters/character.fixture";
import { choices } from "src/characters/choices.model";
import type { CharacterClass } from "src/models/class/classes.model";
import { weapons } from "src/models/gear/weapons.model";
import { spells } from "src/models/spells/spells.model";
import { characterStorage } from "src/services/character.storage";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { memoryLocation } from "wouter/memory-location";

function renderAt(path = "/new") {
  const memory = memoryLocation({ path, record: true });
  render(<App hook={memory.hook} />);
  return memory;
}

const click = (name: string) => fireEvent.click(screen.getByRole("button", { name }));
const checkbox = (name: string) => screen.getByRole<HTMLInputElement>("checkbox", { name });
const next = () => click("Next");
const nameCharacter = (name: string) =>
  fireEvent.change(screen.getByRole("textbox", { name: "Character name (required)" }), {
    target: { value: name },
  });

function fighterChoices() {
  renderAt();
  click("Fighter");
  next();
}

function selectFighterWeapons() {
  fireEvent.click(checkbox("Longsword"));
  fireEvent.click(checkbox("Shortbow"));
  fireEvent.click(checkbox("Dagger"));
}

function completeRequiredChoices(cls: CharacterClass) {
  choices.for({ cls, level: 1 }).forEach((rule) => {
    const group = within(screen.getByRole("group", { name: rule.label }));
    if (rule.optional) {
      group.getByText(`Optional — choose up to ${rule.pick}.`);
      return;
    }
    choices
      .options({ cls, rule })
      .slice(0, rule.pick)
      .forEach((id) => {
        const name =
          rule.from.kind === "weapon" ? weapons.find({ id })?.name : spells.get({ id }).name;
        fireEvent.click(group.getByRole("checkbox", { name }));
      });
    group.getByText(`${rule.pick} of ${rule.pick} chosen`);
  });
}

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("<CharacterBuilderPage />", () => {
  describe("navigation{}", () => {
    test("step navigation moves focus to the newly displayed heading", () => {
      renderAt();
      click("Fighter");
      screen.getByRole("button", { name: "Next" }).focus();
      next();
      expect(document.activeElement).toBe(screen.getByRole("heading", { name: "Choices" }));
      screen.getByRole("button", { name: "Next" }).focus();
      next();
      expect(document.activeElement).toBe(screen.getByRole("heading", { name: "Name" }));
      screen.getByRole("button", { name: "Back" }).focus();
      click("Back");
      expect(document.activeElement).toBe(screen.getByRole("heading", { name: "Choices" }));
    });

    test("editing choices and name leaves focus on the active input", () => {
      fighterChoices();
      const longsword = checkbox("Longsword");
      longsword.focus();
      fireEvent.click(longsword);
      expect(document.activeElement).toBe(longsword);
      next();
      const name = screen.getByRole("textbox", { name: "Character name (required)" });
      name.focus();
      nameCharacter("Ada");
      expect(document.activeElement).toBe(name);
    });

    test("home starts a numbered builder with an explicit class choice", () => {
      const memory = renderAt("/");
      fireEvent.click(screen.getByRole("link", { name: "New character" }));
      expect(memory.history.slice(-1)).toEqual(["/new"]);
      expect(screen.getByRole<HTMLButtonElement>("button", { name: "Next" }).disabled).toBe(true);
      screen.getByText("Choose a class.");
      const steps = within(screen.getByRole("list", { name: "Character builder steps" }));
      expect(steps.getByText("1 Class").getAttribute("aria-current")).toBe("step");
      screen.getByText("2 Choices");
      screen.getByText("3 Name");
      expect(
        screen.getAllByRole("button", { pressed: false }).map((button) => button.textContent)
      ).toEqual([
        "Barbarian",
        "Bard",
        "Cleric",
        "Druid",
        "Fighter",
        "Monk",
        "Paladin",
        "Ranger",
        "Rogue",
        "Sorcerer",
        "Warlock",
        "Wizard",
      ]);
    });
  });

  describe("weapon choices{}", () => {
    test("missing mastery blocks saving and Back retains the name draft", () => {
      fighterChoices();
      screen.getAllByText("1d8 · sap");
      screen.getByText("0 of 3 chosen");
      next();
      nameCharacter("  Ada  ");
      expect(
        screen.getByRole<HTMLButtonElement>("button", { name: "Save character" }).disabled
      ).toBe(true);
      screen.getByText("Weapon Mastery: choose 3 more.");
      click("Back");
      screen.getByText("0 of 3 chosen");
      next();
      expect(
        screen.getByRole<HTMLInputElement>("textbox", {
          name: "Character name (required)",
        }).value
      ).toBe("  Ada  ");
    });

    test("mastery limit disables unselected weapons until a slot is released", () => {
      fighterChoices();
      selectFighterWeapons();
      screen.getByText("3 of 3 chosen");
      expect(checkbox("Greatsword").disabled).toBe(true);
      expect(checkbox("Longsword").disabled).toBe(false);
      fireEvent.click(checkbox("Dagger"));
      expect(checkbox("Greatsword").disabled).toBe(false);
    });

    test("required trimmed name saves a complete fighter", () => {
      fighterChoices();
      selectFighterWeapons();
      next();
      nameCharacter("   ");
      expect(
        screen.getByRole<HTMLButtonElement>("button", { name: "Save character" }).disabled
      ).toBe(true);
      screen.getByText("Enter a character name.");
      nameCharacter("  Ada  ");
      click("Save character");
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

    test("preview opens a card without changing picks, even at the limit", async () => {
      fighterChoices();
      selectFighterWeapons();
      click("Preview Greatsword");
      within(screen.getByRole("dialog", { name: "Greatsword" })).getByRole("article", {
        name: "Greatsword",
      });
      expect(screen.queryByRole("checkbox")).toBeNull();
      click("Put it back");
      await vi.waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      expect(checkbox("Greatsword").checked).toBe(false);
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: "Preview Greatsword" })
      );
      screen.getByText("3 of 3 chosen");
    });
  });

  describe("class choices{}", () => {
    test("spell preview closes back to its trigger without changing picks", async () => {
      renderAt();
      click("Wizard");
      next();
      fireEvent.click(checkbox("Fire Bolt"));
      click("Preview Fire Bolt");
      within(screen.getByRole("dialog", { name: "Fire Bolt" })).getByRole("article", {
        name: "Fire Bolt",
      });
      expect(screen.queryByRole("checkbox")).toBeNull();
      click("Put it back");
      await vi.waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      expect(checkbox("Fire Bolt").checked).toBe(true);
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: "Preview Fire Bolt" })
      );
      screen.getByText("1 of 3 chosen");
    });

    test("changing class clears picks; returning to the same class keeps them", () => {
      renderAt();
      click("Fighter");
      next();
      fireEvent.click(checkbox("Longsword"));
      click("Back");
      click("Fighter");
      next();
      expect(checkbox("Longsword").checked).toBe(true);
      click("Back");
      click("Wizard");
      next();
      screen.getByText("0 of 3 chosen");
      const spell = spells.get({
        id: choices.options({
          cls: "wizard",
          rule: choices.for({ cls: "wizard", level: 1 })[0],
        })[0],
      });
      screen.getAllByText(`${spell.school} · ${spell.castingTime}`);
      click("Back");
      click("Fighter");
      next();
      expect(checkbox("Longsword").checked).toBe(false);
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
      test(`${label} can finish every required rule with optional groups empty`, () => {
        renderAt();
        click(label);
        next();
        completeRequiredChoices(cls);
        next();
        nameCharacter(label);
        click("Save character");
        expect(characterStorage.list()[0]?.cls).toBe(cls);
      });
    });

    test("optional choices still enforce their limit", () => {
      renderAt();
      click("Monk");
      next();
      fireEvent.click(checkbox("Club"));
      fireEvent.click(checkbox("Dagger"));
      expect(checkbox("Quarterstaff").disabled).toBe(true);
      fireEvent.click(checkbox("Club"));
      expect(checkbox("Quarterstaff").disabled).toBe(false);
    });
  });

  describe("persistence{}", () => {
    test("edit prefills and saves the same ID while preserving play state", () => {
      characterStorage.save(brunhilde());
      characterStorage.setSpent({ id: "f1", spent: ["second-wind"] });
      const memory = renderAt("/character/f1");
      fireEvent.click(screen.getByRole("link", { name: "Edit" }));
      expect(memory.history.slice(-1)).toEqual(["/character/f1/edit"]);
      expect(screen.getByRole("button", { name: "Fighter" }).getAttribute("aria-pressed")).toBe(
        "true"
      );
      next();
      expect(checkbox("Longsword").checked).toBe(true);
      next();
      expect(
        screen.getByRole<HTMLInputElement>("textbox", { name: "Character name (required)" }).value
      ).toBe("Brünhilde");
      nameCharacter("Renamed");
      click("Save character");
      expect(characterStorage.list()).toEqual([
        {
          id: "f1",
          name: "Renamed",
          cls: "fighter",
          level: 1,
          picks: { weapons: ["longsword", "shortbow", "dagger"] },
        },
      ]);
      expect(characterStorage.spent("f1")).toEqual(["second-wind"]);
    });

    [
      { label: "new character", path: "/new" },
      { label: "existing character", path: "/character/f1/edit" },
    ].forEach(({ label, path }) =>
      test(`cancel ${label} does not mutate storage`, () => {
        characterStorage.save(brunhilde());
        characterStorage.setSpent({ id: "f1", spent: ["second-wind"] });
        renderAt(path);
        click("Monk");
        next();
        fireEvent.click(checkbox("Dagger"));
        next();
        nameCharacter("Discard me");
        fireEvent.click(screen.getByRole("link", { name: "Cancel" }));
        expect(characterStorage.list()).toEqual([brunhilde()]);
        expect(characterStorage.spent("f1")).toEqual(["second-wind"]);
      })
    );

    test("storage failures keep the draft and allow retry", () => {
      renderAt();
      click("Monk");
      next();
      fireEvent.click(checkbox("Dagger"));
      next();
      nameCharacter("Persistent");
      const write = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw Error("quota");
      });
      click("Save character");
      screen.getByRole("alert");
      expect(characterStorage.list()).toEqual([]);
      expect(
        screen.getByRole<HTMLInputElement>("textbox", { name: "Character name (required)" }).value
      ).toBe("Persistent");
      click("Back");
      expect(checkbox("Dagger").checked).toBe(true);
      next();
      write.mockRestore();
      click("Save character");
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
      expect(screen.queryByRole("button", { name: "Save character" })).toBeNull();
      expect(characterStorage.list()).toEqual([]);
    });
  });
});
