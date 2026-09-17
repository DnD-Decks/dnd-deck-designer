import { expect, test } from "../integration/fixtures/test.extend";
import { globalSetup } from "../integration/global.setup";

globalSetup();

test.describe("home: deck sections", () => {
  test("lays the wizard deck out as resources, features, then spells by level", async ({
    homePage,
  }) => {
    await homePage.goto("wizard");

    const labels = await homePage.sectionTitles.allTextContents();

    expect.soft(labels).toEqual(["Resources", "Class Features", "Cantrips", "Level 1"]);
    await expect.soft(homePage.card("Mana")).toBeVisible();
    await expect.soft(homePage.card("Arcane Recovery")).toBeVisible();
    await expect.soft(homePage.card("Fire Bolt")).toBeVisible();
    await expect.soft(homePage.card("Magic Missile")).toBeVisible();
  });

  test("each section heading counts the cards it actually renders", async ({ homePage }) => {
    await homePage.goto("wizard");

    for (const label of ["Resources", "Class Features", "Cantrips", "Level 1"]) {
      const section = homePage.section(label);
      expect
        .soft(await homePage.advertisedCount(label), `${label} tally`)
        .toBe(await section.getByRole("article").count());
    }
  });

  test("a martial class gets its weapon masteries instead of spells", async ({ homePage }) => {
    await homePage.goto("fighter");

    await expect.soft(homePage.section("Weapon Masteries")).toBeVisible();
    await expect.soft(homePage.card("Cleave")).toBeVisible();
    await expect.soft(homePage.section("Cantrips")).toBeHidden();
  });
});
