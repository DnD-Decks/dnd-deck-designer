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
    await playPage
      .cardActions("Second Wind (Short Rest)")
      .getByRole("button", { name: "Spend" })
      .click();
    await expect(playPage.carouselCard("Second Wind (Short Rest), spent")).toBeVisible();
    // the slide and its thumbnail both carry the Spent mark; the slide's comes first
    await expect
      .soft(playPage.carousel("Brünhilde's cards").getByText("Spent").first())
      .toBeVisible();

    await page.reload();
    await expect(playPage.carouselCard("Second Wind (Short Rest), spent")).toBeVisible();

    await playPage.longRest.click();
    await expect(playPage.carouselCard("Second Wind (Short Rest)")).toBeVisible();
    await expect.soft(playPage.restStatus).toHaveText("Long rest: Second Wind recovered");
  });
});
