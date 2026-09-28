import { expect, test } from "../integration/fixtures/test.extend";
import { globalSetup } from "../integration/global.setup";

globalSetup();

test.describe("catalog: print view", () => {
  test("print media drops the screen chrome and keeps the cards", async ({ page, catalogPage }) => {
    await catalogPage.goto("wizard");
    await expect(catalogPage.title).toBeVisible();

    await page.emulateMedia({ media: "print" });

    await expect.soft(catalogPage.title).toBeHidden();
    await expect.soft(catalogPage.sectionTitles.first()).toBeHidden();
    await expect.soft(catalogPage.card("Fire Bolt")).toBeVisible();
  });
});
