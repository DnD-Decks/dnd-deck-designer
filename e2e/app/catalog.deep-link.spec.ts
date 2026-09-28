import { expect, test } from "../integration/fixtures/test.extend";
import { globalSetup } from "../integration/global.setup";

globalSetup();

test.describe("catalog: deep linking", () => {
  test("opens the class named in the URL hash", async ({ catalogPage }) => {
    await catalogPage.goto("fighter");

    await expect.soft(catalogPage.classButton("Fighter")).toHaveAttribute("aria-pressed", "true");
    await expect.soft(catalogPage.card("Second Wind")).toBeVisible();
  });

  test("falls back to the wizard deck when the hash names no known class", async ({
    catalogPage,
  }) => {
    await catalogPage.goto("illithid");

    await expect.soft(catalogPage.classButton("Wizard")).toHaveAttribute("aria-pressed", "true");
    await expect.soft(catalogPage.card("Arcane Recovery")).toBeVisible();
  });

  test("a pre-routing #fighter link lands on the fighter catalog", async ({
    page,
    catalogPage,
  }) => {
    await page.goto("/#fighter");

    await expect.soft(page).toHaveURL(/#\/catalog\/fighter$/);
    await expect.soft(catalogPage.card("Second Wind")).toBeVisible();
  });

  test("browser back returns to the previously selected class", async ({ page, catalogPage }) => {
    await catalogPage.goto("wizard");
    await catalogPage.selectClass("Druid");
    await expect(catalogPage.classButton("Druid")).toHaveAttribute("aria-pressed", "true");

    await page.goBack();

    await expect.soft(page).toHaveURL(/#\/catalog\/wizard$/);
    await expect.soft(catalogPage.classButton("Wizard")).toHaveAttribute("aria-pressed", "true");
  });
});
