// Runtime imports are relative with .ts extension so node:test can resolve them
// (the src/* alias only exists for tsc and vite).
import { assertNever } from "../lib/assert-never.ts";

import type { DeckCard, DeckEntry } from "src/decks/deck.model";
import type { RestType } from "src/models/rest/rest-actions.model";

type Rest = { entries: readonly DeckEntry[]; spent: readonly string[]; rest: RestType };

export const REST_LABELS: Record<RestType, string> = {
  "short-rest": "Short rest",
  "long-rest": "Long rest",
};

function joinWithAnd(names: readonly string[]) {
  const last = names[names.length - 1];
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${last}` : (last ?? "");
}

const resourceCardOf = (entry: DeckEntry) =>
  entry.card.kind === "resource" ? entry.card : undefined;

// a long rest brings every copy back; a short rest only the copies printed with it
const comesBack = ({ entry, rest }: { entry: DeckEntry; rest: RestType }) => {
  const card = resourceCardOf(entry);
  return card !== undefined && (rest === "long-rest" || card.recharge === rest);
};

const namesOf = (entries: readonly DeckEntry[]) => [
  ...new Set(entries.flatMap((entry) => resourceCardOf(entry)?.resource.name ?? [])),
];

const SECTIONS = ["Resources", "Actions", "Weapons", "Features", "Cantrips", "Spells"] as const;

function sectionOf(card: DeckCard) {
  switch (card.kind) {
    case "resource":
      return "Resources";
    case "action":
      return "Actions";
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
    return entries.filter((entry) => spentKeys.has(entry.key) && comesBack({ entry, rest }));
  },

  /** names of every resource a rest can bring back, spent or not */
  restores({ entries, rest }: Omit<Rest, "spent">) {
    return namesOf(entries.filter((entry) => comesBack({ entry, rest })));
  },

  names: namesOf,

  /** what a rest would bring back, as a button hint */
  restHint({ entries, rest }: Omit<Rest, "spent">) {
    if (rest === "long-rest") return "Everything";
    return joinWithAnd(play.restores({ entries, rest })) || "Nothing";
  },

  restStatus({ rest, recovered }: { rest: RestType; recovered: readonly DeckEntry[] }) {
    return `${REST_LABELS[rest]}: ${joinWithAnd(play.names(recovered))} recovered`;
  },
};
