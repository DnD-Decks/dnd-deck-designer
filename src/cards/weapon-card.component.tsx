import { type CSSProperties, useId } from "react";
import { Icon } from "src/lib/icon.component";
import { weaponMastery } from "src/models/gear/weapon-mastery.model";
import type { Weapon, WeaponPropertyRef } from "src/models/gear/weapons.model";
import { damageIcon, diceIcon, rangeIcon } from "src/models/spells/spell-icon.model";
import { CardArt } from "./card-art.component";
import spellStyles from "./spell-card.module.css";
import styles from "./weapon-card.module.css";

type Props = { weapon: Weapon };

const WEAPON_STYLE = {
  "--school-color": "var(--mastery-steel)",
} as CSSProperties;

const titleCase = (id: string) =>
  id
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("-");

// `ammunition("80/320; arrow")` is { range: "80/320", ammo: "arrow" }:
// the range goes on the info line, the ammo stays in the properties
function ammunition(detail: string) {
  const [range, ammo] = detail.split("; ");
  return { range, ammo };
}

function propertyLabel(ref: WeaponPropertyRef) {
  if (typeof ref === "string") return titleCase(ref);
  const detail = ref.id === "ammunition" ? ammunition(ref.detail).ammo : ref.detail;
  return `${titleCase(ref.id)} (${detail})`;
}

// only ammunition weapons get a range on the info line; "Melee" is already in the weapon type
function rangeLabel(weapon: Weapon) {
  for (const ref of weapon.properties) {
    if (typeof ref !== "string" && ref.id === "ammunition") {
      return `${ammunition(ref.detail).range} ft`;
    }
  }
  return undefined;
}

// the damage takes the header's right end, where a player's eye lands first:
// "1d6" over "bludgeoning", then the d6 and the bludgeoning glyph
function HeaderDamage({ dice, type }: Weapon["damage"]) {
  const die = diceIcon(dice);
  const glyph = damageIcon(type);
  return (
    <section className={styles.damage} aria-label="Damage">
      <span className={styles.damageText}>
        <span className={styles.dice}>{dice}</span>
        <span className={styles.damageType}>{type}</span>
      </span>
      {die && <Icon src={die} label={dice} className={styles.die} decorative />}
      {glyph && <Icon src={glyph} label={type} className={styles.damageGlyph} decorative />}
    </section>
  );
}

export function WeaponCard({ weapon }: Props) {
  const headingId = useId();
  const masteryId = useId();
  const mastery = weaponMastery.get({ id: weapon.mastery });
  const range = rangeLabel(weapon);

  return (
    <article className={spellStyles.card} style={WEAPON_STYLE} aria-labelledby={headingId}>
      <CardArt assetId={`weapon-${weapon.id}`} />
      <div className={spellStyles.titleBar}>
        <h3 id={headingId} className={spellStyles.name}>
          {weapon.name}
        </h3>
        <HeaderDamage {...weapon.damage} />
      </div>

      <div className={spellStyles.artWindow} />

      <div className={spellStyles.typeLine}>
        <span>
          {titleCase(weapon.proficiency)} {titleCase(weapon.range)} Weapon
        </span>
        {range && (
          <span className={styles.range}>
            <span className={spellStyles.tag}>
              <Icon src={rangeIcon(range)} label="Range" className={spellStyles.tagIcon} />
            </span>
            {range}
          </span>
        )}
      </div>

      <div className={spellStyles.textBox}>
        <section className={styles.mastery} aria-labelledby={masteryId}>
          <h4 id={masteryId} className={styles.masteryTitle}>
            Weapon Mastery: <span className={styles.masteryKeyword}>{titleCase(mastery.id)}</span>
          </h4>
          <p>{mastery.description}</p>
        </section>
      </div>

      <div className={spellStyles.statStrip}>
        {weapon.properties.length > 0 && (
          <ul className={styles.properties} aria-label="Properties">
            {weapon.properties.map((ref) => (
              <li key={typeof ref === "string" ? ref : ref.id}>{propertyLabel(ref)}</li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
