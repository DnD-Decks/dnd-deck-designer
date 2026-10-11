import { expect, test } from "../integration/fixtures/test.extend";
import { globalSetup } from "../integration/global.setup";

globalSetup();

test.describe("catalog: print view", () => {
  test("print media drops the screen chrome and keeps the cards", async ({ page, catalogPage }) => {
    await catalogPage.goto("wizard");
    await catalogPage.showGrid();
    await expect(catalogPage.title).toBeVisible();

    await page.emulateMedia({ media: "print" });

    await expect.soft(catalogPage.title).toBeHidden();
    await expect.soft(catalogPage.sectionTitles.first()).toBeHidden();
    await expect.soft(catalogPage.card("Fire Bolt")).toBeVisible();
  });

  test("the carousel still prints every card", async ({ page, catalogPage }) => {
    await catalogPage.goto("wizard"); // the carousel is the default view
    await expect(catalogPage.carousel("Wizard cards")).toBeVisible();

    await page.emulateMedia({ media: "print" });

    await expect.soft(catalogPage.title).toBeHidden();
    // the strip is screen chrome; every slide reaches the printer, even the last one
    await expect.soft(catalogPage.thumb("Fire Bolt")).toBeHidden();
    await expect.soft(catalogPage.nextCard).toBeHidden();
    await expect(catalogPage.card("Witch Bolt")).toBeVisible();
  });
});
