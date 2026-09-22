import { useId } from "react";
import { Icon } from "src/lib/icon.component";
import type { Feat } from "src/models/feats/feats.model";
import { CardArt } from "./card-art.component";
import styles from "./feat-card.module.css";

type Props = { feat: Feat };

export function FeatCard({ feat }: Props) {
  const headingId = useId();

  return (
    <article className={styles.card} aria-labelledby={headingId}>
      <CardArt assetId={feat.id} />
      <header className={styles.header}>
        {/* class badge; decorative — the heading already names the card */}
        {feat.icon ? <Icon src={feat.icon} label="" decorative className={styles.badge} /> : null}
        <h3 id={headingId} className={styles.name}>
          {feat.name}
        </h3>
        <span className={styles.source}>{feat.source}</span>
      </header>

      <div className={styles.typeLine}>Class Feature</div>

      {/* Art window — the painting shows through here unblurred; the text panel sits below */}
      <div className={styles.artWindow} />

      <div className={styles.textBox}>
        <p>{feat.description}</p>
      </div>
    </article>
  );
}
