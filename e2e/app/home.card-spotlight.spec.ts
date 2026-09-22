import { expect, test } from "../integration/fixtures/test.extend";
import { globalSetup } from "../integration/global.setup";

globalSetup();

test.describe("home: card spotlight", () => {
  test("clicking a card holds it above the blurred mat", async ({ homePage, page }) => {
    await homePage.goto("wizard");
    const onTheMat = await homePage.card("Fire Bolt").boundingBox();
    await homePage.zoom("Fire Bolt").click();

    await expect(homePage.spotlight).toBeVisible();
    const held = homePage.spotlight.getByRole("article", { name: "Fire Bolt", exact: true });

    // the lift is a real CSS transform, which is why this test needs a browser — poll it out
    await expect
      .poll(async () => (await held.boundingBox())?.width ?? 0)
      .toBeGreaterThan((onTheMat?.width ?? 0) * 1.5);
    // the mat is inert while a card is held: no <main> left in the accessibility tree
    await expect.soft(page.getByRole("main")).toHaveCount(0);

    await homePage.dismissSpotlight.click();
    await expect(homePage.spotlight).toBeHidden();
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("the arrows walk the deck, refitting a card of a different shape", async ({
    homePage,
    page,
  }) => {
    await homePage.goto("wizard");
    await homePage.zoom("Acid Splash").click();
    await expect(homePage.spotlight).toBeVisible();

    // the card before the first cantrip is the last class feature — and those are landscape
    await page.keyboard.press("ArrowLeft");
    const feature = homePage.spotlight.getByRole("article", {
      name: "Arcane Recovery",
      exact: true,
    });
    await expect(feature).toBeVisible();

    const viewport = page.viewportSize();
    await expect
      .poll(async () => {
        const box = await feature.boundingBox();
        if (!box || !viewport) return null;
        return {
          landscape: box.width > box.height,
          fits: box.width <= viewport.width && box.height <= viewport.height,
        };
      })
      .toEqual({ landscape: true, fits: true });
  });

  test("Escape puts the card back and returns focus to it", async ({ homePage, page }) => {
    await homePage.goto("wizard");
    await homePage.zoom("Magic Missile").click();
    await expect(homePage.spotlight).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(homePage.spotlight).toBeHidden();
    await expect(homePage.zoom("Magic Missile")).toBeFocused();
  });
});
