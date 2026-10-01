import { CardSpotlight } from "src/cards/card-spotlight.component";
import { SpellCard } from "src/cards/spell-card.component";
import { WeaponCard } from "src/cards/weapon-card.component";
import { weapons } from "src/models/gear/weapons.model";
import { spells } from "src/models/spells/spells.model";

export type BuilderPreviewSelection = {
  kind: "weapon" | "spell";
  id: string;
  trigger: HTMLElement;
};

type BuilderPreviewProps = {
  preview: BuilderPreviewSelection;
  onClose: () => void;
};

/**
 * Lifts a choice's card into the shared spotlight.
 * - Weapon and spell previews return focus to their triggering button.
 * Throws for an unknown spell id.
 */
export function BuilderPreview({ preview, onClose }: BuilderPreviewProps) {
  const weapon = preview.kind === "weapon" ? weapons.find({ id: preview.id }) : null;
  const spell = preview.kind === "spell" ? spells.get({ id: preview.id }) : null;
  if (!weapon && !spell) return null;

  return (
    <CardSpotlight
      label={weapon?.name ?? spell?.name ?? ""}
      liftedFrom={preview.trigger}
      onClose={onClose}
    >
      {weapon && <WeaponCard weapon={weapon} />}
      {!weapon && spell && <SpellCard spell={spell} />}
    </CardSpotlight>
  );
}
