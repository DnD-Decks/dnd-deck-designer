import { fireEvent, render, screen, waitForElementToBeRemoved } from "@testing-library/react";
import { decks } from "src/decks/deck.model";
import { classes } from "src/models/class/classes.model";
import { afterEach, expect, test, vi } from "vitest";
import { DeckView } from "./deck-view.component.tsx";

afterEach(() => {
  vi.restoreAllMocks();
});

test("wizard deck renders a 'Cantrips' section heading", () => {
  render(<DeckView cls="wizard" />);
  screen.getByRole("heading", { name: /cantrips/i, level: 2 });
});

test("wizard deck renders a 'Level 1' section heading (L1-only scope)", () => {
  render(<DeckView cls="wizard" />);
  screen.getByRole("heading", { name: /level 1/i, level: 2 });
});

test("wizard deck has no 'Level 2' section heading (L1-only scope)", () => {
  render(<DeckView cls="wizard" />);
  const level2 = screen.queryByRole("heading", { name: /level 2/i, level: 2 });
  expect(level2).toBeNull();
});

test("wizard deck contains the Fire Bolt spell card", () => {
  render(<DeckView cls="wizard" />);
  screen.getByRole("heading", { name: /fire bolt/i, level: 3 });
});

test("a deck without cards renders the empty-state message", () => {
  // every class now has vendored cards, so an empty deck only exists as a stub
  vi.spyOn(decks, "get").mockReturnValue({ cls: classes.get({ id: "ranger" }), cards: [] });
  render(<DeckView cls="ranger" />);
  screen.getByText(/no cards vendored for ranger/i);
});

test("clicking a card holds it in the spotlight", () => {
  render(<DeckView cls="wizard" />);
  fireEvent.click(screen.getByRole("button", { name: "Zoom Fire Bolt" }));
  screen.getByRole("dialog", { name: "Fire Bolt" });
});

test("the deck is hidden from assistive tech while a card is held", () => {
  render(<DeckView cls="wizard" />);
  screen.getByRole("heading", { name: /cantrips/i, level: 2 });

  fireEvent.click(screen.getByRole("button", { name: "Zoom Fire Bolt" }));
  expect(screen.queryByRole("heading", { name: /cantrips/i, level: 2 })).toBeNull();
  // only the held copy of the card is reachable
  expect(screen.getAllByRole("heading", { name: /fire bolt/i, level: 3 })).toHaveLength(1);
});

test("putting the card back returns to the deck", async () => {
  render(<DeckView cls="wizard" />);
  fireEvent.click(screen.getByRole("button", { name: "Zoom Fire Bolt" }));
  fireEvent.click(screen.getByRole("button", { name: "Put it back" }));

  await waitForElementToBeRemoved(() => screen.queryByRole("dialog"), { timeout: 3000 });
  screen.getByRole("heading", { name: /cantrips/i, level: 2 });
});

test("→ holds the next card in the deck", () => {
  render(<DeckView cls="wizard" />);
  fireEvent.click(screen.getByRole("button", { name: "Zoom Acid Splash" }));
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "ArrowRight" });

  screen.getByRole("dialog", { name: "Blade Ward" });
});

test("← crosses back out of the section, into the card before it", () => {
  render(<DeckView cls="wizard" />);
  fireEvent.click(screen.getByRole("button", { name: "Zoom Acid Splash" }));
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "ArrowLeft" });

  // Acid Splash opens the Cantrips section; the card before it is the last Class Feature
  screen.getByRole("dialog", { name: "Arcane Recovery" });
});

test("the first card in the deck has nowhere to go back to", () => {
  render(<DeckView cls="wizard" />);
  fireEvent.click(screen.getByRole("button", { name: "Zoom Mana" }));
  expect(screen.queryByRole("button", { name: /previous card/i })).toBeNull();

  fireEvent.keyDown(screen.getByRole("dialog"), { key: "ArrowLeft" });
  screen.getByRole("dialog", { name: "Mana" });
});

test("the caption names both neighbours, and holds the one you click", () => {
  render(<DeckView cls="wizard" />);
  fireEvent.click(screen.getByRole("button", { name: "Zoom Blade Ward" }));
  screen.getByRole("button", { name: "Previous card: Acid Splash" });

  fireEvent.click(screen.getByRole("button", { name: "Next card: Chill Touch" }));
  screen.getByRole("dialog", { name: "Chill Touch" });
});

test("Escape from a card reached with the arrows returns focus to that card", async () => {
  render(<DeckView cls="wizard" />);
  fireEvent.click(screen.getByRole("button", { name: "Zoom Acid Splash" }));
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "ArrowRight" });
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

  await waitForElementToBeRemoved(() => screen.queryByRole("dialog"), { timeout: 3000 });
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Zoom Blade Ward" }));
});
