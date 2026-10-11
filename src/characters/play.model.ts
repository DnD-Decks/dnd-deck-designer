// Runtime imports are relative with .ts extension so node:test can resolve them
// (the src/* alias only exists for tsc and vite).
import { assertNever } from "../lib/assert-never.ts";

import type { DeckCard, DeckEntry } from "src/decks/deck.model";
import type { Resource } from "src/models/resources/resources.model";
import type { RestType } from "src/models/rest/rest-actions.model";

type Rest = { entries: readonly DeckEntry[]; spent: readonly string[]; rest: RestType };

const resourceOf = (entry: DeckEntry) =>
  entry.card.kind === "resource" ? entry.card.resource : undefined;

// Second Wind brings back one use on a short rest, Warlock mana all of them, wizard mana none
function shortRestUses(resource: Resource) {
  if (resource.shortRest !== undefined) return resource.shortRest;
  return resource.recharge === "short-rest" ? resource.uses : 0;
}

function restoredUses({ resource, rest }: { resource: Resource; rest: RestType }) {
  return rest === "long-rest" ? resource.uses : shortRestUses(resource);
}

const resourcesOf = (entries: readonly DeckEntry[]) =>
  entries.flatMap((entry) => resourceOf(entry) ?? []);

const namesOf = (resources: readonly Resource[]) => [
  ...new Set(resources.map((resource) => resource.name)),
];

// the fixed sections of the play table
const SECTIONS = ["Resources", "Weapons", "Features", "Cantrips", "Spells"] as const;

function sectionOf(card: DeckCard) {
  switch (card.kind) {
    case "resource":
      return "Resources";
    case "weapon":
      return "Weapons";
    case "feat":
      return "Features";
    case "spell":
      return card.spell.level === 0 ? "Cantrips" : "Spells";
    default:
      return assertNever(card);
  }
}

/** Play at the table: which cards can be spent and what each rest brings back. */
export const play = {
  sectionOf,

  /** the deck grouped into the table's fixed sections, empty ones dropped */
  sections(entries: readonly DeckEntry[]) {
    return SECTIONS.map((label) => ({
      label,
      entries: entries.filter(({ card }) => sectionOf(card) === label),
    })).filter((section) => section.entries.length > 0);
  },

  spendable(entry: DeckEntry) {
    return entry.card.kind === "resource";
  },

  /** the spent entries a rest brings back, in deck order */
  recovered({ entries, spent, rest }: Rest) {
    const spentKeys = new Set(spent);
    const budgets = new Map<string, number>();
    return entries.filter((entry) => {
      const resource = resourceOf(entry);
      if (!resource || !spentKeys.has(entry.key)) return false;
      const budget = budgets.get(resource.id) ?? restoredUses({ resource, rest });
      budgets.set(resource.id, budget - 1);
      return budget > 0;
    });
  },

  /** names of every resource a rest can bring back, spent or not */
  restores({ entries, rest }: Omit<Rest, "spent">) {
    return namesOf(resourcesOf(entries).filter((resource) => restoredUses({ resource, rest }) > 0));
  },

  names(entries: readonly DeckEntry[]) {
    return namesOf(resourcesOf(entries));
  },
};
