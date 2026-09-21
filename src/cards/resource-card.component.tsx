import { Icon } from "src/lib/icon.component";
import type { ActionTiming } from "src/models/actions/combat.model";
import { ACTION_TIMING_ICONS } from "src/models/actions/combat.model";
import type { Resource } from "src/models/resources/resources.model";
import type { RestType } from "src/models/rest/rest-actions.model";
import { CardArt } from "./card-art.component";
import styles from "./resource-card.module.css";

type Props = { resource: Resource };

const usesLabel = (uses: number) => `×${uses}`;

const REST_LABELS: Record<RestType, string> = {
  "short-rest": "Short Rest",
  "long-rest": "Long Rest",
};

const TIMING_LABELS: Record<ActionTiming, string> = {
  action: "Action",
  "bonus-action": "Bonus Action",
  reaction: "Reaction",
};

export function ResourceCard({ resource }: Props) {
  const headingId = `resource-card-${resource.id}`;

  return (
    <article className={styles.card} aria-labelledby={headingId}>
      <CardArt assetId={resource.id} />
      <header className={styles.titleBar}>
        {resource.icon ? (
          <Icon src={resource.icon} label={resource.name} className={styles.resourceIcon} />
        ) : null}
        <h3 id={headingId} className={styles.name}>
          {resource.name}
        </h3>
        <span className={styles.usesBadge}>{usesLabel(resource.uses)}</span>
      </header>

      <div className={styles.metaLine}>
        {resource.action ? (
          <span className={styles.metaItem}>
            <Icon
              src={ACTION_TIMING_ICONS[resource.action]}
              label={TIMING_LABELS[resource.action]}
              className={styles.metaIcon}
            />
            {TIMING_LABELS[resource.action]}
          </span>
        ) : null}
        <span className={styles.metaItem}>Recharges: {REST_LABELS[resource.recharge]}</span>
      </div>

      {/* Art window — the painting shows through here unblurred */}
      <div className={styles.artWindow} />

      <div className={styles.textBox}>
        <p>{resource.description}</p>
      </div>
    </article>
  );
}
