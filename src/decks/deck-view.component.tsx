import { useState } from "react";
import { CardCarousel } from "src/cards/card-carousel.component";
import { CardZoom } from "src/cards/card-zoom.component";
import { DeckCardFace } from "src/cards/deck-card.component";
import type { Zoom } from "src/cards/use-card-spotlight.hook";
import { useCardSpotlight } from "src/cards/use-card-spotlight.hook";
import { useDeckLayout } from "src/cards/use-deck-layout.hook";
import { ViewModeToggle } from "src/cards/view-mode-toggle.component";
import type { DeckCard } from "src/decks/deck.model";
import { cardName, catalogEntry, decks } from "src/decks/deck.model";
import type { CharacterClass } from "src/models/class/classes.model";
import styles from "./deck-view.module.css";

type Props = { cls: CharacterClass };

type CatalogEntry = ReturnType<typeof catalogEntry>;

function sections(entries: readonly CatalogEntry[]) {
  const bySection = new Map<string, CatalogEntry[]>();
  for (const entry of entries) {
    const section = bySection.get(entry.section) ?? [];
    section.push(entry);
    bySection.set(entry.section, section);
  }
  return [...bySection.entries()];
}

function CardSlot({ card, zoom }: { card: DeckCard; zoom: Zoom }) {
  return (
    <div className={styles.slot}>
      <DeckCardFace card={card} />
      <CardZoom name={cardName(card)} className={styles.zoom} zoom={zoom} />
    </div>
  );
}

type SectionProps = {
  label: string;
  entries: readonly CatalogEntry[];
  zoom: (key: string) => Zoom;
};

function DeckSection({ label, entries, zoom }: SectionProps) {
  return (
    <section className={styles.section} aria-label={label}>
      {/* tally outside the h2: the heading should read "Level 1", not "Level 123 cards" */}
      <header className={styles.sectionTitle}>
        <h2 className={styles.sectionLabel}>{label}</h2>
        <span className={styles.count}>
          {entries.length} card{entries.length === 1 ? "" : "s"}
        </span>
      </header>
      <div className={styles.cardRow}>
        {entries.map(({ key, card }) => (
          <CardSlot key={key} card={card} zoom={zoom(key)} />
        ))}
      </div>
    </section>
  );
}

function EmptyDeck({ cls, label }: { cls: CharacterClass; label: string }) {
  return (
    <main className={styles.deck} data-class={cls}>
      <div className={styles.emptySlot}>
        <p className={styles.emptyState}>No cards vendored for {label} yet.</p>
      </div>
    </main>
  );
}

export function DeckView({ cls }: Props) {
  const deck = decks.get({ cls });
  const entries = deck.cards.map(catalogEntry);
  const grouped = sections(entries);
  // flattened from the rendered groups, so arrow order is the order you see
  const ordered = grouped.flatMap(([, section]) => section);
  const { holding, zoom, release, spotlight } = useCardSpotlight({ entries: ordered });
  const { mode, choose, carousel } = useDeckLayout();

  // the deck can change under a held card (browser back through the class hash)
  const [heldClass, setHeldClass] = useState(cls);
  if (heldClass !== cls) {
    setHeldClass(cls);
    release();
  }

  if (deck.cards.length === 0) return <EmptyDeck cls={cls} label={deck.cls.label} />;

  return (
    <>
      <ViewModeToggle mode={mode} choose={choose} />

      <main
        className={styles.deck}
        data-class={cls}
        inert={holding}
        aria-hidden={holding || undefined}
      >
        {carousel && <CardCarousel key={cls} label={`${deck.cls.label} cards`} entries={entries} />}
        {!carousel &&
          grouped.map(([label, section]) => (
            <DeckSection key={label} label={label} entries={section} zoom={zoom} />
          ))}
      </main>

      {spotlight}
    </>
  );
}
