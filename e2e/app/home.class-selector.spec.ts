import { expect, test } from "../integration/fixtures/test.extend";
import { globalSetup } from "../integration/global.setup";

globalSetup();

test.describe("home: class selector", () => {
  test("picking a class swaps the deck and the URL hash", async ({ page, homePage }) => {
    await homePage.goto();
    await expect(homePage.card("Arcane Recovery")).toBeVisible();

    await homePage.selectClass("Fighter");

    await expect.soft(page).toHaveURL(/#fighter$/);
    await expect.soft(homePage.classButton("Fighter")).toHaveAttribute("aria-pressed", "true");
    await expect.soft(homePage.card("Second Wind")).toBeVisible();
    await expect.soft(homePage.card("Arcane Recovery")).toBeHidden();
  });
});
