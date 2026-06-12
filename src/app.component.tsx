import { ClassSelector } from "src/decks/class-selector.component";
import { DeckView } from "src/decks/deck-view.component";
import { useSelectedClass } from "src/decks/selected-class.hook";
import styles from "./app.module.css";

export function App() {
  const [selected, setSelected] = useSelectedClass();

  return (
    <div className={styles.root}>
      <ClassSelector selected={selected} onSelect={setSelected} />
      <DeckView cls={selected} />
    </div>
  );
}
