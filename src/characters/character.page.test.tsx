import { fireEvent, render, screen, within } from "@testing-library/react";
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

  test("Share copies an import link that decodes back to the build", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    renderAt("/character/f1");

    fireEvent.click(screen.getByRole("button", { name: "Share" }));

    const status = await screen.findByText(/link copied/i);
    expect(screen.getByRole("status")).toBe(status);
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
