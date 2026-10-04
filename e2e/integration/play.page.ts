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

    section(name: string) {
      return table.getByRole("region", { name, exact: true });
    },

    card(name: string) {
      return table.getByRole("article", { name, exact: true });
    },

    zoom(name: string) {
      return table.getByRole("button", { name: `Zoom ${name}`, exact: true });
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
