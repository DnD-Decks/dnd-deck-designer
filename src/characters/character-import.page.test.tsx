import { fireEvent, render, screen } from "@testing-library/react";
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

const importLink = () => `/import/${characters.toShareCode(brunhilde())}`;

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("<CharacterImportPage />", () => {
  test("previews the shared build: name, class and only the picked cards", () => {
    renderAt(importLink());
    screen.getByRole("heading", { name: "Brünhilde", level: 2 });
    screen.getByText("Level 1 Fighter");
    screen.getByRole("heading", { name: "Longsword", level: 3 });
    expect(screen.queryByRole("heading", { name: "Greatsword", level: 3 })).toBeNull();
  });

  test("saving stores a copy and opens it", () => {
    const memory = renderAt(importLink());
    fireEvent.click(screen.getByRole("button", { name: "Save to this device" }));

    const [saved] = characterStorage.list();
    expect({ ...saved, id: "new" }).toEqual({ ...brunhilde(), id: "new" });
    expect(memory.history.slice(-1)).toEqual([`/character/${saved?.id}`]);
    screen.getByRole("button", { name: "Share" });
  });

  test("a blocked storage says so and stays on the preview", () => {
    vi.spyOn(characterStorage, "save").mockReturnValue(false);
    renderAt(importLink());
    fireEvent.click(screen.getByRole("button", { name: "Save to this device" }));
    screen.getByRole("alert");
    screen.getByRole("heading", { name: "Brünhilde", level: 2 });
  });

  test("a broken code explains the problem and links home", () => {
    const memory = renderAt("/import/not-a-real-code");
    screen.getByRole("heading", { name: "This share link doesn't work", level: 2 });
    fireEvent.click(screen.getByRole("link", { name: "Back to your characters" }));
    expect(memory.history.slice(-1)).toEqual(["/"]);
  });
});
