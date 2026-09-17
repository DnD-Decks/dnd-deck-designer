// Describes the single page the app has: locators + intent-level helpers. No assertions here.
import type { Page } from "@playwright/test";

export function createHomePage(page: Page) {
  const classSelector = page.getByRole("navigation", { name: "Character class" });
  const deck = page.getByRole("main");

  return {
    title: page.getByRole("heading", { level: 1 }),
    classSelector,
    deck,
    /** Accessible name is "Wizard spell-caster d6" — match the label as a substring. */
    classButton: (label: string) => classSelector.getByRole("button", { name: label }),
    classButtons: classSelector.getByRole("button"),
    /** Deck sections are named regions: "Resources", "Class Features", "Cantrips", "Level 1". */
    section: (name: string) => deck.getByRole("region", { name, exact: true }),
    sectionTitles: deck.getByRole("heading", { level: 2 }),
    /** Exact: card names overlap as substrings ("Light" is inside "Dancing Lights"). */
    card: (name: string) => deck.getByRole("article", { name, exact: true }),
    cards: deck.getByRole("article"),
    emptyState: deck.getByText(/no cards vendored/i),

    async goto(cls?: string) {
      await page.goto(cls ? `/#${cls}` : "/");
    },

    async selectClass(label: string) {
      await classSelector.getByRole("button", { name: label }).click();
    },

    /** The "N cards" tally a section advertises, for comparison with what it renders. */
    async advertisedCount(name: string) {
      const tally = deck.getByRole("region", { name, exact: true }).getByText(/^\d+ cards$/);
      const text = (await tally.textContent()) ?? "";
      return Number(text.replace(" cards", ""));
    },
  };
}

export type HomePage = ReturnType<typeof createHomePage>;
