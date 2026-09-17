import { expect, test } from "../integration/fixtures/test.extend";
import { globalSetup } from "../integration/global.setup";

globalSetup();

test.describe("home: spell card", () => {
  test("a cantrip shows its name, type line and cost icons", async ({ homePage }) => {
    await homePage.goto("wizard");
    const fireBolt = homePage.card("Fire Bolt");
    await expect(fireBolt).toBeVisible(); // precondition for everything below

    await expect.soft(fireBolt.getByRole("heading", { level: 3 })).toHaveText("Fire Bolt");
    await expect.soft(fireBolt).toContainText("Evocation · Cantrip");
    await expect.soft(fireBolt.getByRole("img", { name: "Mana" })).toBeVisible();
    await expect.soft(fireBolt.getByRole("img", { name: "1 action" })).toBeVisible();
  });

  test("ritual and concentration icons show only on the spells that carry them", async ({
    homePage,
  }) => {
    await homePage.goto("wizard");

    await expect.soft(homePage.card("Alarm").getByRole("img", { name: "Ritual" })).toBeVisible();
    await expect
      .soft(homePage.card("Witch Bolt").getByRole("img", { name: "Concentration" }))
      .toBeVisible();
    await expect
      .soft(homePage.card("Fire Bolt").getByRole("img", { name: /ritual|concentration/i }))
      .toHaveCount(0);
  });

  test("a level-1 card keeps its printed layout", async ({ homePage }) => {
    await homePage.goto("wizard");
    const magicMissile = homePage.card("Magic Missile");
    await expect(magicMissile).toBeVisible();

    // Layout IS the feature here: the card is printed at 63.5 × 88.9 mm.
    // Baselines are generated in Docker — see e2e/README.md.
    await expect(magicMissile).toHaveScreenshot("spell-card-magic-missile.png", {
      maxDiffPixelRatio: 0.01,
    });
  });
});
