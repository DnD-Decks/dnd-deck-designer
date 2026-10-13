import type { Page } from "@playwright/test";
import { createDeckLocators } from "./deck.locators";
import type { Build } from "./import.page";
import { createImportPage } from "./import.page";

export function createPlayPage(page: Page) {
  const table = page.getByRole("main");
  const deck = createDeckLocators({ page, root: table });
  const spend = deck.spotlight.getByRole("button", { name: "Spend" });

  return {
    ...deck,
    name(name: string) {
      return table.getByRole("heading", { name, level: 2 });
    },
    menuButton: page.getByRole("button", { name: "Menu" }),
    menu: page.getByRole("navigation", { name: "Character menu" }),
    spend,
    longRest: page.getByRole("button", { name: "Long rest" }),
    restStatus: table.getByRole("status").filter({ hasText: /rest:/ }),
    deleteCharacter: page.getByRole("button", { name: "Delete character" }),

    confirmDelete(name: string) {
      return page.getByRole("dialog", { name: `Delete ${name}?` });
    },

    // the Spend / Recover group under the centred card
    cardActions(name: string) {
      return table.getByRole("group", { name: `${name} actions` });
    },

    spent(name: string) {
      return table.getByRole("button", { name: `Zoom ${name}, spent`, exact: true });
    },

    async spendOne(name: string) {
      await deck.zoom(name).first().click();
      await spend.click();
      await deck.spotlight.waitFor({ state: "detached" });
    },

    // through the share link, the way a character reaches a phone
    async open(build: Build) {
      const importPage = createImportPage(page);
      await importPage.goto(build);
      await importPage.save.click();
      await page.waitForURL(/#\/character\/[\w-]+$/);
    },
  };
}

export type PlayPage = ReturnType<typeof createPlayPage>;
