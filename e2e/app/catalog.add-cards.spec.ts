import { fighter } from "../integration/fixtures/builds.fixture";
import { expect, test } from "../integration/fixtures/test.extend";
import { globalSetup } from "../integration/global.setup";

globalSetup();

const characterId = (url: string) => url.split("#/character/")[1] ?? "";

test.describe("catalog: add cards", () => {
  test("cards picked on two classes join the deck, spent state and share link intact", async ({
    context,
    page,
    catalogPage,
    importPage,
    playPage,
  }) => {
    await playPage.open(fighter);
    const id = characterId(page.url());

    // spend a card first: adding cards must not reset the table
    await playPage.cardActions("Second Wind").getByRole("button", { name: "Spend" }).click();
    await expect(playPage.carouselCard("Second Wind, spent")).toBeVisible();

    await playPage.menuButton.click();
    await playPage.menu.getByRole("link", { name: "Add cards" }).click();
    await expect(page).toHaveURL(new RegExp(`#/character/${id}/add/fighter$`));

    // one card on the character's own class, one cross-class
    await catalogPage.thumb("Greataxe").click();
    await catalogPage.carouselCard("Greataxe").click();
    await expect(catalogPage.carouselCard("Greataxe")).toHaveAttribute("aria-pressed", "true");

    await catalogPage.selectClass("Cleric");
    await catalogPage.thumb("Cure Wounds").click();
    await catalogPage.carouselCard("Cure Wounds").click();

    await catalogPage.confirmAdd("Brünhilde (2)").click();
    await expect(page).toHaveURL(new RegExp(`#/character/${id}$`));

    // Back must not reopen the picker — confirm replaced its history entry
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`#/character/${id}$`));

    // both landed in the deck, the spent card is still spent
    const carousel = playPage.carousel("Brünhilde's cards");
    await expect.soft(carousel.getByRole("button", { name: "Go to Greataxe" })).toBeVisible();
    await expect.soft(carousel.getByRole("button", { name: "Go to Cure Wounds" })).toBeVisible();
    await expect.soft(playPage.carouselCard("Second Wind, spent")).toBeVisible();

    // the share link carries the added cards
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await playPage.menuButton.click();
    await playPage.menu.getByRole("button", { name: "Share" }).click();
    const link = await page.evaluate(() => navigator.clipboard.readText());
    const code = link.split("#/import/")[1] ?? "";
    expect(code).not.toBe("");

    await importPage.goto(code);
    await expect(importPage.card("Cure Wounds")).toBeVisible();
    await expect.soft(importPage.card("Greataxe")).toBeVisible();
  });

  test("Cancel returns to the character and keeps the deck untouched", async ({
    page,
    catalogPage,
    playPage,
  }) => {
    await playPage.open(fighter);
    const id = characterId(page.url());

    await catalogPage.gotoAdd({ id });
    await catalogPage.thumb("Greataxe").click();
    await catalogPage.carouselCard("Greataxe").click();
    await catalogPage.cancelAdd.click();

    await expect(page).toHaveURL(new RegExp(`#/character/${id}$`));
    await expect(
      playPage.carousel("Brünhilde's cards").getByRole("button", { name: "Go to Greataxe" })
    ).toHaveCount(0);
  });
});
