import type { Locator, Page } from "@playwright/test";

// the catalog and the play table render the same deck: a carousel of cards or a
// grid of sections, plus the held-card spotlight — `root` is the page's <main>
export function createDeckLocators({ page, root }: { page: Page; root: Locator }) {
  const gridButton = page.getByRole("button", { name: "Grid" });

  return {
    spotlight: page.getByRole("dialog"),
    putBack: page.getByRole("button", { name: "Put it back" }),
    gridButton,
    position: page.getByText(/· \d+ \/ \d+/),

    // exact: card names overlap as substrings ("Light" is inside "Dancing Lights")
    card(name: string) {
      return root.getByRole("article", { name, exact: true });
    },

    // the control that lifts a card off the mat, one per card
    zoom(name: string) {
      return root.getByRole("button", { name: `Zoom ${name}`, exact: true });
    },

    section(name: string) {
      return root.getByRole("region", { name, exact: true });
    },

    carousel(name: string) {
      return root.getByRole("region", { name });
    },

    // the scrollable strip inside a carousel — the parent of its first slide
    carouselTrack(name: string) {
      return root
        .getByRole("region", { name })
        .getByRole("group", { name: "1 of" })
        .locator("xpath=..");
    },

    // the centred card's tap button, named after the card
    carouselCard(name: string) {
      return root.getByRole("button", { name, exact: true });
    },

    thumb(name: string) {
      return root.getByRole("button", { name: `Go to ${name}`, exact: true });
    },

    // decks open on the carousel; specs that exercise the grid pick it first
    async showGrid() {
      await gridButton.click();
    },
  };
}
