import { expect, test } from "../integration/fixtures/test.extend";
import { globalSetup } from "../integration/global.setup";

globalSetup();

test.describe("home: card layout", () => {
  test("a spell card keeps its printed layout", async ({ homePage }) => {
    await homePage.goto("wizard");
    const magicMissile = homePage.card("Magic Missile");
    await expect(magicMissile).toBeVisible();

    // cards print at 63.5 × 88.9 mm — baselines are Docker-made, see e2e/README.md
    await expect(magicMissile).toHaveScreenshot("spell-card-magic-missile.png", {
      maxDiffPixelRatio: 0.01,
    });
  });
});
