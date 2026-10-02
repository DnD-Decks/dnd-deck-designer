import {
  buildPhoneFighter,
  openFighterWeapons,
  selectFighterWeapons,
} from "../integration/builder.page";
import { expect, test } from "../integration/fixtures/test.extend";
import { globalSetup } from "../integration/global.setup";

globalSetup();

test.describe("builder.card-picking{}", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test("new character fits the phone viewport", async ({ page, homePage }) => {
    await homePage.goto();
    await page.getByRole("link", { name: "New character" }).click();
    await expect(page).toHaveURL(/#\/new$/);
    const bounds = await page.getByRole("main").boundingBox();
    expect.soft(bounds?.x).toBe(16);
    expect.soft(bounds?.width).toBe(328);
  });

  test("tapping a weapon card chooses it, and a full hand locks the rest", async ({ page }) => {
    await openFighterWeapons(page);
    const hand = page.getByRole("group", { name: "Weapon Mastery" });
    await expect(hand.getByRole("article").first()).toBeInViewport();
    // the checkbox covers the card face, so this is a tap on the card
    const firstCard = hand.getByRole("checkbox").first();
    const box = await firstCard.boundingBox();
    await page.mouse.click((box?.x ?? 0) + 40, (box?.y ?? 0) + 40);
    await expect.soft(firstCard).toBeChecked();
    await firstCard.uncheck();
    await selectFighterWeapons(page);
    await expect
      .soft(page.getByRole("checkbox", { name: "Greatsword", exact: true }))
      .toBeDisabled();
    await expect.soft(page.getByRole("button", { name: "Build deck" })).toBeVisible();
  });

  test("zoom fits a locked card on the phone and restores focus", async ({ page }) => {
    await openFighterWeapons(page);
    await selectFighterWeapons(page);
    await page.getByRole("button", { name: "Zoom Greatsword", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Greatsword" });
    // Fractional CSS pixels can make a fully visible card's intersection ratio slightly below 1.
    await expect(dialog.getByRole("article", { name: "Greatsword" })).toBeInViewport({
      ratio: 0.999,
    });
    await page.getByRole("button", { name: "Put it back" }).click();
    await expect(dialog).toHaveCount(0);
    await expect.soft(page.getByRole("button", { name: "Zoom Greatsword" })).toBeFocused();
    await expect
      .soft(page.getByRole("checkbox", { name: "Greatsword", exact: true }))
      .not.toBeChecked();
  });

  test("building a phone fighter navigates to a persistent character", async ({ page }) => {
    await buildPhoneFighter(page);
    await expect(page).toHaveURL(/#\/character\/[\w-]+$/);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Phone Fighter" })).toBeVisible();
  });

  test("editing weapons keeps the character URL and survives reload", async ({ page }) => {
    await buildPhoneFighter(page);
    await expect(page).toHaveURL(/#\/character\/[\w-]+$/);
    const savedURL = page.url();
    await page.getByRole("link", { name: "Edit" }).click();
    await expect(page).toHaveURL(`${savedURL}/edit`);
    await page.getByRole("button", { name: "Next" }).click();
    await expect.soft(page.getByRole("checkbox", { name: "Longsword", exact: true })).toBeChecked();
    await page.getByRole("checkbox", { name: "Longsword", exact: true }).uncheck();
    await page.getByRole("checkbox", { name: "Greatsword", exact: true }).check();
    await page.getByRole("button", { name: "Build deck" }).click();
    await expect(page).toHaveURL(savedURL);
    await page.reload();
    await expect.soft(page.getByRole("article", { name: "Greatsword", exact: true })).toBeVisible();
    await expect.soft(page.getByRole("article", { name: "Longsword", exact: true })).toHaveCount(0);
  });
});
