import { fireEvent, render, screen, within } from "@testing-library/react";
import { App } from "src/app/app.component";
import { brunhilde } from "src/characters/character.fixture";
import { choices } from "src/characters/choices.model";
import { classes } from "src/models/class/classes.model";
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

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("<CharacterBuilderPage />", () => {
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
    for (const cls of classes.list()) screen.getByRole("button", { name: cls.label });
  });

  test("fighter limits, counters, back navigation, required trimmed name and missing choices", () => {
    renderAt();
    click("Fighter");
    next();
    screen.getAllByText("1d8 · sap");
    screen.getByText("0 of 3 chosen");
    next();
    nameCharacter("  Ada  ");
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Save character" }).disabled).toBe(
      true
    );
    screen.getByText("Weapon Mastery: choose 3 more.");
    click("Back");
    for (const name of ["Longsword", "Shortbow", "Dagger"]) fireEvent.click(checkbox(name));
    screen.getByText("3 of 3 chosen");
    expect(checkbox("Greatsword").disabled).toBe(true);
    expect(checkbox("Longsword").disabled).toBe(false);
    fireEvent.click(checkbox("Dagger"));
    expect(checkbox("Greatsword").disabled).toBe(false);
    fireEvent.click(checkbox("Dagger"));
    next();
    nameCharacter("   ");
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Save character" }).disabled).toBe(
      true
    );
    screen.getByText("Enter a character name.");
    nameCharacter("  Ada  ");
    click("Save character");
    expect(characterStorage.list()).toHaveLength(1);
    expect(characterStorage.list()[0]).toMatchObject({
      name: "Ada",
      cls: "fighter",
      picks: { weapons: ["longsword", "shortbow", "dagger"] },
    });
    screen.getByRole("heading", { name: "Ada" });
  });

  test("preview opens a card without changing picks, even at the limit", async () => {
    renderAt();
    click("Fighter");
    next();
    for (const name of ["Longsword", "Shortbow", "Dagger"]) fireEvent.click(checkbox(name));
    click("Preview Greatsword");
    within(screen.getByRole("dialog", { name: "Greatsword" })).getByRole("article", {
      name: "Greatsword",
    });
    expect(screen.queryByRole("checkbox")).toBeNull();
    click("Put it back");
    await vi.waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(checkbox("Greatsword").checked).toBe(false);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Preview Greatsword" }));
    screen.getByText("3 of 3 chosen");
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
      id: choices.options({ cls: "wizard", rule: choices.for({ cls: "wizard", level: 1 })[0] })[0],
    });
    screen.getAllByText(`${spell.school} · ${spell.castingTime}`);
    click("Back");
    click("Fighter");
    next();
    expect(checkbox("Longsword").checked).toBe(false);
  });

  test.each(classes.list())(
    "$label can finish every required rule with optional groups empty",
    (cls) => {
      renderAt();
      click(cls.label);
      next();
      for (const rule of choices.for({ cls: cls.id, level: 1 })) {
        const group = within(screen.getByRole("group", { name: rule.label }));
        if (rule.optional) {
          group.getByText(`Optional — choose up to ${rule.pick}.`);
          continue;
        }
        for (const id of choices.options({ cls: cls.id, rule }).slice(0, rule.pick)) {
          const name =
            rule.from.kind === "weapon" ? weapons.find({ id })?.name : spells.get({ id }).name;
          fireEvent.click(group.getByRole("checkbox", { name }));
        }
        group.getByText(`${rule.pick} of ${rule.pick} chosen`);
      }
      next();
      nameCharacter(cls.label);
      click("Save character");
      expect(characterStorage.list()[0]?.cls).toBe(cls.id);
    }
  );

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
    expect(characterStorage.list()).toHaveLength(1);
    expect(characterStorage.get("f1")?.name).toBe("Renamed");
    expect(characterStorage.spent("f1")).toEqual(["second-wind"]);
  });

  test.each(["/new", "/character/f1/edit"])("cancel at %s does not mutate storage", (path) => {
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
  });

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
    expect(characterStorage.list()[0]?.name).toBe("Persistent");
  });

  test("missing edit ID explains the problem without starting a new character", () => {
    renderAt("/character/missing/edit");
    screen.getByRole("heading", { name: "Character not found" });
    screen.getByRole("link", { name: "Back to your characters" });
    expect(screen.queryByRole("button", { name: "Save character" })).toBeNull();
    expect(characterStorage.list()).toEqual([]);
  });
});
