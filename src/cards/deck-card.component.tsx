import { FeatCard } from "src/cards/feat-card.component";
import { ResourceCard } from "src/cards/resource-card.component";
import { SpellCard } from "src/cards/spell-card.component";
import { WeaponCard } from "src/cards/weapon-card.component";
import type { DeckCard } from "src/decks/deck.model";
import { assertNever } from "src/lib/assert-never";

export function DeckCardFace({ card }: { card: DeckCard }) {
  switch (card.kind) {
    case "resource":
      return <ResourceCard resource={card.resource} />;
    case "feat":
      return <FeatCard feat={card.feat} />;
    case "spell":
      return <SpellCard spell={card.spell} />;
    case "weapon":
      return <WeaponCard weapon={card.weapon} />;
    default:
      return assertNever(card);
  }
}
