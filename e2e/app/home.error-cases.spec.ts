import { expect, test } from "../integration/fixtures/test.extend";
import { globalSetup } from "../integration/global.setup";

globalSetup();

test.describe("home: error cases", () => {
  test("a class with no level-1 resources renders no Resources section", async ({ homePage }) => {
    await homePage.goto("monk");

    await expect.soft(homePage.section("Resources")).toBeHidden();
    await expect.soft(homePage.section("Class Features")).toBeVisible();
    await expect.soft(homePage.card("Martial Arts")).toBeVisible();
  });

  test("a non-caster renders no spell sections", async ({ homePage }) => {
    await homePage.goto("barbarian");

    await expect.soft(homePage.section("Cantrips")).toBeHidden();
    await expect.soft(homePage.section("Level 1")).toBeHidden();
    await expect.soft(homePage.cards.first()).toBeVisible();
  });

  test("nothing the deck renders leaves the app origin", async ({ page, network, homePage }) => {
    const foreign: string[] = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.protocol.startsWith("http") && url.origin !== network.appOrigin) {
        foreign.push(request.url());
      }
    });

    await homePage.goto("wizard");
    await expect(homePage.card("Fire Bolt")).toBeVisible();

    expect(foreign, "requests that escaped the app origin").toEqual([]);
  });
});
