import { Icon } from "src/lib/icon.component";
import type { Resource } from "src/models/resources/resources.model";
import { resources } from "src/models/resources/resources.model";
import type { RestType } from "src/models/rest/rest-actions.model";
import { restActions } from "src/models/rest/rest-actions.model";
import { CardArt } from "./card-art.component";
import styles from "./resource-card.module.css";
import { ResourceSymbol } from "./resource-symbol.component";

type Props = { resource: Resource; recharge: RestType };

// the painting is the symbol made epic, so every mana token shares one
const artOf = (resource: Resource) => (resource.mana ? "resource-mana" : `resource-${resource.id}`);

/** A token to spend: its symbol beside the name, a painting of it, and the rest that brings this copy back. */
export function ResourceCard({ resource, recharge }: Props) {
  const rest = restActions.get({ id: recharge });

  return (
    // the twin copies of Second Wind share a heading; the name tells them apart
    <article
      className={styles.card}
      data-recharge={recharge}
      aria-label={resources.tokenName({ resource, recharge })}
    >
      <CardArt assetId={artOf(resource)} />
      <header className={styles.titleBar}>
        <h3 className={styles.name}>{resource.name}</h3>
        <ResourceSymbol resource={resource} className={styles.symbol} />
      </header>

      <div className={styles.artWindow} />

      <footer className={styles.footer}>
        <Icon src={rest.icon} label={rest.label} className={styles.restIcon} decorative />
        <span>{rest.label}</span>
      </footer>
    </article>
  );
}
