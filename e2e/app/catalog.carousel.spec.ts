import { expect, test } from "../integration/fixtures/test.extend";
import { globalSetup } from "../integration/global.setup";

globalSetup();

test.describe("catalog: carousel", () => {
  test("a swipe along the track moves to the next card", async ({ catalogPage }) => {
    await catalogPage.goto("wizard");
    await expect(catalogPage.position).toHaveText(/· 1 \/ \d+$/);

    await catalogPage.carouselTrack("Wizard cards").evaluate((track) => {
      const slide = track.children[0];
      track.scrollBy({ left: slide.getBoundingClientRect().width });
    });

    await expect(catalogPage.position).toHaveText(/· 2 \/ \d+$/);
  });

  test("navigating the carousel never scrolls the page", async ({ page, catalogPage }) => {
    await catalogPage.goto("wizard");
    const scrollY = () => page.evaluate(() => window.scrollY);
    expect(await scrollY()).toBe(0);

    await catalogPage.nextCard.click();
    await catalogPage.nextCard.click();
    await catalogPage.nextCard.click();
    await expect(catalogPage.position).toHaveText(/· 4 \/ \d+$/);
    expect(await scrollY()).toBe(0);

    // evaluate-click skips Playwright's own scroll-into-view, which would muddy the reading
    await catalogPage.thumb("Witch Bolt").evaluate((el: HTMLElement) => el.click());
    await expect(catalogPage.position).toHaveText(/^Level 1 · \d+ \/ \d+$/);
    expect(await scrollY()).toBe(0);
  });

  test("switching class resets to the first card", async ({ catalogPage }) => {
    await catalogPage.goto("wizard");
    await catalogPage.nextCard.click();
    await expect(catalogPage.position).toHaveText(/· 2 \/ \d+$/);

    await catalogPage.selectClass("Fighter");
    await expect(catalogPage.position).toHaveText(/· 1 \/ \d+$/);
  });

  test("the view choice survives a reload", async ({ page, catalogPage }) => {
    await catalogPage.goto("wizard");
    await catalogPage.showGrid();
    await expect(catalogPage.section("Cantrips")).toBeVisible();

    await page.reload();

    await expect(catalogPage.gridButton).toHaveAttribute("aria-pressed", "true");
    await expect(catalogPage.section("Cantrips")).toBeVisible();
  });
});
