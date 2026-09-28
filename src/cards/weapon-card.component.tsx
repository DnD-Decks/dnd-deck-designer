import { type CSSProperties, useId } from "react";
import { Icon } from "src/lib/icon.component";
import { weaponMastery } from "src/models/gear/weapon-mastery.model";
import type { Weapon, WeaponPropertyRef } from "src/models/gear/weapons.model";
import { weaponIcon } from "src/models/gear/weapons.model";
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

// ammunition details read "80/320; arrow": the range goes on the stat strip, the ammo stays here
function propertyLabel(ref: WeaponPropertyRef) {
  if (typeof ref === "string") return titleCase(ref);
  const detail = ref.id === "ammunition" ? ref.detail.split("; ")[1] : ref.detail;
  return `${titleCase(ref.id)} (${detail})`;
}

function rangeLabel(weapon: Weapon) {
  const ammunition = weapon.properties.find(
    (ref) => typeof ref !== "string" && ref.id === "ammunition"
  );
  if (ammunition && typeof ammunition !== "string") {
    return `${ammunition.detail.split("; ")[0]} ft`;
  }
  return "Melee";
}

function DamageItem({ damage }: Pick<Weapon, "damage">) {
  const dice = diceIcon(damage.dice);
  const type = damageIcon(damage.type);
  return (
    <span className={spellStyles.statItem}>
      {dice && <Icon src={dice} label={damage.dice} className={spellStyles.statIcon} />}
      {type && <Icon src={type} label={damage.type} className={spellStyles.statIcon} />}
      <span>
        {damage.dice} {damage.type}
      </span>
    </span>
  );
}

export function WeaponCard({ weapon }: Props) {
  const headingId = useId();
  const masteryId = useId();
  const icon = weaponIcon(weapon.id);
  const mastery = weaponMastery.get({ id: weapon.mastery });
  const range = rangeLabel(weapon);

  return (
    <article className={spellStyles.card} style={WEAPON_STYLE} aria-labelledby={headingId}>
      <CardArt assetId={`weapon-${weapon.id}`} />
      <div className={spellStyles.titleBar}>
        <h3 id={headingId} className={spellStyles.name}>
          {weapon.name}
        </h3>
        {icon && <Icon src={icon} label={weapon.name} className={styles.weaponIcon} decorative />}
      </div>

      <div className={spellStyles.artWindow} />

      <div className={spellStyles.typeLine}>
        {titleCase(weapon.proficiency)} {titleCase(weapon.range)} Weapon
      </div>

      <div className={spellStyles.textBox}>
        {weapon.properties.length > 0 && (
          <ul className={styles.properties} aria-label="Properties">
            {weapon.properties.map((ref) => (
              <li key={typeof ref === "string" ? ref : ref.id}>{propertyLabel(ref)}</li>
            ))}
          </ul>
        )}
        <section className={styles.mastery} aria-labelledby={masteryId}>
          <h4 id={masteryId} className={styles.masteryTitle}>
            Weapon Mastery: {titleCase(mastery.id)}
          </h4>
          <p>{mastery.description}</p>
        </section>
        <div className={spellStyles.statStrip}>
          <DamageItem damage={weapon.damage} />
          <span className={spellStyles.statItem}>
            <Icon src={rangeIcon(range)} label="Range" className={spellStyles.statIcon} />
            <span>{range}</span>
          </span>
        </div>
      </div>
    </article>
  );
}
