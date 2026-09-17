// Every spec imports { test, expect } from here — never from "@playwright/test" directly.
import { test as base } from "@playwright/test";
import { type HomePage, createHomePage } from "../home.page";
import { type NetworkGuard, createNetworkGuard } from "../network.guard";

type Fixtures = {
  network: NetworkGuard;
  homePage: HomePage;
};

export const test = base.extend<Fixtures>({
  // `auto: true` — the guard is armed in every test, even one that never names `network`.
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
