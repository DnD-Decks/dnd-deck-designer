import { fireEvent, render, screen, within } from "@testing-library/react";
import { App } from "src/app/app.component";
import { brunhilde, elminster } from "src/characters/character.fixture";
import { characterStorage } from "src/services/character.storage";
import { beforeEach, describe, expect, test } from "vitest";
import { memoryLocation } from "wouter/memory-location";

const renderHome = () => {
  const memory = memoryLocation({ path: "/", record: true });
  render(<App hook={memory.hook} />);
  return memory;
};

const linkNames = () =>
  within(screen.getByRole("main"))
    .getAllByRole("link")
    .map((link) => link.getAttribute("aria-label") ?? link.textContent);

beforeEach(() => {
  localStorage.clear();
});

describe("<CharactersPage />", () => {
  test("with no characters, it invites you to build one and points to the catalog", () => {
    renderHome();
    screen.getByRole("heading", { name: "Build a character to bring to the table", level: 2 });
    expect(linkNames()).toEqual(["New character", "Open the card catalog"]);
  });

  test("the last played character comes first, the rest below", () => {
    characterStorage.save(brunhilde());
    characterStorage.save(elminster());
    characterStorage.setLastPlayed("w1");
    renderHome();

    screen.getByRole("heading", { name: "Other characters", level: 2 });
    expect(linkNames()).toEqual([
      "Continue as Elminster",
      "New character",
      "BrünhildeLevel 1 Fighter",
    ]);
  });

  test("Continue opens the last played character", () => {
    characterStorage.save(brunhilde());
    characterStorage.setLastPlayed("f1");
    const memory = renderHome();

    fireEvent.click(screen.getByRole("link", { name: "Continue as Brünhilde" }));

    expect(memory.history.slice(-1)).toEqual(["/character/f1"]);
  });

  test("the continue card holds a hand of the deck's cards, hidden from the accessibility tree", () => {
    characterStorage.save(brunhilde());
    characterStorage.setLastPlayed("f1");
    renderHome();
    const hero = screen.getByRole("link", { name: "Continue as Brünhilde" });

    expect({
      exposed: within(hero).queryAllByRole("article"),
      hand: within(hero)
        .getAllByRole("heading", { level: 3, hidden: true })
        .map((heading) => heading.textContent),
    }).toEqual({ exposed: [], hand: ["Second Wind", "Dagger", "Shortbow"] });
  });

  [
    { label: "nothing spent", spent: [], text: null },
    {
      label: "both Second Wind uses spent",
      spent: ["resource-fighter-second-wind-0", "resource-fighter-second-wind-1"],
      text: "Spent until a rest: Second Wind",
    },
  ].forEach(({ label, spent, text }) => {
    test(`the continue card names what waits for a rest: ${label}`, () => {
      characterStorage.save(brunhilde());
      characterStorage.setLastPlayed("f1");
      characterStorage.setSpent({ id: "f1", spent });
      renderHome();
      expect(screen.queryByText(/Spent until a rest/)?.textContent ?? null).toBe(text);
    });
  });

  [
    { label: "never played", setup: () => {} },
    {
      label: "the last played character was deleted",
      setup: () => {
        characterStorage.save(elminster());
        characterStorage.setLastPlayed("w1");
        characterStorage.remove("w1");
      },
    },
  ].forEach(({ label, setup }) => {
    test(`with no last played character (${label}), it lists them all`, () => {
      characterStorage.save(brunhilde());
      setup();
      renderHome();

      screen.getByRole("heading", { name: "Pick a character", level: 2 });
      expect(linkNames()).toEqual(["New character", "BrünhildeLevel 1 Fighter"]);
    });
  });

  test("with only the last played character, there is no other characters heading", () => {
    characterStorage.save(brunhilde());
    characterStorage.setLastPlayed("f1");
    renderHome();

    expect(screen.queryByRole("heading", { level: 2 })).toBeNull();
    expect(linkNames()).toEqual(["Continue as Brünhilde", "New character"]);
  });

  test("opening a character makes it the one to continue", () => {
    characterStorage.save(brunhilde());
    characterStorage.save(elminster());
    const memory = renderHome();

    fireEvent.click(screen.getByRole("link", { name: /Elminster/ }));
    fireEvent.click(screen.getByRole("link", { name: "Your characters" }));

    expect(memory.history.slice(-1)).toEqual(["/"]);
    screen.getByRole("link", { name: "Continue as Elminster" });
  });
});
