import type { Page } from "@playwright/test";
import { createDeckLocators } from "./deck.locators";

export function createCatalogPage(page: Page) {
  const classSelector = page.getByRole("navigation", { name: "Character class" });
  const main = page.getByRole("main");
  const deck = createDeckLocators({ page, root: main });

  return {
    ...deck,
    title: page.getByRole("heading", { level: 1 }),
    sectionTitles: main.getByRole("heading", { level: 2 }),
    cards: main.getByRole("article"),
    // every icon <img>, decorative ones included: the offline spec checks that each file loads;
    // card art is lazy and optional, so it stays out
    icons: main.locator('img[src^="/icons/"]'),
    nextCard: page.getByRole("button", { name: "Next card" }),

    classButton(label: string) {
      return classSelector.getByRole("button", { name: label });
    },

    async goto(cls?: string) {
      await page.goto(`/#/catalog${cls ? `/${cls}` : ""}`);
    },

    // the add-cards flow: the catalog carousel in selection mode for a character
    async gotoAdd({ id, cls }: { id: string; cls?: string }) {
      await page.goto(`/#/character/${id}/add${cls ? `/${cls}` : ""}`);
    },

    confirmAdd(name: string) {
      return page.getByRole("button", { name: `Add to ${name}`, exact: true });
    },

    cancelAdd: page.getByRole("link", { name: "Cancel" }),

    async selectClass(label: string) {
      await classSelector.getByRole("button", { name: label }).click();
    },
  };
}

export type CatalogPage = ReturnType<typeof createCatalogPage>;
