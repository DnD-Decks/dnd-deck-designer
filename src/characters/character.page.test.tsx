import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import { App } from "src/app/app.component";
import { brunhilde } from "src/characters/character.fixture";
import { characters } from "src/characters/character.model";
import { characterStorage } from "src/services/character.storage";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { memoryLocation } from "wouter/memory-location";

const renderAt = (path: string) => {
  const memory = memoryLocation({ path, record: true });
  render(<App hook={memory.hook} />);
  return memory;
};

const stubClipboard = (writeText: (text: string) => Promise<void>) =>
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

const sharedCode = (link: unknown) => String(link).split("#/import/")[1] ?? "";

const zoomNames = (card: string) =>
  screen
    .getAllByRole("button", { name: new RegExp(`^Zoom ${card}`) })
    .map((button) => button.getAttribute("aria-label"));

const restButtons = () =>
  ["Short rest", "Long rest"].map((name) => {
    const button = screen.getByRole("button", { name }) as HTMLButtonElement;
    return { name, description: restHint(button), disabled: button.disabled };
  });

const restHint = (button: HTMLElement) =>
  document.getElementById(button.getAttribute("aria-describedby") ?? "")?.textContent;

// zooms the first unspent copy and spends it
async function spend(card: string) {
  fireEvent.click(screen.getAllByRole("button", { name: `Zoom ${card}` })[0]);
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Spend" }));
  await waitForElementToBeRemoved(() => screen.queryByRole("dialog"), { timeout: 3000 });
}

