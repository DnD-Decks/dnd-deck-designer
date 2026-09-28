import { expect, test } from "../integration/fixtures/test.extend";
import { globalSetup } from "../integration/global.setup";

globalSetup();

test.describe("catalog: offline by construction", () => {
  test("every icon the deck references actually loads", async ({ catalogPage }) => {
    await catalogPage.goto("wizard");
    await expect(catalogPage.cards.first()).toBeVisible();

    // icon paths are plain strings in spell-icon.model — a renamed file only breaks in a browser
    await expect
      .poll(() =>
        catalogPage.images.evaluateAll((images) =>
          images
            .filter((image) => !(image as HTMLImageElement).naturalWidth)
            .map((image) => image.getAttribute("src"))
        )
      )
      .toEqual([]);
  });

  test("nothing the deck renders leaves the app origin", async ({ page, network, catalogPage }) => {
    const foreign: string[] = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.protocol.startsWith("http") && url.origin !== network.appOrigin) {
        foreign.push(request.url());
      }
    });

    await catalogPage.goto("wizard");
    await expect(catalogPage.card("Fire Bolt")).toBeVisible();

    expect(foreign).toEqual([]);
  });
});
