import { fighter } from "../integration/fixtures/builds.fixture";
import { expect, test } from "../integration/fixtures/test.extend";
import { globalSetup } from "../integration/global.setup";

globalSetup();

test.describe("play: delete character", () => {
  test("the delete dialog asks in the viewport, then confirming goes home", async ({
    page,
    homePage,
    playPage,
  }) => {
    await playPage.open(fighter);
    await playPage.menuButton.click();
    await playPage.deleteCharacter.click();

    await expect(playPage.confirmDelete("Brünhilde")).toBeInViewport();
    await expect.soft(playPage.menu).toBeHidden();

    await playPage
      .confirmDelete("Brünhilde")
      .getByRole("button", { name: "Delete Brünhilde" })
      .click();

    await expect(page).toHaveURL(/#\/$/);
    await expect.soft(homePage.emptyHeading).toBeVisible();
  });
});
