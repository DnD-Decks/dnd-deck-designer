import type { Page } from "@playwright/test";

type Build = { cls: string; level: number; name: string; picks: Record<string, string[]> };

export function createImportPage(page: Page) {
  return {
    heading(name: string) {
      return page.getByRole("heading", { name, level: 2 });
    },
    card(name: string) {
      return page.getByRole("main").getByRole("article", { name, exact: true });
    },
    save: page.getByRole("button", { name: "Save to this device" }),
    menu: page.getByRole("button", { name: "Menu" }),
    backHome: page.getByRole("link", { name: "Back to your characters" }),

    // encoded independently of the app, so the share format is pinned by the test
    async goto(build: Build | string) {
      const code =
        typeof build === "string"
          ? build
          : Buffer.from(JSON.stringify(build)).toString("base64url");
      await page.goto(`/#/import/${code}`);
    },
  };
}

export type ImportPage = ReturnType<typeof createImportPage>;
