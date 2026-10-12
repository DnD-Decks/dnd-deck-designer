import { fighter } from "../integration/fixtures/builds.fixture";
import { expect, test } from "../integration/fixtures/test.extend";
import { globalSetup } from "../integration/global.setup";

globalSetup();

// a fighter who picked up a cleric spell through Add cards
const build = {
  ...fighter,
  picks: { ...fighter.picks, custom: ["spell-cure-wounds"] },
};

test.describe("builder: custom cards", () => {
  test("the custom step lists the hand-picked cards and Remove takes one out", async ({
    page,
    playPage,
  }) => {
    await playPage.open(build);

    const carousel = playPage.carousel("Brünhilde's cards");
    await expect(carousel.getByRole("button", { name: "Go to Cure Wounds" })).toBeVisible();

    await playPage.menuButton.click();
    await playPage.menu.getByRole("link", { name: "Edit" }).click();

    const steps = page.getByRole("list", { name: "Character builder steps" });
    await expect(steps.getByText("Custom cards")).toBeVisible();

    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByRole("heading", { name: "Custom cards" })).toBeVisible();
    await expect(page.getByRole("article", { name: "Cure Wounds" })).toBeVisible();

    await page.getByRole("button", { name: "Remove Cure Wounds" }).click();
    await expect(steps.getByText("Custom cards")).toHaveCount(0);

    await page.getByRole("button", { name: "Build deck" }).click();
    await expect(page).toHaveURL(/#\/character\/[\w-]+$/);
    await expect(
      playPage.carousel("Brünhilde's cards").getByRole("button", { name: "Go to Cure Wounds" })
    ).toHaveCount(0);
  });
});
