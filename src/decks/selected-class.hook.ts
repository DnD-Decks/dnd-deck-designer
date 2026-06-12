import { useEffect, useState } from "react";
import type { CharacterClass } from "src/models/class/classes.model";
import { classes } from "src/models/class/classes.model";

const DEFAULT_CLASS: CharacterClass = "wizard"; // richest spell list — good showcase default

function classFromHash() {
  const id = window.location.hash.slice(1);
  return classes.find({ id })?.id ?? DEFAULT_CLASS;
}

/** Selected class synced with the URL hash (`/#wizard`) — shareable, back-button friendly. */
export function useSelectedClass(): [CharacterClass, (cls: CharacterClass) => void] {
  const [selected, setSelected] = useState<CharacterClass>(classFromHash);

  useEffect(() => {
    const onHashChange = () => setSelected(classFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const select = (cls: CharacterClass) => {
    window.location.hash = cls;
    setSelected(cls);
  };

  return [selected, select];
}
