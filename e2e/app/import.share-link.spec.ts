import { expect, test } from "../integration/fixtures/test.extend";
import { globalSetup } from "../integration/global.setup";

globalSetup();

const fighter = {
  cls: "fighter",
  level: 1,
  name: "Brünhilde",
  picks: { weapons: ["longsword", "shortbow", "dagger"] },
};

test.describe("import: share link", () => {
  test("a share link previews the build and saves it to this device", async ({
    page,
    importPage,
    homePage,
  }) => {
    await importPage.goto(fighter);

    await expect(importPage.heading("Brünhilde")).toBeVisible();
    await expect.soft(importPage.card("Longsword")).toBeVisible();
    await expect.soft(importPage.card("Greatsword")).toHaveCount(0);

    await importPage.save.click();

    await expect.soft(page).toHaveURL(/#\/character\/[\w-]+$/);
    await expect.soft(importPage.share).toBeVisible();

    await homePage.goto();
    await expect.soft(homePage.character("Brünhilde")).toBeVisible();
  });

  test("a broken share link explains itself and leads home", async ({
    page,
    importPage,
    homePage,
  }) => {
    await importPage.goto("not-a-real-code");

    await expect(importPage.heading("This share link doesn't work")).toBeVisible();
    await importPage.backHome.click();

    await expect.soft(page).toHaveURL(/#\/$/);
    await expect.soft(homePage.heading).toBeVisible();
  });
});
