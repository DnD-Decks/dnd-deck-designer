import { SpellCard } from "src/cards/spell-card.component";
import { spells } from "src/models/spells/spells.model";
import styles from "./app.module.css";

const iceKnife = spells.get({ id: "ice-knife" });

export function App() {
  return (
    <div className={styles.root}>
      <SpellCard spell={iceKnife} />
    </div>
  );
}
