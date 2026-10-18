import type { Zoom } from "src/cards/use-card-spotlight.hook";
import styles from "./card-zoom.module.css";

// `className` replaces the whole-card overlay, e.g. the builder's corner magnifier
type Props = { name: string; className?: string; zoom: Zoom };

export function CardZoom({ name, className = styles.zoom, zoom }: Props) {
  return (
    <button
      type="button"
      className={className}
      aria-label={`Zoom ${name}`}
      ref={zoom.ref}
      onClick={zoom.onClick}
    />
  );
}
