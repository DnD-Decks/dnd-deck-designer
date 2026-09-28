import { expect, test } from "../integration/fixtures/test.extend";
import { globalSetup } from "../integration/global.setup";

globalSetup();

test.describe("catalog: card spotlight", () => {
  test("clicking a card holds it above the blurred mat", async ({ catalogPage, page }) => {
    await catalogPage.goto("wizard");
    const onTheMat = await catalogPage.card("Fire Bolt").boundingBox();
    await catalogPage.zoom("Fire Bolt").click();

    await expect(catalogPage.spotlight).toBeVisible();
    const held = catalogPage.spotlight.getByRole("article", { name: "Fire Bolt", exact: true });

    // the lift is a real CSS transform, which is why this test needs a browser — poll it out
    await expect
      .poll(async () => (await held.boundingBox())?.width ?? 0)
      .toBeGreaterThan((onTheMat?.width ?? 0) * 1.5);
    // the mat is inert while a card is held: no <main> left in the accessibility tree
    await expect.soft(page.getByRole("main")).toHaveCount(0);

    await catalogPage.dismissSpotlight.click();
    await expect(catalogPage.spotlight).toBeHidden();
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("the arrows walk the deck, refitting a card of a different shape", async ({
    catalogPage,
    page,
  }) => {
    await catalogPage.goto("wizard");
    await catalogPage.zoom("Acid Splash").click();
    await expect(catalogPage.spotlight).toBeVisible();

    // the card before the first cantrip is the last class feature — and those are landscape
    await page.keyboard.press("ArrowLeft");
    const feature = catalogPage.spotlight.getByRole("article", {
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

  test("Escape puts the card back and returns focus to it", async ({ catalogPage, page }) => {
    await catalogPage.goto("wizard");
    await catalogPage.zoom("Magic Missile").click();
    await expect(catalogPage.spotlight).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(catalogPage.spotlight).toBeHidden();
    await expect(catalogPage.zoom("Magic Missile")).toBeFocused();
  });
});
