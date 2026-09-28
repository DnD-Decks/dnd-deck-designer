import { ClassSelector } from "src/decks/class-selector.component";
import { DeckView } from "src/decks/deck-view.component";
import type { CharacterClass } from "src/models/class/classes.model";
import { classes } from "src/models/class/classes.model";
import { Redirect, useLocation } from "wouter";

export const DEFAULT_CATALOG_CLASS: CharacterClass = "wizard"; // richest spell list — good showcase default

export function CatalogPage({ cls }: { cls: string }) {
  const [, navigate] = useLocation();
  const found = classes.find({ id: cls });

  if (!found) return <Redirect to={`/catalog/${DEFAULT_CATALOG_CLASS}`} replace />;

  return (
    <>
      <ClassSelector selected={found.id} onSelect={(id) => navigate(`/catalog/${id}`)} />
      <DeckView cls={found.id} />
    </>
  );
}
