import { expect, test } from "../integration/fixtures/test.extend";
import { globalSetup } from "../integration/global.setup";

globalSetup();

test.describe("home: class selector", () => {
  test("offers the twelve PHB classes", async ({ homePage }) => {
    await homePage.goto();

    await expect(homePage.classButtons).toHaveCount(12);

    await expect.soft(homePage.classButton("Barbarian")).toBeVisible();
    await expect.soft(homePage.classButton("Wizard")).toBeVisible();
    // The button carries its own summary line beside the label.
    await expect.soft(homePage.classButton("Wizard")).toContainText("spell-caster");
    await expect.soft(homePage.classButton("Wizard")).toContainText("d6");
  });

  test("marks the current class as pressed and no other", async ({ homePage }) => {
    await homePage.goto();

    await expect.soft(homePage.classButton("Wizard")).toHaveAttribute("aria-pressed", "true");
    await expect.soft(homePage.classButton("Fighter")).toHaveAttribute("aria-pressed", "false");

    await homePage.selectClass("Fighter");

    await expect.soft(homePage.classButton("Fighter")).toHaveAttribute("aria-pressed", "true");
    await expect.soft(homePage.classButton("Wizard")).toHaveAttribute("aria-pressed", "false");
  });

  test("picking a class swaps the deck and the URL hash", async ({ page, homePage }) => {
    await homePage.goto();
    await expect(homePage.card("Arcane Recovery")).toBeVisible(); // precondition: wizard deck

    await homePage.selectClass("Fighter");

    await expect.soft(page).toHaveURL(/#fighter$/);
    await expect.soft(homePage.card("Second Wind")).toBeVisible();
    await expect.soft(homePage.card("Arcane Recovery")).toBeHidden();
  });
});
