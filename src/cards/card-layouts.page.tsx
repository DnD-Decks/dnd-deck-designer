import { CardZoom } from "src/cards/card-zoom.component";
import { DeckCardFace } from "src/cards/deck-card.component";
import { useCardSpotlight } from "src/cards/use-card-spotlight.hook";
import type { DeckCard } from "src/decks/deck.model";
import { cardKey, cardName } from "src/decks/deck.model";
import { classActions } from "src/models/class-actions/class-actions.model";
import type { CharacterClass } from "src/models/class/classes.model";
import { feats } from "src/models/feats/feats.model";
import type { WeaponId } from "src/models/gear/weapons.model";
import { weapons } from "src/models/gear/weapons.model";
import { resources } from "src/models/resources/resources.model";
import type { RestType } from "src/models/rest/rest-actions.model";
import { spells } from "src/models/spells/spells.model";
import styles from "./card-layouts.module.css";

type Specimen = { why: string; card: DeckCard };

const spell = ({ id, why }: { id: string; why: string }): Specimen => ({
  why,
  card: { kind: "spell", spell: spells.get({ id }) },
});

const weapon = ({ id, why }: { id: WeaponId; why: string }): Specimen => ({
  why,
  card: { kind: "weapon", weapon: weapons.get({ id }) },
});

type ResourcePick = { id: string; recharge: RestType; why: string };

const resource = ({ id, recharge, why }: ResourcePick): Specimen => ({
  why,
  card: { kind: "resource", resource: resources.get({ id }), recharge },
});

const action = ({ id, why }: { id: string; why: string }): Specimen => ({
  why,
  card: { kind: "action", action: classActions.get({ id }) },
});

// feats are only listed per class, so pick by id from the class list
const feat = ({ cls, id, why }: { cls: CharacterClass; id: string; why: string }) =>
  feats
    .findAll({ cls })
    .filter((f) => f.id === id)
    .map((f): Specimen => ({ why, card: { kind: "feat", feat: f } }));

// dev-only workbench: the edge cases a layout change must survive, side by side,
// all picked from cards that have art in public/art/ so the panels sit over a real painting.
// Built on render, not at import: a top-level call would keep this page in the production bundle.
const sections = () => [
  {
    title: "Spells",
    specimens: [
      spell({ id: "fire-bolt", why: "baseline: cantrip, damage" }),
      spell({ id: "vicious-mockery", why: "cantrip, save + damage" }),
      spell({ id: "chromatic-orb", why: "level 1, damage" }),
      spell({ id: "color-spray", why: "level 1, save" }),
      spell({ id: "fog-cloud", why: "concentration" }),
      spell({ id: "longstrider", why: "shortest text" }),
      spell({ id: "prestidigitation", why: "long text" }),
      spell({ id: "minor-illusion", why: "longest text" }),
    ],
  },
  {
    title: "Spells without art",
    specimens: [
      spell({ id: "find-familiar", why: "ritual, 1 hour" }),
      spell({ id: "mending", why: "cantrip, 1 minute, no ritual" }),
      spell({ id: "shillelagh", why: "bonus action, formula, 2 types" }),
      spell({ id: "ice-knife", why: "mixed dice" }),
      spell({ id: "delayed-blast-fireball", why: "level 7, long name, 12d6" }),
      spell({ id: "tashas-hideous-laughter", why: "longest-ish name" }),
    ],
  },
  {
    title: "Weapons",
    specimens: [
      weapon({ id: "greatsword", why: "melee" }),
      weapon({ id: "longbow", why: "ranged" }),
    ],
  },
  {
    title: "Resources",
    specimens: [
      resource({
        id: "fighter-second-wind",
        recharge: "short-rest",
        why: "the copy a short rest brings back",
      }),
      resource({ id: "fighter-second-wind", recharge: "long-rest", why: "its long-rest twin" }),
      resource({ id: "bard-bardic-inspiration", recharge: "long-rest", why: "long rest only" }),
      resource({ id: "wizard-mana", recharge: "long-rest", why: "mana" }),
      resource({ id: "warlock-mana", recharge: "short-rest", why: "pact mana" }),
    ],
  },
  {
    title: "Class Actions",
    specimens: [
      action({ id: "fighter-second-wind", why: "spends 1 Second Wind" }),
      action({ id: "bard-bardic-inspiration", why: "spends 1 Bardic Inspiration" }),
      action({ id: "paladin-lay-on-hands", why: "spends ×X: longest text" }),
    ],
  },
  {
    title: "Feats",
    specimens: [
      ...feat({ cls: "rogue", id: "rogue-sneak-attack", why: "class feature" }),
      ...feat({ cls: "fighter", id: "fighter-fighting-style", why: "class feature" }),
    ],
  },
];

export function CardLayoutsPage() {
  const shown = sections();
  const entries = shown.flatMap(({ specimens }) =>
    specimens.map(({ card }) => ({ key: cardKey(card), card }))
  );
  const { zoom, spotlight } = useCardSpotlight({ entries });

  return (
    <main className={styles.page}>
      {shown.map(({ title, specimens }) => (
        <section key={title} className={styles.section} aria-label={title}>
          <h2 className={styles.title}>{title}</h2>
          <div className={styles.row}>
            {specimens.map(({ why, card }) => (
              <figure key={cardKey(card)} className={styles.specimen}>
                <div className={styles.slot}>
                  <DeckCardFace card={card} />
                  <CardZoom name={cardName(card)} zoom={zoom(cardKey(card))} />
                </div>
                <figcaption className={styles.why}>{why}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}
      {spotlight}
    </main>
  );
}
