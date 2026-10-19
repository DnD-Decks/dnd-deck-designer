import { Icon } from "src/lib/icon.component";
import type { Resource } from "src/models/resources/resources.model";
import styles from "./resource-symbol.module.css";

type ManaGemProps = { level: number; className?: string };

export function ManaGem({ level, className = "" }: ManaGemProps) {
  return (
    <span
      className={`${styles.manaGem} ${className}`}
      role="img"
      aria-label={`Level ${level} mana`}
    >
      <span aria-hidden="true">{level}</span>
    </span>
  );
}

type Props = { resource: Resource; className?: string };

/** The mark a resource token shows and a class action prints as its cost. */
export function ResourceSymbol({ resource, className }: Props) {
  if (resource.mana) return <ManaGem level={resource.mana} className={className} />;
  if (resource.icon)
    return <Icon src={resource.icon} label={resource.name} className={className} />;
  return null;
}
