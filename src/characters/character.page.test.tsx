import { fireEvent, render, screen } from "@testing-library/react";
import { App } from "src/app/app.component";
import type { Character } from "src/characters/character.model";
import { characters } from "src/characters/character.model";
import { characterStorage } from "src/services/character.storage";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { memoryLocation } from "wouter/memory-location";

const fighter: Character = {
  id: "f1",
  name: "Brünhilde",
  cls: "fighter",
  level: 1,
  picks: { weapons: ["longsword", "shortbow", "dagger"] },
};

const renderAt = (path: string) => {
  const memory = memoryLocation({ path, record: true });
  render(<App hook={memory.hook} />);
  return memory;
};

const stubClipboard = (writeText: (text: string) => Promise<void>) =>
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

beforeEach(() => {
  localStorage.clear();
  characterStorage.save(fighter);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("<CharacterPage />", () => {
  test("shows the saved character's deck", () => {
    renderAt("/c/f1");
    screen.getByRole("heading", { name: "Brünhilde", level: 2 });
    screen.getByRole("heading", { name: "Shortbow", level: 3 });
  });

  test("Share copies an import link that decodes back to the build", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    renderAt("/c/f1");

    fireEvent.click(screen.getByRole("button", { name: "Share" }));

    expect(await screen.findByRole("status")).toHaveProperty(
      "textContent",
      expect.stringMatching(/link copied/i)
    );
    const [link] = writeText.mock.calls[0] ?? [];
    const code = String(link).split("#/import/")[1] ?? "";
    expect(characters.fromShareCode(code)?.name).toBe("Brünhilde");
  });

  test("when the clipboard refuses, the link is shown to copy by hand", async () => {
    stubClipboard(() => Promise.reject(new Error("denied")));
    renderAt("/c/f1");

    fireEvent.click(screen.getByRole("button", { name: "Share" }));

    const field = await screen.findByRole("textbox", { name: "Share link" });
    expect((field as HTMLInputElement).value).toContain("#/import/");
  });

  test("an unknown id says so and links home", () => {
    renderAt("/c/nobody");
    screen.getByRole("heading", { name: "Character not found", level: 2 });
    screen.getByRole("link", { name: "Back to your characters" });
  });
});
