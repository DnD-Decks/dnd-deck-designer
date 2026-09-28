import { test as base } from "@playwright/test";
import { type CatalogPage, createCatalogPage } from "../catalog.page";
import { type HomePage, createHomePage } from "../home.page";
import { type NetworkGuard, createNetworkGuard } from "../network.guard";

type Fixtures = {
  network: NetworkGuard;
  catalogPage: CatalogPage;
  homePage: HomePage;
};

export const test = base.extend<Fixtures>({
  // auto: no spec can forget to arm the guard
  network: [
    async ({ page, baseURL }, use) => {
      const guard = await createNetworkGuard({
        page,
        baseURL: baseURL ?? "http://localhost:5173",
      });
      await use(guard);
    },
    { auto: true },
  ],
  catalogPage: async ({ page }, use) => {
    await use(createCatalogPage(page));
  },
  homePage: async ({ page }, use) => {
    await use(createHomePage(page));
  },
});

export { expect } from "@playwright/test";
