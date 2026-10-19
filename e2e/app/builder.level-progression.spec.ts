import { expect, test } from "../integration/fixtures/test.extend";
import { globalSetup } from "../integration/global.setup";

globalSetup();

test.describe("builder.level-progression{}", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test("level-three wizard survives reload and share import with second-level spells", async ({
    page,
    playPage,
  }) => {
    await page.goto("/#/new");
    await page.getByRole("combobox", { name: "Character level" }).selectOption("3");
    await page.getByRole("button", { name: /^Wizard/ }).click();
    await expect.soft(page.getByText(/Includes Evoker/)).toBeVisible();
    await page.getByRole("button", { name: "Next" }).click();
    for (const name of [
      "Fire Bolt",
      "Light",
      "Mage Hand",
      "Shield",
      "Magic Missile",
      "Mage Armor",
      "Detect Magic",
      "Burning Hands",
      "Misty Step",
    ]) {
      await page.getByRole("checkbox", { name, exact: true }).check();
    }
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("textbox", { name: "Character name" }).fill("Level Three Wizard");
    await page.getByRole("button", { name: "Build deck" }).click();
    const savedURL = page.url();
    await page.reload();
    await playPage.showGrid();
    await expect.soft(page.getByText("Level 3 Wizard · Evoker")).toBeVisible();
    await expect.soft(page.getByRole("article", { name: "Misty Step", exact: true })).toBeVisible();
    await expect
      .soft(page.getByRole("article", { name: "Potent Cantrip", exact: true }))
      .toBeVisible();

    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await playPage.menuButton.click();
    await page.getByRole("button", { name: "Share", exact: true }).click();
    const linkField = page.getByRole("textbox", { name: "Share link" });
    const shareURL = (await linkField.count())
      ? await linkField.inputValue()
      : await page.evaluate(() => navigator.clipboard.readText());
    // Empty storage proves the URL carries the build independently of the original device.
    await page.evaluate(() => localStorage.clear());
    await page.goto(shareURL);
    await expect.soft(page.getByText("Level 3 Wizard · Evoker")).toBeVisible();
    await page.getByRole("button", { name: "Save to this device" }).click();
    await expect(page).toHaveURL(/#\/character\/[\w-]+$/);
    await expect.soft(page.getByRole("article", { name: "Misty Step", exact: true })).toBeVisible();
    expect.soft(page.url()).not.toBe(savedURL);
  });
});
