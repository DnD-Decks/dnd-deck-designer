import type { Page } from "@playwright/test";

export function createCatalogPage(page: Page) {
  const classSelector = page.getByRole("navigation", { name: "Character class" });
  const deck = page.getByRole("main");
  const gridButton = page.getByRole("button", { name: "Grid" });
  const carouselButton = page.getByRole("button", { name: "Carousel" });

  return {
    title: page.getByRole("heading", { level: 1 }),
    classSelector,
    deck,
    classButtons: classSelector.getByRole("button"),
    sectionTitles: deck.getByRole("heading", { level: 2 }),
    cards: deck.getByRole("article"),
    images: deck.getByRole("img"),
    spotlight: page.getByRole("dialog"),
    dismissSpotlight: page.getByRole("button", { name: "Put it back" }),
    gridButton,
    carouselButton,
    prevCard: page.getByRole("button", { name: "Previous card" }),
    nextCard: page.getByRole("button", { name: "Next card" }),
    position: page.getByText(/· \d+ \/ \d+/),

    classButton(label: string) {
      return classSelector.getByRole("button", { name: label });
    },

    section(name: string) {
      return deck.getByRole("region", { name, exact: true });
    },

    // exact: card names overlap as substrings ("Light" is inside "Dancing Lights")
    card(name: string) {
      return deck.getByRole("article", { name, exact: true });
    },

    carousel(name: string) {
      return deck.getByRole("region", { name });
    },

    // the scrollable strip inside a carousel — the parent of its first slide
    carouselTrack(name: string) {
      return deck
        .getByRole("region", { name })
        .getByRole("group", { name: "1 of" })
        .locator("xpath=..");
    },

    thumb(name: string) {
      return deck.getByRole("button", { name: `Go to ${name}`, exact: true });
    },

    // the control that lifts a card off the mat, one per card
    zoom(name: string) {
      return deck.getByRole("button", { name: `Zoom ${name}` });
    },

    async goto(cls?: string) {
      await page.goto(`/#/catalog${cls ? `/${cls}` : ""}`);
    },

    // the add-cards flow: the catalog carousel in selection mode for a character
    async gotoAdd(id: string, cls?: string) {
      await page.goto(`/#/character/${id}/add${cls ? `/${cls}` : ""}`);
    },

    // the centred card's tap button in selection mode, named after the card
    carouselCard(name: string) {
      return deck.getByRole("button", { name, exact: true });
    },

    confirmAdd(name: string) {
      return page.getByRole("button", { name: `Add to ${name}`, exact: true });
    },

    cancelAdd: page.getByRole("link", { name: "Cancel" }),

    async selectClass(label: string) {
      await classSelector.getByRole("button", { name: label }).click();
    },

    // the catalog opens on the carousel; specs that exercise the grid pick it first
    async showGrid() {
      await gridButton.click();
    },
  };
}

export type CatalogPage = ReturnType<typeof createCatalogPage>;
