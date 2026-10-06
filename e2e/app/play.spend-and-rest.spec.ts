import { fighter } from "../integration/fixtures/builds.fixture";
import { expect, test } from "../integration/fixtures/test.extend";
import { globalSetup } from "../integration/global.setup";

globalSetup();

test.describe("play: spend and rest", () => {
  test.beforeEach(async ({ playPage }) => {
    await playPage.open(fighter);
  });

  test("Spend sits beside Put it back, outside the card, for resources only", async ({
    playPage,
  }) => {
    await playPage.zoom("Second Wind").first().click();
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
    await playPage.spendOne("Second Wind");

    const turned = await playPage.spent("Second Wind").boundingBox();
    const upright = await playPage.zoom("Second Wind").boundingBox();
    expect.soft(turned?.width).toBeGreaterThan(upright?.width ?? 0);
    expect.soft((turned?.x ?? 0) + (turned?.width ?? 0)).toBeLessThanOrEqual(upright?.x ?? 0);
  });

  test("a short rest brings one Second Wind back, a long rest the other", async ({ playPage }) => {
    await expect(playPage.shortRest).toBeDisabled();
    await playPage.spendOne("Second Wind");
    await playPage.spendOne("Second Wind");
    await expect(playPage.spent("Second Wind")).toHaveCount(2);

    await playPage.shortRest.click();
    await expect(playPage.spent("Second Wind")).toHaveCount(1);
    await expect.soft(playPage.restStatus).toHaveText("Short rest: Second Wind recovered");

    await playPage.longRest.click();
    await expect(playPage.spent("Second Wind")).toHaveCount(0);
    await expect.soft(playPage.longRest).toBeDisabled();
  });

  test("Recover in the spotlight unspends the card", async ({ playPage }) => {
    await playPage.spendOne("Second Wind");
    await playPage.spent("Second Wind").click();
    await playPage.recover.click();

    await expect(playPage.spent("Second Wind")).toHaveCount(0);
    await expect.soft(playPage.zoom("Second Wind")).toHaveCount(2);
  });

  test("spent cards stay spent after a reload", async ({ page, playPage }) => {
    await playPage.spendOne("Second Wind");
    await page.reload();

    await expect(playPage.spent("Second Wind")).toHaveCount(1);
  });
});
