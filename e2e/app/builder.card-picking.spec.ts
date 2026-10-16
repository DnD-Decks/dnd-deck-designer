import {
  buildPhoneFighter,
  openFighterWeapons,
  selectFighterWeapons,
} from "../integration/builder.page";
import { expect, test } from "../integration/fixtures/test.extend";
import { globalSetup } from "../integration/global.setup";

globalSetup();

test.describe("builder: card picking", () => {
  test("new character fits the phone viewport", async ({ page, homePage }) => {
    await homePage.goto();
    await page.getByRole("link", { name: "New character" }).click();
    await expect(page).toHaveURL(/#\/new$/);
    const bounds = await page.getByRole("main").boundingBox();
    expect.soft(bounds?.x).toBe(16);
    expect.soft(bounds?.width).toBe(358);
  });

  test("tapping a weapon card chooses it, and a full hand locks the rest", async ({ page }) => {
    await openFighterWeapons(page);
    const hand = page.getByRole("group", { name: "Weapon Mastery" });
    await expect(hand.getByRole("article").first()).toBeInViewport();
    // Tap the visible artwork rather than targeting the checkbox directly.
    const firstCard = hand.getByRole("checkbox").first();
    const box = await hand.getByRole("article").first().boundingBox();
    expect(box).not.toBeNull();
    await page.touchscreen.tap((box?.x ?? 0) + (box?.width ?? 0) / 2, (box?.y ?? 0) + 100);
    await expect.soft(firstCard).toBeChecked();
    const selectedBox = await firstCard.boundingBox();
    await page.touchscreen.tap((selectedBox?.x ?? 0) + 40, (selectedBox?.y ?? 0) + 40);
    await expect(firstCard).not.toBeChecked();
    await selectFighterWeapons(page);
    await expect
      .soft(page.getByRole("checkbox", { name: "Greatsword", exact: true }))
      .toBeDisabled();
    await expect.soft(page.getByRole("button", { name: "Build deck" })).toBeVisible();
  });

  test("touch layouts keep an unselected card still when hover is synthesized", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openFighterWeapons(page);
    const card = page.getByRole("group", { name: "Weapon Mastery" }).getByRole("article").first();
    const before = await card.boundingBox();
    expect(before).not.toBeNull();
    await page.mouse.move((before?.x ?? 0) + 100, (before?.y ?? 0) + 100);
    const hovered = await card.boundingBox();
    expect(hovered?.y).toBe(before?.y);
  });

  for (const { cls, name, battleMaster } of [
    { cls: "Wizard", name: "Fire Bolt", battleMaster: false },
    { cls: "Fighter", name: "Ambush", battleMaster: true },
  ]) {
    test(`a touch tap selects and puts back ${name}`, async ({ page }) => {
      await page.goto("/#/new");
      await page.getByRole("button", { name: new RegExp(`^${cls}`) }).click();
      if (battleMaster) {
        await page.getByRole("combobox", { name: "Character level" }).selectOption("3");
        await page.getByRole("combobox", { name: "Subclass" }).selectOption("battle-master");
      }
      await page.getByRole("button", { name: "Next" }).click();
      const card = page.getByRole("article", { name, exact: true });
      const choice = page.getByRole("checkbox", { name, exact: true });
      await choice.scrollIntoViewIfNeeded();
      await expect(card).toBeInViewport();
      for (const checked of [true, false]) {
        const bounds = await card.boundingBox();
        expect(bounds).not.toBeNull();
        await page.touchscreen.tap(
          (bounds?.x ?? 0) + (bounds?.width ?? 0) / 2,
          (bounds?.y ?? 0) + 100
        );
        await expect(choice).toBeChecked({ checked });
      }
    });
  }

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
    await page.getByRole("button", { name: "Menu" }).click();
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
