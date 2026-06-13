import { Icon } from "src/lib/icon.component";
import {
  CONCENTRATION_ICON,
  MANA_ICON,
  RITUAL_ICON,
  actionIcon,
} from "src/models/spells/spell-icon.model";
import type { Spell } from "src/models/spells/spells.model";
import { SpellCardStatStrip } from "./spell-card-stat-strip.component";
import styles from "./spell-card.module.css";

const levelLabel = (level: Spell["level"]) => (level === 0 ? "Cantrip" : `Level ${level}`);

type Props = { spell: Spell };

export function SpellCard({ spell }: Props) {
  const headingId = `spell-card-${spell.id}`;
  const action = actionIcon(spell.castingTime);

  return (
    <article className={styles.card} aria-labelledby={headingId} data-school={spell.school.toLowerCase()}>
      {/* Title bar — name left, cost cluster right */}
      <div className={styles.titleBar}>
        <h3 id={headingId} className={styles.name}>{spell.name}</h3>
        <span className={styles.costCluster}>
          {action ? (
            <Icon src={action.src} label={action.label} className={styles.actionIcon} />
          ) : null}
          <span className={styles.manaBadge}>
            <Icon src={MANA_ICON} label="Mana" className={styles.manaIcon} />
            {spell.level > 0 ? <span className={styles.manaLevel}>{spell.level}</span> : null}
          </span>
        </span>
      </div>

      {/* Art box — placeholder for v1 */}
      <div className={styles.art} aria-hidden="true">
        <span className={styles.artPlaceholder}>{spell.school[0]}</span>
      </div>

      {/* Type line — school · level + flag icons */}
      <div className={styles.typeLine}>
        <span>
          {spell.school} · {levelLabel(spell.level)}
        </span>
        <span className={styles.tags}>
          {spell.ritual ? (
            <span className={styles.tag}>
              <Icon src={RITUAL_ICON} label="Ritual" className={styles.tagIcon} />
            </span>
          ) : null}
          {spell.concentration ? (
            <span className={styles.tag}>
              <Icon src={CONCENTRATION_ICON} label="Concentration" className={styles.tagIcon} />
            </span>
          ) : null}
        </span>
      </div>

      {/* Text box — description + stat strip */}
      <div className={styles.textBox}>
        <p>{spell.description}</p>
        <SpellCardStatStrip
          range={spell.range}
          duration={spell.duration}
          save={spell.save}
          damage={spell.damage}
        />
      </div>
    </article>
  );
}
