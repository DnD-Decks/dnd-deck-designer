import { fighter } from "../integration/fixtures/builds.fixture";
import { expect, test } from "../integration/fixtures/test.extend";
import { globalSetup } from "../integration/global.setup";

globalSetup();

// 63.5 × 88.9 mm at 96 dpi
const CARD = { width: 240, landscape: 336 };

test.describe("play: phone layout", () => {
  test.beforeEach(async ({ playPage }) => {
    await playPage.open(fighter);
  });

  test("the header stays pinned while the table scrolls", async ({ page, playPage }) => {
    await expect(playPage.name("Brünhilde")).toBeInViewport();
    await page.mouse.wheel(0, 3000);
    await expect(playPage.card("Fighting Style")).toBeInViewport();

    await expect.soft(playPage.name("Brünhilde")).toBeInViewport();
    await expect.soft(playPage.menuButton).toBeInViewport();
  });

  test("cards are zoomed down to fit the phone, and a row swipes sideways", async ({
    page,
    playPage,
  }) => {
    const viewport = page.viewportSize()?.width ?? 0;
    const portrait = await playPage.card("Dagger").boundingBox();
    const landscape = await playPage.card("Fighting Style").boundingBox();

    expect.soft(portrait?.width).toBeLessThan(CARD.width);
    expect.soft((landscape?.x ?? 0) + (landscape?.width ?? 0)).toBeLessThanOrEqual(viewport);
    const rightEdge = async () => {
      const box = await playPage.card("Shortbow").boundingBox();
      return (box?.x ?? 0) + (box?.width ?? 0);
    };
    expect(await rightEdge()).toBeGreaterThan(viewport);

    await playPage.zoom("Dagger").hover();
    await page.mouse.wheel(1000, 0);
    await expect.poll(rightEdge).toBeLessThanOrEqual(viewport);
    await expect.soft(playPage.name("Brünhilde")).toBeInViewport();
  });

  test("tapping a card lifts it to fit the phone and puts it back", async ({ playPage }) => {
    await playPage.zoom("Longsword").click();
    // Fractional CSS pixels can make a fully visible card's intersection ratio slightly below 1.
    await expect(playPage.spotlight.getByRole("article", { name: "Longsword" })).toBeInViewport({
      ratio: 0.999,
    });

    await playPage.putBack.click();
    await expect(playPage.spotlight).toHaveCount(0);
    await expect.soft(playPage.zoom("Longsword")).toBeFocused();
  });

  test("the back arrow leads home", async ({ page, homePage, playPage }) => {
    await playPage.back.click();

    await expect(page).toHaveURL(/#\/$/);
    await expect.soft(homePage.continueAs("Brünhilde")).toBeVisible();
  });

  test("the menu drops open over the table and leads to the editor", async ({ page, playPage }) => {
    const edit = playPage.menu.getByRole("link", { name: "Edit" });
    await expect(edit).toBeHidden();

    await playPage.menuButton.click();
    await expect.soft(playPage.menu.getByRole("link", { name: "Card catalog" })).toBeVisible();
    await edit.click();

    await expect.soft(page).toHaveURL(/#\/character\/[\w-]+\/edit$/);
  });

  [390, 360, 320].forEach((width) => {
    test(`at ${width}px the menu drops below its button`, async ({ page, playPage }) => {
      await page.setViewportSize({ width, height: 800 });
      await playPage.menuButton.click();
      await expect(playPage.menu).toBeVisible();

      const button = await playPage.menuButton.boundingBox();
      const menu = await playPage.menu.boundingBox();
      expect(menu?.y).toBeGreaterThanOrEqual((button?.y ?? 0) + (button?.height ?? 0));
      await expect.soft(playPage.menu).toBeInViewport();
    });
  });

  test("print ignores the phone zoom and the play chrome", async ({ page, playPage }) => {
    await page.emulateMedia({ media: "print" });

    await expect.soft(playPage.name("Brünhilde")).toBeHidden();
    const portrait = await playPage.card("Longsword").boundingBox();
    const landscape = await playPage.card("Fighting Style").boundingBox();
    expect.soft(portrait?.width).toBeCloseTo(CARD.width, 0);
    expect.soft(landscape?.width).toBeCloseTo(CARD.landscape, 0);
  });
});
