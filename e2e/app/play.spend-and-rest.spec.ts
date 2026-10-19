import { fighter } from "../integration/fixtures/builds.fixture";
import { expect, test } from "../integration/fixtures/test.extend";
import { globalSetup } from "../integration/global.setup";

globalSetup();

test.describe("play: spend and rest", () => {
  test.beforeEach(async ({ playPage }) => {
    await playPage.open(fighter);
    // these cases exercise the mat — the play view opens on the carousel
    await playPage.showGrid();
  });

  test("Spend sits beside Put it back, outside the card, for resources only", async ({
    playPage,
  }) => {
    await playPage.zoom("Second Wind (Short Rest)").click();
    await expect(playPage.spend).toBeVisible();
    const card = await playPage.spotlight.getByRole("article").boundingBox();
    const spend = await playPage.spend.boundingBox();
    expect.soft(spend?.y).toBeGreaterThanOrEqual((card?.y ?? 0) + (card?.height ?? 0));

    await playPage.putBack.click();
    await playPage.zoom("Longsword").click();
    await expect.soft(playPage.spend).toHaveCount(0);
  });

  test("a spent card turns a quarter and widens its slot so it clears its neighbour", async ({
    playPage,
  }) => {
    await playPage.spendOne("Second Wind (Short Rest)");

    const turned = await playPage.spent("Second Wind (Short Rest)").boundingBox();
    const upright = await playPage.zoom("Second Wind (Long Rest)").boundingBox();
    expect.soft(turned?.width).toBeGreaterThan(upright?.width ?? 0);
    expect.soft((turned?.x ?? 0) + (turned?.width ?? 0)).toBeLessThanOrEqual(upright?.x ?? 0);
  });
});
