import type { Page } from "@playwright/test";

const SAME_PAGE_PROTOCOLS = new Set(["data:", "blob:", "about:"]);

/**
 * The app has no backend, so there is nothing to mock — the guard instead proves it never
 * reaches outside its own origin. A CDN font or an analytics beacon is a regression.
 */
export async function createNetworkGuard({ page, baseURL }: { page: Page; baseURL: string }) {
  const appOrigin = new URL(baseURL).origin;

  // Registered first: Playwright runs handlers in reverse order, so any specific handler added
  // later wins and this one only sees what nothing else claimed.
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.origin === appOrigin || SAME_PAGE_PROTOCOLS.has(url.protocol)) {
      return route.fallback();
    }
    console.warn(`[network-guard] aborted ${route.request().method()} ${url.href}`);
    return route.abort("blockedbyclient");
  });

  return { appOrigin };
}

export type NetworkGuard = Awaited<ReturnType<typeof createNetworkGuard>>;
