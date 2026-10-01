import type { Page } from "@playwright/test";

export async function openFighterWeapons(page: Page) {
  await page.goto("/#/new");
  await page.getByRole("button", { name: /^Fighter/ }).click();
  await page.getByRole("button", { name: "Next" }).click();
}

export async function selectFighterWeapons(page: Page) {
  await page.getByRole("checkbox", { name: "Longsword", exact: true }).check();
  await page.getByRole("checkbox", { name: "Shortbow", exact: true }).check();
  await page.getByRole("checkbox", { name: "Dagger", exact: true }).check();
}

export async function buildPhoneFighter(page: Page) {
  await openFighterWeapons(page);
  await selectFighterWeapons(page);
  await page.getByRole("textbox", { name: "Character name" }).fill("  Phone Fighter  ");
  await page.getByRole("button", { name: "Build deck" }).click();
}
