import { type CSSProperties, useId } from "react";
import { Icon } from "src/lib/icon.component";
import { ACTION_TIMING_ICONS, ACTION_TIMING_LABELS } from "src/models/actions/combat.model";
import type { ClassAction } from "src/models/class-actions/class-actions.model";
import { resources } from "src/models/resources/resources.model";
import { CardArt } from "./card-art.component";
import { CardRange } from "./card-range.component";
import { CardStatFooter } from "./card-stat-footer.component";
import styles from "./class-action-card.module.css";
import { ResourceSymbol } from "./resource-symbol.component";
import spellStyles from "./spell-card.module.css";

type Props = { action: ClassAction };

const ACTION_STYLE = { "--card-color": "var(--gold)" } as CSSProperties;

function CostRail({ action }: Props) {
  const resource = resources.get({ id: action.cost.resource });
  const amount = action.cost.amount ?? 1;

  return (
    <section className={spellStyles.costRail} aria-label="Cost">
      <Icon
        src={ACTION_TIMING_ICONS[action.timing]}
        label={ACTION_TIMING_LABELS[action.timing]}
        className={spellStyles.costAction}
      />
      <span className={styles.cost}>
        <ResourceSymbol resource={resource} className={spellStyles.costAction} />
        {amount !== 1 && <span className={styles.amount}>×{amount}</span>}
      </span>
    </section>
  );
}

/** What a class does with a resource, laid out like a spell: the token it spends sits in the cost rail. */
export function ClassActionCard({ action }: Props) {
  const headingId = useId();

  return (
    <article className={spellStyles.card} style={ACTION_STYLE} aria-labelledby={headingId}>
      <CardArt assetId={action.id} />

      <div className={spellStyles.titleBar}>
        <h3 id={headingId} className={spellStyles.name}>
          {action.name}
        </h3>
      </div>
      <CostRail action={action} />

      <div className={spellStyles.artWindow} />

      <div className={spellStyles.typeLine}>
        <span>Class Action</span>
        <span className={spellStyles.infoRight}>
          <CardRange range={action.range} />
        </span>
      </div>

      <div className={spellStyles.textBox}>
        <p>{action.description}</p>
      </div>

      <CardStatFooter duration={action.duration} />
    </article>
  );
}
