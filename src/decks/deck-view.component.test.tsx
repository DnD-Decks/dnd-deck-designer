import {
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import { decks } from "src/decks/deck.model";
import { classes } from "src/models/class/classes.model";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { DeckView } from "./deck-view.component.tsx";

beforeEach(() => localStorage.clear());

afterEach(() => {
  vi.restoreAllMocks();
});

// the grid tests below exercise today's mat; the catalog opens on the carousel
const showGrid = () => fireEvent.click(screen.getByRole("button", { name: "Grid" }));

describe("<DeckView />", () => {
  describe("grid{}", () => {
    test("groups the deck into Cantrips and Level 1 sections, in level-1 scope", () => {
      render(<DeckView cls="wizard" />);
      showGrid();

      screen.getByRole("heading", { name: /cantrips/i, level: 2 });
      screen.getByRole("heading", { name: /level 1/i, level: 2 });
      expect(screen.queryByRole("heading", { name: /level 2/i, level: 2 })).toBeNull();
      screen.getByRole("heading", { name: /fire bolt/i, level: 3 });
    });

    test("a section holding one card counts it in the singular", () => {
      render(<DeckView cls="wizard" />);
      showGrid();
      screen.getByText("1 card");
    });

    test("a deck without cards renders the empty-state message", () => {
      // every class now has vendored cards, so an empty deck only exists as a stub
      vi.spyOn(decks, "get").mockReturnValue({ cls: classes.get({ id: "ranger" }), cards: [] });
      render(<DeckView cls="ranger" />);
      screen.getByText(/no cards vendored for ranger/i);
    });
  });

  describe("spotlight{}", () => {
    test("clicking a card holds it in the spotlight", () => {
      render(<DeckView cls="wizard" />);
      showGrid();
      fireEvent.click(screen.getByRole("button", { name: "Zoom Fire Bolt" }));
      screen.getByRole("dialog", { name: "Fire Bolt" });
    });

    test("the deck is hidden from assistive tech while a card is held", () => {
      render(<DeckView cls="wizard" />);
      showGrid();
      screen.getByRole("heading", { name: /cantrips/i, level: 2 });

      fireEvent.click(screen.getByRole("button", { name: "Zoom Fire Bolt" }));
      expect(screen.queryByRole("heading", { name: /cantrips/i, level: 2 })).toBeNull();
      // only the held copy of the card is reachable
      expect(screen.getAllByRole("heading", { name: /fire bolt/i, level: 3 })).toHaveLength(1);
    });

    test("putting the card back returns to the deck", async () => {
      render(<DeckView cls="wizard" />);
      showGrid();
      fireEvent.click(screen.getByRole("button", { name: "Zoom Fire Bolt" }));
      fireEvent.click(screen.getByRole("button", { name: "Put it back" }));

      await waitForElementToBeRemoved(() => screen.queryByRole("dialog"), { timeout: 3000 });
      screen.getByRole("heading", { name: /cantrips/i, level: 2 });
    });

    test("→ holds the next card in the deck", () => {
      render(<DeckView cls="wizard" />);
      showGrid();
      fireEvent.click(screen.getByRole("button", { name: "Zoom Acid Splash" }));
      fireEvent.keyDown(screen.getByRole("dialog"), { key: "ArrowRight" });

      screen.getByRole("dialog", { name: "Blade Ward" });
    });

    test("← crosses back out of the section, into the card before it", () => {
      render(<DeckView cls="wizard" />);
      showGrid();
      fireEvent.click(screen.getByRole("button", { name: "Zoom Acid Splash" }));
      fireEvent.keyDown(screen.getByRole("dialog"), { key: "ArrowLeft" });

      // Acid Splash opens the Cantrips section; the card before it is the last Class Feature
      screen.getByRole("dialog", { name: "Arcane Recovery" });
    });

    test("the first card in the deck has nowhere to go back to", () => {
      render(<DeckView cls="wizard" />);
      showGrid();
      fireEvent.click(screen.getByRole("button", { name: "Zoom Mana" }));
      expect(screen.queryByRole("button", { name: /previous card/i })).toBeNull();

      fireEvent.keyDown(screen.getByRole("dialog"), { key: "ArrowLeft" });
      screen.getByRole("dialog", { name: "Mana" });
    });

    test("the caption names both neighbours, and holds the one you click", () => {
      render(<DeckView cls="wizard" />);
      showGrid();
      fireEvent.click(screen.getByRole("button", { name: "Zoom Blade Ward" }));
      screen.getByRole("button", { name: "Previous card: Acid Splash" });

      fireEvent.click(screen.getByRole("button", { name: "Next card: Chill Touch" }));
      screen.getByRole("dialog", { name: "Chill Touch" });
    });

    test("Escape from a card reached with the arrows returns focus to that card", async () => {
      render(<DeckView cls="wizard" />);
      showGrid();
      fireEvent.click(screen.getByRole("button", { name: "Zoom Acid Splash" }));
      fireEvent.keyDown(screen.getByRole("dialog"), { key: "ArrowRight" });
      fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

      await waitForElementToBeRemoved(() => screen.queryByRole("dialog"), { timeout: 3000 });
      await vi.waitFor(() =>
        expect(document.activeElement).toBe(screen.getByRole("button", { name: "Zoom Blade Ward" }))
      );
    });
  });

  describe("view toggle{}", () => {
    test("the catalog opens on the carousel", () => {
      render(<DeckView cls="wizard" />);
      screen.getByRole("region", { name: "Wizard cards" });
      expect(screen.queryByRole("heading", { name: /cantrips/i, level: 2 })).toBeNull();
      expect(screen.getByRole("button", { name: "Carousel" }).getAttribute("aria-pressed")).toBe(
        "true"
      );
      expect(screen.getByRole("button", { name: "Grid" }).getAttribute("aria-pressed")).toBe(
        "false"
      );
    });

    test("the toggle switches between the carousel and the grid", () => {
      render(<DeckView cls="wizard" />);
      const toggle = within(screen.getByRole("group", { name: "View" }));
      toggle.getByRole("button", { name: "Grid" });
      toggle.getByRole("button", { name: "Carousel" });

      fireEvent.click(screen.getByRole("button", { name: "Grid" }));
      screen.getByRole("heading", { name: /cantrips/i, level: 2 });
      expect(screen.queryByRole("region", { name: "Wizard cards" })).toBeNull();

      fireEvent.click(screen.getByRole("button", { name: "Carousel" }));
      screen.getByRole("region", { name: "Wizard cards" });
      expect(screen.queryByRole("heading", { name: /cantrips/i, level: 2 })).toBeNull();
    });

    test("the chosen view is remembered", () => {
      const first = render(<DeckView cls="wizard" />);
      fireEvent.click(screen.getByRole("button", { name: "Grid" }));
      first.unmount();

      render(<DeckView cls="wizard" />);
      screen.getByRole("heading", { name: /cantrips/i, level: 2 });
      expect(screen.queryByRole("region", { name: "Wizard cards" })).toBeNull();
    });

    test("a corrupt stored view falls back to the carousel", () => {
      localStorage.setItem("dnd-deck-designer:view-mode", "mosaic");
      render(<DeckView cls="wizard" />);
      screen.getByRole("region", { name: "Wizard cards" });
    });

    test("printing swaps the carousel for the grid synchronously", () => {
      render(<DeckView cls="wizard" />);
      screen.getByRole("region", { name: "Wizard cards" });

      // not wrapped in act: the printer cannot wait for React to settle
      window.dispatchEvent(new Event("beforeprint"));
      screen.getByRole("heading", { name: /cantrips/i, level: 2 });
      expect(screen.queryByRole("region", { name: "Wizard cards" })).toBeNull();

      window.dispatchEvent(new Event("afterprint"));
      screen.getByRole("region", { name: "Wizard cards" });
      expect(screen.queryByRole("heading", { name: /cantrips/i, level: 2 })).toBeNull();
    });
  });
});
