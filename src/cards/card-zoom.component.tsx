import type { Zoom } from "src/cards/use-card-spotlight.hook";

type Props = { name: string; className: string; zoom: Zoom };

/** The transparent button over a card's face that lifts it into the spotlight. */
export function CardZoom({ name, className, zoom }: Props) {
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
