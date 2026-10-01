import { expect, test } from "../integration/fixtures/test.extend";
import { globalSetup } from "../integration/global.setup";

globalSetup();

test.describe("builder: fighter weapons", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test("build, preview, save and edit on a phone", async ({ page, homePage }) => {
    await homePage.goto();
    await page.getByRole("link", { name: "New character" }).click();
    await expect(page).toHaveURL(/#\/new$/);
    const main = page.getByRole("main");
    const bounds = await main.boundingBox();
    expect.soft(bounds?.x).toBe(16);
    expect.soft(bounds?.width).toBe(328);
    await page.getByRole("button", { name: "Fighter", exact: true }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("checkbox", { name: "Longsword", exact: true }).check();
    await page.getByRole("checkbox", { name: "Shortbow", exact: true }).check();
    await page.getByRole("checkbox", { name: "Dagger", exact: true }).check();
    await expect
      .soft(page.getByRole("checkbox", { name: "Greatsword", exact: true }))
      .toBeDisabled();
    await page.getByRole("button", { name: "Preview Greatsword", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Greatsword" });
    await expect(dialog).toBeVisible();
    const card = dialog.getByRole("article", { name: "Greatsword" });
    await expect(card).toBeInViewport({ ratio: 1 });
    await page.getByRole("button", { name: "Put it back" }).click();
    await expect(dialog).toHaveCount(0);
    await expect.soft(page.getByRole("button", { name: "Preview Greatsword" })).toBeFocused();
    await page.getByRole("button", { name: "Next" }).click();
    await page
      .getByRole("textbox", { name: "Character name (required)" })
      .fill("  Phone Fighter  ");
    await page.getByRole("button", { name: "Save character" }).click();
    await expect(page).toHaveURL(/#\/character\/[\w-]+$/);
    const savedURL = page.url();
    await page.reload();
    await expect(page.getByRole("heading", { name: "Phone Fighter" })).toBeVisible();
    await page.getByRole("link", { name: "Edit" }).click();
    await expect(page).toHaveURL(`${savedURL}/edit`);
    await page.getByRole("button", { name: "Next" }).click();
    await expect.soft(page.getByRole("checkbox", { name: "Longsword", exact: true })).toBeChecked();
    await page.getByRole("checkbox", { name: "Longsword", exact: true }).uncheck();
    await page.getByRole("checkbox", { name: "Greatsword", exact: true }).check();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Save character" }).click();
    await expect(page).toHaveURL(savedURL);
    await page.reload();
    await expect.soft(page.getByRole("article", { name: "Greatsword", exact: true })).toBeVisible();
    await expect.soft(page.getByRole("article", { name: "Longsword", exact: true })).toHaveCount(0);
  });
});
