import { useId } from "react";
import { Icon } from "src/lib/icon.component";
import type { ActionTiming } from "src/models/actions/combat.model";
import { ACTION_TIMING_ICONS } from "src/models/actions/combat.model";
import type { Resource } from "src/models/resources/resources.model";
import { restActions } from "src/models/rest/rest-actions.model";
import { CardArt } from "./card-art.component";
import styles from "./resource-card.module.css";

type Props = { resource: Resource };

const TIMING_LABELS: Record<ActionTiming, string> = {
  action: "Action",
  "bonus-action": "Bonus Action",
  reaction: "Reaction",
};

function TimingItem({ timing }: { timing: ActionTiming }) {
  const label = TIMING_LABELS[timing];
  return (
    <span className={styles.metaItem}>
      <Icon src={ACTION_TIMING_ICONS[timing]} label={label} className={styles.metaIcon} />
      {label}
    </span>
  );
}

export function ResourceCard({ resource }: Props) {
  const headingId = useId();
  const recharge = restActions.get({ id: resource.recharge }).label;

  return (
    <article className={styles.card} aria-labelledby={headingId}>
      <CardArt assetId={resource.id} />
      <header className={styles.titleBar}>
        {resource.icon && (
          <Icon src={resource.icon} label={resource.name} className={styles.resourceIcon} />
        )}
        <h3 id={headingId} className={styles.name}>
          {resource.name}
        </h3>
      </header>

      <div className={styles.metaLine}>
        {resource.action && <TimingItem timing={resource.action} />}
        {resource.pool && <span className={styles.metaItem}>Pool: {resource.pool}</span>}
        <span className={styles.metaItem}>Recharges: {recharge}</span>
      </div>

      <div className={styles.artWindow} />

      <div className={styles.textBox}>
        <p>{resource.description}</p>
      </div>
    </article>
  );
}
