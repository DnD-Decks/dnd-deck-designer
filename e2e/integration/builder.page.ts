import type { Page } from "@playwright/test";

export async function openFighterChoices(page: Page) {
  await page.goto("/#/new");
  await page.getByRole("button", { name: "Fighter", exact: true }).click();
  await page.getByRole("button", { name: "Next" }).click();
}

export async function selectFighterWeapons(page: Page) {
  await page.getByRole("checkbox", { name: "Longsword", exact: true }).check();
  await page.getByRole("checkbox", { name: "Shortbow", exact: true }).check();
  await page.getByRole("checkbox", { name: "Dagger", exact: true }).check();
}

export async function savePhoneFighter(page: Page) {
  await openFighterChoices(page);
  await selectFighterWeapons(page);
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("textbox", { name: "Character name (required)" }).fill("  Phone Fighter  ");
  await page.getByRole("button", { name: "Save character" }).click();
}
