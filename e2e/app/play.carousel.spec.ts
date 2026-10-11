import { fighter } from "../integration/fixtures/builds.fixture";
import { expect, test } from "../integration/fixtures/test.extend";
import { globalSetup } from "../integration/global.setup";

globalSetup();

test.describe("play: carousel", () => {
  test("the play view opens on the carousel and a swipe moves to the next card", async ({
    playPage,
  }) => {
    await playPage.open(fighter);

    const carousel = playPage.carousel("Brünhilde's cards");
    await expect(carousel).toBeVisible();
    await expect(playPage.position).toHaveText(/^Resources · 1 \/ \d+$/);

    await playPage.carouselTrack("Brünhilde's cards").evaluate((track) => {
      const slide = track.children[0];
      track.scrollBy({ left: slide.getBoundingClientRect().width });
    });

    await expect(playPage.position).toHaveText(/^Resources · 2 \/ \d+$/);
  });

  test("Spend under the card survives a reload and a long rest recovers it", async ({
    page,
    playPage,
  }) => {
    await playPage.open(fighter);

    // Second Wind leads the deck — its actions sit right under the centred card
    await playPage.cardActions("Second Wind").getByRole("button", { name: "Spend" }).click();
    await expect(playPage.carouselCard("Second Wind, spent")).toBeVisible();
    await expect.soft(playPage.carousel("Brünhilde's cards").getByText("Spent")).toBeVisible();

    await page.reload();
    await expect(playPage.carouselCard("Second Wind, spent")).toBeVisible();

    await playPage.longRest.click();
    await expect(playPage.carouselCard("Second Wind")).toBeVisible();
    await expect.soft(playPage.restStatus).toHaveText("Long rest: Second Wind recovered");
  });

  test("the Grid toggle brings back the mat, and the choice is remembered", async ({
    page,
    playPage,
  }) => {
    await playPage.open(fighter);
    await playPage.gridButton.click();
    await expect(playPage.section("Resources")).toBeVisible();
    await expect.soft(playPage.carousel("Brünhilde's cards")).toHaveCount(0);

    await page.reload();
    await expect(playPage.section("Resources")).toBeVisible();
  });
});
