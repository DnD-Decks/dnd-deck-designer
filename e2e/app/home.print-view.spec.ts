import { expect, test } from "../integration/fixtures/test.extend";
import { globalSetup } from "../integration/global.setup";

globalSetup();

test.describe("home: print view", () => {
  test("print media drops the screen chrome and keeps the cards", async ({ page, homePage }) => {
    await homePage.goto("wizard");
    await expect(homePage.title).toBeVisible();

    await page.emulateMedia({ media: "print" });

    await expect.soft(homePage.title).toBeHidden();
    await expect.soft(homePage.sectionTitles.first()).toBeHidden();
    await expect.soft(homePage.card("Fire Bolt")).toBeVisible();
  });
});
