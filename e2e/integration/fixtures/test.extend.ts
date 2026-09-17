import { test as base } from "@playwright/test";
import { type HomePage, createHomePage } from "../home.page";
import { type NetworkGuard, createNetworkGuard } from "../network.guard";

type Fixtures = {
  network: NetworkGuard;
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
  homePage: async ({ page }, use) => {
    await use(createHomePage(page));
  },
});

export { expect } from "@playwright/test";
