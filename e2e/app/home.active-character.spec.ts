import { fighter, wizard } from "../integration/fixtures/builds.fixture";
import { expect, test } from "../integration/fixtures/test.extend";
import { globalSetup } from "../integration/global.setup";

globalSetup();

test.describe("home: active character", () => {
  test("the character you played last waits on top, the rest below", async ({
    homePage,
    playPage,
  }) => {
    await playPage.open(fighter);
    await playPage.open(wizard);
    await homePage.goto();

    await expect(homePage.continueAs("Elminster")).toBeVisible();
    await expect.soft(homePage.othersHeading).toBeVisible();
    await expect.soft(homePage.listed("Brünhilde")).toBeVisible();
    await expect.soft(homePage.listed("Elminster")).toHaveCount(0);
  });

  test("Continue opens the table, and the one opened there becomes the next to continue", async ({
    page,
    homePage,
    playPage,
  }) => {
    await playPage.open(fighter);
    await playPage.open(wizard);
    await homePage.goto();

    await homePage.listed("Brünhilde").click();
    await expect(playPage.name("Brünhilde")).toBeVisible();
    await homePage.goto();
    await homePage.continueAs("Brünhilde").click();

    await expect.soft(page).toHaveURL(/#\/character\/[\w-]+$/);
    await expect.soft(playPage.name("Brünhilde")).toBeVisible();
  });

  test("the continue card fits the phone", async ({ page, homePage, playPage }) => {
    await playPage.open(fighter);
    await homePage.goto();

    const viewport = page.viewportSize()?.width ?? 0;
    const hero = await homePage.continueAs("Brünhilde").boundingBox();
    expect.soft((hero?.x ?? 0) + (hero?.width ?? 0)).toBeLessThanOrEqual(viewport);
    await expect.soft(homePage.continueAs("Brünhilde")).toBeInViewport();
    await expect.soft(homePage.newCharacter).toBeInViewport();
  });
});
