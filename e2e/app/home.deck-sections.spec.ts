import { expect, test } from "../integration/fixtures/test.extend";
import { globalSetup } from "../integration/global.setup";

globalSetup();

test.describe("home: deck sections", () => {
  test("groups the wizard deck into resources, features, then spells by level", async ({
    homePage,
  }) => {
    await homePage.goto("wizard");

    expect(await homePage.sectionTitles.allTextContents()).toEqual([
      "Resources",
      "Class Features",
      "Cantrips",
      "Level 1",
    ]);
  });

  test("renders a card for every kind the deck holds", async ({ homePage }) => {
    await homePage.goto("ranger"); // the one class whose deck has all four card kinds

    for (const label of ["Resources", "Class Features", "Level 1", "Weapon Masteries"]) {
      await expect.soft(homePage.section(label).getByRole("article").first()).toBeVisible();
    }
  });
});
