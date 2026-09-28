import { expect, test } from "../integration/fixtures/test.extend";
import { globalSetup } from "../integration/global.setup";

globalSetup();

test.describe("catalog: deck sections", () => {
  test("groups the wizard deck into resources, features, spells by level, then weapons", async ({
    catalogPage,
  }) => {
    await catalogPage.goto("wizard");

    expect(await catalogPage.sectionTitles.allTextContents()).toEqual([
      "Resources",
      "Class Features",
      "Cantrips",
      "Level 1",
      "Weapons",
    ]);
  });

  test("renders a card for every kind the deck holds", async ({ catalogPage }) => {
    await catalogPage.goto("ranger"); // the one class whose deck has all four card kinds

    for (const label of ["Resources", "Class Features", "Level 1", "Weapons"]) {
      await expect.soft(catalogPage.section(label).getByRole("article").first()).toBeVisible();
    }
  });
});
