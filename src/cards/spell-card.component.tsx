import { useId } from "react";
import { Icon } from "src/lib/icon.component";
import {
  CONCENTRATION_ICON,
  MANA_ICON,
  RITUAL_ICON,
  actionIcon,
} from "src/models/spells/spell-icon.model";
import type { Spell } from "src/models/spells/spells.model";
import { CardArt } from "./card-art.component";
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

export function SpellCard({ spell }: Props) {
  const headingId = useId();
  const action = actionIcon(spell.castingTime);

  return (
    <article
      className={styles.card}
      aria-labelledby={headingId}
      data-school={spell.school.toLowerCase()}
    >
      <CardArt assetId={spell.id} />

      <div className={styles.titleBar}>
        <h3 id={headingId} className={styles.name}>
          {spell.name}
        </h3>
        <span className={styles.costCluster}>
          {action && <Icon src={action.src} label={action.label} className={styles.actionIcon} />}
          <span className={styles.manaBadge}>
            <Icon src={MANA_ICON} label="Mana" className={styles.manaIcon} />
            {spell.level > 0 && <span className={styles.manaLevel}>{spell.level}</span>}
          </span>
        </span>
      </div>

      <div className={styles.artWindow} />

      <div className={styles.typeLine}>
        <span>
          {spell.school} · {levelLabel(spell.level)}
        </span>
        <span className={styles.tags}>
          {spell.ritual && <SpellTag icon={RITUAL_ICON} label="Ritual" />}
          {spell.concentration && <SpellTag icon={CONCENTRATION_ICON} label="Concentration" />}
        </span>
      </div>

      <div className={styles.textBox}>
        <p>{spell.description}</p>
      </div>

      <SpellCardStatStrip
        range={spell.range}
        duration={spell.duration}
        save={spell.save}
        damage={spell.damage}
      />
    </article>
  );
}
