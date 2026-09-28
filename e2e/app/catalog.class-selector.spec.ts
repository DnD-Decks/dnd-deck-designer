import { expect, test } from "../integration/fixtures/test.extend";
import { globalSetup } from "../integration/global.setup";

globalSetup();

test.describe("catalog: class selector", () => {
  test("picking a class swaps the deck and the URL hash", async ({ page, catalogPage }) => {
    await catalogPage.goto();
    await expect(catalogPage.card("Arcane Recovery")).toBeVisible();

    await catalogPage.selectClass("Fighter");

    await expect.soft(page).toHaveURL(/#\/catalog\/fighter$/);
    await expect.soft(catalogPage.classButton("Fighter")).toHaveAttribute("aria-pressed", "true");
    await expect.soft(catalogPage.card("Second Wind")).toBeVisible();
    await expect.soft(catalogPage.card("Arcane Recovery")).toBeHidden();
  });
});
