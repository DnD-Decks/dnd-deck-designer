const MAX_DICE = 6;
const DICE_TERM = /(\d+)d(\d+)/g;

type DiceTerm = { count: number; size: string };

export const diceTerms = (dice: string): DiceTerm[] =>
  [...dice.matchAll(DICE_TERM)].map((match) => ({ count: Number(match[1]), size: match[2] }));

// every term keeps one die; the room left up to six goes to the terms in order
function shownCounts(terms: DiceTerm[]) {
  let room = MAX_DICE - terms.length;
  const counts: number[] = [];
  for (const { count } of terms) {
    const extra = Math.max(0, Math.min(count - 1, room));
    room -= extra;
    counts.push(1 + extra);
  }
  return counts;
}

const repeat = ({ size, times }: { size: string; times: number }) =>
  Array.from({ length: times }, () => size);

export function dicePile(dice: string) {
  const terms = diceTerms(dice);
  const counts = shownCounts(terms);
  return terms.flatMap(({ size }, i) => repeat({ size, times: counts[i] })).slice(0, MAX_DICE);
}

export function diceTower<T>(pile: readonly T[]) {
  if (pile.length <= 2) return [pile];
  const top = Math.floor(pile.length / 2);
  return [pile.slice(0, top), pile.slice(top)];
}
