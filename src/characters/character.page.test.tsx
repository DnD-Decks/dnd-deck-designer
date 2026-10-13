import { fireEvent, screen, waitForElementToBeRemoved, within } from "@testing-library/react";
import { decks } from "src/decks/deck.model";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { renderAt, seedBrunhildeOnGrid, showCarousel } from "./character-page.fixture.tsx";

beforeEach(seedBrunhildeOnGrid);
afterEach(() => vi.restoreAllMocks());

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

  test("tapping a card lifts it into the spotlight", () => {
    renderAt("/character/f1");
    fireEvent.click(screen.getByRole("button", { name: "Zoom Shortbow" }));
    screen.getByRole("dialog", { name: "Shortbow" });
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

  test("a deck with no cards says so", () => {
    vi.spyOn(decks, "forCharacter").mockReturnValue({
      cls: decks.get({ cls: "fighter" }).cls,
      entries: [],
    });
    renderAt("/character/f1");
    screen.getByText(/No cards in this deck yet/);
  });

  test("an unknown id says so and links home", () => {
    renderAt("/character/nobody");
    screen.getByRole("heading", { name: "Character not found", level: 2 });
    screen.getByRole("link", { name: "Back to your characters" });
  });

  test("the play view opens on the carousel", () => {
    // no stored preference — the carousel is the default, not a choice
    localStorage.removeItem("dnd-deck-designer:view-mode");
    renderAt("/character/f1");
    screen.getByRole("region", { name: "Brünhilde's cards" });
    expect(screen.queryByRole("region", { name: "Resources" })).toBeNull();
    expect(screen.getByRole("button", { name: "Carousel" }).getAttribute("aria-pressed")).toBe(
      "true"
    );
  });

  test("the toggle switches between the carousel and the grid", () => {
    showCarousel();
    renderAt("/character/f1");

    fireEvent.click(screen.getByRole("button", { name: "Grid" }));
    screen.getByRole("region", { name: "Resources" });
    expect(screen.queryByRole("region", { name: "Brünhilde's cards" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Carousel" }));
    screen.getByRole("region", { name: "Brünhilde's cards" });
    expect(screen.queryByRole("region", { name: "Resources" })).toBeNull();
  });
});
