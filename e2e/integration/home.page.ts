import type { Page } from "@playwright/test";

export function createHomePage(page: Page) {
  const nav = page.getByRole("navigation", { name: "Main" });

  return {
    heading: page.getByRole("heading", { name: "Your characters", level: 2 }),
    openCatalog: page.getByRole("link", { name: "Open the card catalog" }),
    character(name: string) {
      return page.getByRole("main").getByRole("link", { name: new RegExp(name) });
    },
    navLink(name: string) {
      return nav.getByRole("link", { name });
    },

    async goto() {
      await page.goto("/");
    },
  };
}

export type HomePage = ReturnType<typeof createHomePage>;
