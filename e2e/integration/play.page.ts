import type { Page } from "@playwright/test";
import type { Build } from "./import.page";
import { createImportPage } from "./import.page";

export function createPlayPage(page: Page) {
  const table = page.getByRole("main");
  const spotlight = page.getByRole("dialog");
  const spend = spotlight.getByRole("button", { name: "Spend" });
  const zoom = (name: string) => table.getByRole("button", { name: `Zoom ${name}`, exact: true });

  return {
    name(name: string) {
      return table.getByRole("heading", { name, level: 2 });
    },
    menuButton: page.getByRole("button", { name: "Menu" }),
    menu: page.getByRole("navigation", { name: "Character menu" }),
    spotlight,
    putBack: page.getByRole("button", { name: "Put it back" }),
    spend,
    recover: spotlight.getByRole("button", { name: "Recover" }),
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

    zoom,

    spent(name: string) {
      return table.getByRole("button", { name: `Zoom ${name}, spent`, exact: true });
    },

    async spendOne(name: string) {
      await zoom(name).first().click();
      await spend.click();
      await spotlight.waitFor({ state: "detached" });
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
