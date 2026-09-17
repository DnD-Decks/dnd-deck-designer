// The app has no backend: data is bundled JSON and every icon is served from the dev server.
// So there is nothing to mock — instead the guard proves the app never reaches outside its own
// origin. An escaping request is a regression (a CDN font, an analytics beacon, a live API call).
import type { Page } from "@playwright/test";

const SAME_PAGE_PROTOCOLS = new Set(["data:", "blob:", "about:"]);

export async function createNetworkGuard({ page, baseURL }: { page: Page; baseURL: string }) {
  const appOrigin = new URL(baseURL).origin;

  // Registered FIRST on purpose: Playwright runs handlers in reverse registration order, so any
  // specific handler added later wins and this one only sees what nothing else claimed.
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.origin === appOrigin || SAME_PAGE_PROTOCOLS.has(url.protocol)) {
      return route.fallback();
    }
    // A silent abort resurfaces as "element not found" three tests later — say it out loud.
    console.warn(`[network-guard] aborted ${route.request().method()} ${url.href}`);
    return route.abort("blockedbyclient");
  });

  return { appOrigin };
}

export type NetworkGuard = Awaited<ReturnType<typeof createNetworkGuard>>;
