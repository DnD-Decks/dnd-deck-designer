import { expect, test } from "../integration/fixtures/test.extend";
import { globalSetup } from "../integration/global.setup";

globalSetup();

test.describe("home: deep linking", () => {
  test("opens the class named in the URL hash", async ({ homePage }) => {
    await homePage.goto("fighter");

    await expect.soft(homePage.classButton("Fighter")).toHaveAttribute("aria-pressed", "true");
    await expect.soft(homePage.card("Second Wind")).toBeVisible();
  });

  test("falls back to the wizard deck when the hash names no known class", async ({ homePage }) => {
    await homePage.goto("illithid");

    await expect.soft(homePage.classButton("Wizard")).toHaveAttribute("aria-pressed", "true");
    await expect.soft(homePage.card("Arcane Recovery")).toBeVisible();
  });

  test("browser back returns to the previously selected class", async ({ page, homePage }) => {
    await homePage.goto("wizard");
    await homePage.selectClass("Druid");
    await expect(homePage.classButton("Druid")).toHaveAttribute("aria-pressed", "true");

    await page.goBack();

    await expect.soft(page).toHaveURL(/#wizard$/);
    await expect.soft(homePage.classButton("Wizard")).toHaveAttribute("aria-pressed", "true");
  });
});
