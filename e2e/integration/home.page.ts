import type { Page } from "@playwright/test";

export function createHomePage(page: Page) {
  const main = page.getByRole("main");
  const nav = page.getByRole("navigation", { name: "Main" });

  return {
    emptyHeading: page.getByRole("heading", {
      name: "Build a character to bring to the table",
      level: 2,
    }),
    othersHeading: page.getByRole("heading", { name: "Other characters", level: 2 }),
    newCharacter: main.getByRole("link", { name: "New character" }),
    openCatalog: page.getByRole("link", { name: "Open the card catalog" }),
    continueAs(name: string) {
      return main.getByRole("link", { name: `Continue as ${name}` });
    },
    character(name: string) {
      return main.getByRole("link", { name: new RegExp(name) });
    },
    listed(name: string) {
      return main.getByRole("listitem").getByRole("link", { name: new RegExp(name) });
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
