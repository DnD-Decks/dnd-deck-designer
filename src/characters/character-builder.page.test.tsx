import { fireEvent, render, screen, within } from "@testing-library/react";
import { App } from "src/app/app.component";
import { brunhilde } from "src/characters/character.fixture";
import type { ChoiceSource } from "src/characters/choices.model";
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

const button = (name: string | RegExp) => screen.getByRole<HTMLButtonElement>("button", { name });
const click = (name: string | RegExp) => fireEvent.click(button(name));
const pickClass = (label: string) => click(new RegExp(`^${label}`));
const next = () => click("Next");
const checkbox = (name: string) => screen.getByRole<HTMLInputElement>("checkbox", { name });
const nameField = () => screen.getByRole<HTMLInputElement>("textbox", { name: "Character name" });
const nameCharacter = (name: string) => fireEvent.change(nameField(), { target: { value: name } });
const stepNames = () =>
  within(screen.getByRole("list", { name: "Character builder steps" }))
    .getAllByRole("listitem")
    .map((item) => ({ text: item.textContent, current: item.getAttribute("aria-current") }));

function selectFighterWeapons() {
  fireEvent.click(checkbox("Longsword"));
  fireEvent.click(checkbox("Shortbow"));
  fireEvent.click(checkbox("Dagger"));
}

function optionName({ kind, id }: { kind: ChoiceSource["kind"]; id: string }) {
  return kind === "weapon" ? weapons.find({ id })?.name : spells.get({ id }).name;
}

function completeRequired({ cls, kind }: { cls: CharacterClass; kind: ChoiceSource["kind"] }) {
  const rules = choices.for({ cls, level: 1 }).filter((rule) => rule.from.kind === kind);
  rules
    .filter((rule) => !rule.optional)
    .forEach((rule) => {
      const group = within(screen.getByRole("group", { name: rule.label }));
      choices
        .options({ cls, rule })
        .slice(0, rule.pick)
        .forEach((id) => {
          fireEvent.click(group.getByRole("checkbox", { name: optionName({ kind, id }) }));
        });
    });
}

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
      expect(document.activeElement).toBe(button("Zoom Greatsword"));
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
      characterStorage.setSpent({ id: "f1", spent: ["second-wind"] });
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
        pickClass("Monk");
        next();
        fireEvent.click(checkbox("Dagger"));
        nameCharacter("Discard me");
        fireEvent.click(screen.getByRole("link", { name: "Cancel" }));
        expect(characterStorage.list()).toEqual([brunhilde()]);
        expect(characterStorage.spent("f1")).toEqual(["second-wind"]);
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
