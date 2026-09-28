import { expect, test } from "../integration/fixtures/test.extend";
import { globalSetup } from "../integration/global.setup";

globalSetup();

test.describe("home: empty state", () => {
  test("with no characters yet, home points to the card catalog", async ({
    page,
    homePage,
    catalogPage,
  }) => {
    await homePage.goto();
    await expect(homePage.heading).toBeVisible();
    await expect.soft(homePage.navLink("Your characters")).toHaveAttribute("aria-current", "page");

    await homePage.openCatalog.click();

    await expect.soft(page).toHaveURL(/#\/catalog\/wizard$/);
    await expect.soft(catalogPage.card("Arcane Recovery")).toBeVisible();
    await expect.soft(homePage.navLink("Card catalog")).toHaveAttribute("aria-current", "page");
  });
});
