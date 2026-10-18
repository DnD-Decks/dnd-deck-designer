import { useId } from "react";
import { Icon } from "src/lib/icon.component";
import {
  CONCENTRATION_ICON,
  DURATION_ICON,
  RITUAL_ICON,
  actionIcon,
  rangeIcon,
} from "src/models/spells/spell-icon.model";
import type { Spell } from "src/models/spells/spells.model";
import { CardArt } from "./card-art.component";
import { CardHeaderDamage } from "./card-header-damage.component";
import { SpellCardStatStrip } from "./spell-card-stat-strip.component";
import styles from "./spell-card.module.css";

const levelLabel = (level: Spell["level"]) => (level === 0 ? "Cantrip" : `Level ${level}`);

function SpellTag({ icon, label }: { icon: string; label: string }) {
  return (
    <span className={styles.tag}>
      <Icon src={icon} label={label} className={styles.tagIcon} />
    </span>
  );
}

type Props = { spell: Spell };

// "1 minute" is "1m", "12 hours" is "12h"
const shortTime = (castingTime: string) => castingTime.replace(/^(\d+) (\w).*$/, "$1$2");

// the action-economy glyph, or for a cast that takes minutes the ritual glyph (rituals)
// or an hourglass with the time; then one mana gem with the spell level (cantrips cost no mana)
function CastingSlot({ spell }: Props) {
  const action = actionIcon(spell.castingTime);
  if (action) return <Icon src={action.src} label={action.label} className={styles.costAction} />;
  if (spell.ritual) {
    return (
      <Icon
        src={RITUAL_ICON}
        label={`Ritual, ${spell.castingTime}`}
        className={styles.costAction}
      />
    );
  }
  return (
    <span className={styles.castTime} role="img" aria-label={spell.castingTime}>
      <Icon
        src={DURATION_ICON}
        label={spell.castingTime}
        className={styles.costAction}
        decorative
      />
      <span aria-hidden="true">{shortTime(spell.castingTime)}</span>
    </span>
  );
}

// the cost reads top-down in the top-left corner, like most card games
function CostRail({ spell }: Props) {
  return (
    <section className={styles.costRail} aria-label="Cost">
      <CastingSlot spell={spell} />
      {spell.level > 0 && (
        <span className={styles.manaGem} role="img" aria-label={`Level ${spell.level} mana`}>
          <span aria-hidden="true">{spell.level}</span>
        </span>
      )}
    </section>
  );
}

export function SpellCard({ spell }: Props) {
  const headingId = useId();

  return (
    <article className={styles.card} aria-labelledby={headingId}>
      <CardArt assetId={spell.id} />

      <div className={styles.titleBar}>
        <h3 id={headingId} className={styles.name}>
          {spell.name}
        </h3>
        {spell.damage && <CardHeaderDamage dice={spell.damage.dice} types={spell.damage.type} />}
      </div>
      <CostRail spell={spell} />

      <div className={styles.artWindow} />

      <div className={styles.typeLine}>
        <span>
          {spell.school} · {levelLabel(spell.level)}
        </span>
        <span className={styles.infoRight}>
          <span className={styles.range}>
            <SpellTag icon={rangeIcon(spell.range)} label="Range" />
            {spell.range}
          </span>
          <span className={styles.tags}>
            {spell.ritual && <SpellTag icon={RITUAL_ICON} label="Ritual" />}
            {spell.concentration && <SpellTag icon={CONCENTRATION_ICON} label="Concentration" />}
          </span>
        </span>
      </div>

      <div className={styles.textBox}>
        <p>{spell.description}</p>
      </div>

      <SpellCardStatStrip duration={spell.duration} save={spell.save} />
    </article>
  );
}
