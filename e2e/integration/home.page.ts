import type { Page } from "@playwright/test";

export function createHomePage(page: Page) {
  const classSelector = page.getByRole("navigation", { name: "Character class" });
  const deck = page.getByRole("main");

  return {
    title: page.getByRole("heading", { level: 1 }),
    classSelector,
    deck,
    classButtons: classSelector.getByRole("button"),
    sectionTitles: deck.getByRole("heading", { level: 2 }),
    cards: deck.getByRole("article"),
    images: deck.getByRole("img"),
    spotlight: page.getByRole("dialog"),
    dismissSpotlight: page.getByRole("button", { name: "Put it back" }),

    classButton(label: string) {
      return classSelector.getByRole("button", { name: label });
    },

    section(name: string) {
      return deck.getByRole("region", { name, exact: true });
    },

    // exact: card names overlap as substrings ("Light" is inside "Dancing Lights")
    card(name: string) {
      return deck.getByRole("article", { name, exact: true });
    },

    // the control that lifts a card off the mat, one per card
    zoom(name: string) {
      return deck.getByRole("button", { name: `Zoom ${name}` });
    },

    async goto(cls?: string) {
      await page.goto(cls ? `/#${cls}` : "/");
    },

    async selectClass(label: string) {
      await classSelector.getByRole("button", { name: label }).click();
    },
  };
}

export type HomePage = ReturnType<typeof createHomePage>;
