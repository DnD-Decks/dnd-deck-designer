import { expect, test } from "../integration/fixtures/test.extend";
import { globalSetup } from "../integration/global.setup";

globalSetup();

test.describe("builder: Battle Master PHB 2024", () => {
  test("chooses maneuvers, spends and recovers dice, and shares the subclass", async ({
    page,
    playPage,
  }) => {
    await page.goto("/#/new");
    await page.getByRole("button", { name: /^Fighter/ }).click();
    await page.getByRole("combobox", { name: "Character level" }).selectOption("3");
    await page.getByRole("combobox", { name: "Subclass" }).selectOption("battle-master");
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByRole("button", { name: "Next" })).toBeDisabled();
    for (const name of ["Precision Attack", "Riposte", "Trip Attack"]) {
      await page.getByRole("checkbox", { name, exact: true }).check();
    }
    await expect(page.getByRole("checkbox", { name: "Parry", exact: true })).toBeDisabled();
    await page.getByRole("button", { name: "Next" }).click();
    for (const name of ["Longsword", "Dagger", "Shortbow"]) {
      await page.getByRole("checkbox", { name, exact: true }).check();
    }
    await page.getByRole("textbox", { name: "Character name" }).fill("Battle Tactician");
    await page.getByRole("button", { name: "Build deck" }).click();
    await page.reload();
    await playPage.showGrid();
    await expect(page.getByText("Level 3 Fighter · Battle Master")).toBeVisible();
    await expect(page.getByRole("article", { name: "Riposte", exact: true })).toBeVisible();
    await expect(page.getByRole("article", { name: "Improved Critical", exact: true })).toHaveCount(
      0
    );
    await expect(page.getByRole("article", { name: "Superiority Die", exact: true })).toHaveCount(
      4
    );
    await playPage.spendOne("Superiority Die");
    await expect(playPage.spent("Superiority Die")).toHaveCount(1);
    await page.getByRole("button", { name: "Short rest", exact: true }).click();
    await expect(playPage.spent("Superiority Die")).toHaveCount(0);

    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await playPage.menuButton.click();
    await page.getByRole("button", { name: "Share", exact: true }).click();
    const linkField = page.getByRole("textbox", { name: "Share link" });
    const shareURL = (await linkField.count())
      ? await linkField.inputValue()
      : await page.evaluate(() => navigator.clipboard.readText());
    await page.evaluate(() => localStorage.clear());
    await page.goto(shareURL);
    await expect(page.getByText("Level 3 Fighter · Battle Master")).toBeVisible();
    await page.getByRole("button", { name: "Save to this device" }).click();
    await playPage.showGrid();
    await expect(
      page.getByRole("article", { name: "Precision Attack", exact: true })
    ).toBeVisible();
    await expect(page.getByRole("article", { name: "Superiority Die", exact: true })).toHaveCount(
      4
    );
  });
});