beforeEach(() => {
  localStorage.clear();
  characterStorage.save(brunhilde());
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("<CharacterPage />", () => {
  test("shows the saved character's name, class and picked cards", () => {
    renderAt("/character/f1");
    screen.getByRole("heading", { name: "Brünhilde", level: 2 });
    screen.getByText("Level 1 Fighter");
    screen.getByRole("heading", { name: "Shortbow", level: 3 });
  });

  test("the character heading sits inside the main landmark", () => {
    renderAt("/character/f1");
    within(screen.getByRole("main")).getByRole("heading", { name: "Brünhilde", level: 2 });
  });

  test("one row per section, in table order", () => {
    renderAt("/character/f1");
    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(["Brünhilde", "Resources", "Weapons", "Features"]);
  });

  test("each use of a resource is its own card", () => {
    renderAt("/character/f1");
    const resources = within(screen.getByRole("region", { name: "Resources" }));
    expect(resources.getAllByRole("article", { name: "Second Wind" })).toHaveLength(2);
    expect(resources.getAllByRole("button", { name: "Zoom Second Wind" })).toHaveLength(2);
  });

  test("the arrows step from one copy to the next", () => {
    renderAt("/character/f1");
    fireEvent.click(screen.getAllByRole("button", { name: "Zoom Second Wind" })[0]);
    screen.getByRole("button", { name: "Next card: Second Wind" });

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "ArrowRight" });
    screen.getByRole("dialog", { name: "Second Wind" });
    screen.getByRole("button", { name: "Previous card: Second Wind" });
  });

  test("putting a copy back returns focus to that copy", async () => {
    renderAt("/character/f1");
    const first = screen.getAllByRole("button", { name: "Zoom Second Wind" })[0];
    fireEvent.click(first);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    await waitForElementToBeRemoved(() => screen.queryByRole("dialog"), { timeout: 3000 });
    await vi.waitFor(() => expect(document.activeElement).toBe(first));
  });

  test("tapping a card lifts it into the spotlight", () => {
    renderAt("/character/f1");
    fireEvent.click(screen.getByRole("button", { name: "Zoom Shortbow" }));
    screen.getByRole("dialog", { name: "Shortbow" });
  });

  test("the play view replaces the workbench nav with its own menu", () => {
    const memory = renderAt("/character/f1");
    screen.getByRole("heading", { name: "D&D Deck Designer", level: 1 });
    expect(screen.queryByRole("navigation", { name: "Main" })).toBeNull();

    const menu = within(screen.getByRole("navigation", { name: "Character menu" }));
    menu.getByRole("link", { name: "Edit" });
    menu.getByRole("button", { name: "Share" });
    menu.getByRole("link", { name: "Your characters" });
    fireEvent.click(menu.getByRole("link", { name: "Card catalog" }));
    expect(memory.history.slice(-1)).toEqual(["/catalog/wizard"]);
  });

  test("rests wait until something is spent, and say what they bring back", () => {
    renderAt("/character/f1");
    expect(restButtons()).toEqual([
      { name: "Short rest", description: "Second Wind", disabled: true },
      { name: "Long rest", description: "Everything", disabled: true },
    ]);
  });

  test("Spend in the spotlight puts the card back spent; Recover undoes it", async () => {
    renderAt("/character/f1");
    await spend("Second Wind");
    expect(zoomNames("Second Wind")).toEqual(["Zoom Second Wind, spent", "Zoom Second Wind"]);

    fireEvent.click(screen.getByRole("button", { name: "Zoom Second Wind, spent" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Recover" }));
    await waitForElementToBeRemoved(() => screen.queryByRole("dialog"), { timeout: 3000 });
    expect(zoomNames("Second Wind")).toEqual(["Zoom Second Wind", "Zoom Second Wind"]);
  });

  test("only resources can be spent", () => {
    renderAt("/character/f1");
    fireEvent.click(screen.getByRole("button", { name: "Zoom Shortbow" }));
    const spotlight = within(screen.getByRole("dialog", { name: "Shortbow" }));
    expect(spotlight.queryByRole("button", { name: "Spend" })).toBeNull();
  });

  test("a short rest brings back one Second Wind and says so", async () => {
    renderAt("/character/f1");
    await spend("Second Wind");
    await spend("Second Wind");

    fireEvent.click(screen.getByRole("button", { name: "Short rest" }));

    expect(zoomNames("Second Wind")).toEqual(["Zoom Second Wind", "Zoom Second Wind, spent"]);
    // the rest status, then the menu's share status
    expect(screen.getAllByRole("status").map((status) => status.textContent)).toEqual([
      "Short rest: Second Wind recovered",
      "",
    ]);
  });

  test("a long rest brings everything back", async () => {
    renderAt("/character/f1");
    await spend("Second Wind");
    await spend("Second Wind");

    fireEvent.click(screen.getByRole("button", { name: "Long rest" }));

    expect(zoomNames("Second Wind")).toEqual(["Zoom Second Wind", "Zoom Second Wind"]);
    expect(restButtons()).toEqual([
      { name: "Short rest", description: "Second Wind", disabled: true },
      { name: "Long rest", description: "Everything", disabled: true },
    ]);
  });

  test("spent cards are still spent after a reload", async () => {
    renderAt("/character/f1");
    await spend("Second Wind");
    cleanup();

    renderAt("/character/f1");
    expect(zoomNames("Second Wind")).toEqual(["Zoom Second Wind, spent", "Zoom Second Wind"]);
  });

  test("Share copies an import link that decodes back to the build", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    renderAt("/character/f1");

    fireEvent.click(screen.getByRole("button", { name: "Share" }));

    const status = await screen.findByText(/link copied/i);
    const menu = within(screen.getByRole("navigation", { name: "Character menu" }));
    expect(menu.getByRole("status")).toBe(status);
    const imported = characters.fromShareCode(sharedCode(writeText.mock.calls[0]?.[0]));
    expect({ ...imported, id: "new" }).toEqual({ ...brunhilde(), id: "new" });
  });

  test("when the clipboard refuses, the link is shown to copy by hand", async () => {
    stubClipboard(() => Promise.reject(new Error("denied")));
    renderAt("/character/f1");

    fireEvent.click(screen.getByRole("button", { name: "Share" }));

    const field = await screen.findByRole("textbox", { name: "Share link" });
    const imported = characters.fromShareCode(sharedCode((field as HTMLInputElement).value));
    expect({ ...imported, id: "new" }).toEqual({ ...brunhilde(), id: "new" });
  });

  test("an unknown id says so and links home", () => {
    renderAt("/character/nobody");
    screen.getByRole("heading", { name: "Character not found", level: 2 });
    screen.getByRole("link", { name: "Back to your characters" });
  });
});
