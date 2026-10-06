import type { Page } from "@playwright/test";
import { createImportPage } from "./import.page";

type Build = Parameters<ReturnType<typeof createImportPage>["goto"]>[0];

export function createPlayPage(page: Page) {
  const table = page.getByRole("main");

  return {
    name(name: string) {
      return table.getByRole("heading", { name, level: 2 });
    },
    menuButton: page.getByRole("button", { name: "Menu" }),
    menu: page.getByRole("navigation", { name: "Character menu" }),
    spotlight: page.getByRole("dialog"),
    putBack: page.getByRole("button", { name: "Put it back" }),
    spend: page.getByRole("dialog").getByRole("button", { name: "Spend" }),
    recover: page.getByRole("dialog").getByRole("button", { name: "Recover" }),
    shortRest: page.getByRole("button", { name: "Short rest" }),
    longRest: page.getByRole("button", { name: "Long rest" }),
    restStatus: table.getByRole("status").filter({ hasText: /rest:/ }),
    back: page.getByRole("link", { name: "Back to your characters" }),
    deleteCharacter: page.getByRole("button", { name: "Delete character" }),

    confirmDelete(name: string) {
      return page.getByRole("dialog", { name: `Delete ${name}?` });
    },

    section(name: string) {
      return table.getByRole("region", { name, exact: true });
    },

    card(name: string) {
      return table.getByRole("article", { name, exact: true });
    },

    zoom(name: string) {
      return table.getByRole("button", { name: `Zoom ${name}`, exact: true });
    },

    spent(name: string) {
      return table.getByRole("button", { name: `Zoom ${name}, spent`, exact: true });
    },

    async spendOne(name: string) {
      await table
        .getByRole("button", { name: `Zoom ${name}`, exact: true })
        .first()
        .click();
      await page.getByRole("dialog").getByRole("button", { name: "Spend" }).click();
      await page.getByRole("dialog").waitFor({ state: "detached" });
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
