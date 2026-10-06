import { fighter } from "../integration/fixtures/builds.fixture";
import { expect, test } from "../integration/fixtures/test.extend";
import { globalSetup } from "../integration/global.setup";

globalSetup();

test.describe("play: delete character", () => {
  test.beforeEach(async ({ playPage }) => {
    await playPage.open(fighter);
    await playPage.menuButton.click();
    await playPage.deleteCharacter.click();
  });

  test("the menu closes and a dialog asks before deleting", async ({ playPage }) => {
    await expect(playPage.confirmDelete("Brünhilde")).toBeVisible();
    await expect.soft(playPage.menu).toBeHidden();
    await expect.soft(playPage.confirmDelete("Brünhilde")).toBeInViewport();
  });

  test("Cancel keeps the character at the table", async ({ page, playPage }) => {
    await playPage.confirmDelete("Brünhilde").getByRole("button", { name: "Cancel" }).click();

    await expect(playPage.confirmDelete("Brünhilde")).toHaveCount(0);
    await expect.soft(page).toHaveURL(/#\/character\/[\w-]+$/);
  });

  test("confirming deletes the character and goes home", async ({ page, homePage, playPage }) => {
    await playPage
      .confirmDelete("Brünhilde")
      .getByRole("button", { name: "Delete Brünhilde" })
      .click();

    await expect(page).toHaveURL(/#\/$/);
    await expect.soft(homePage.emptyHeading).toBeVisible();
  });
});
