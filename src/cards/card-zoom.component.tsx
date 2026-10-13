import type { Zoom } from "src/cards/use-card-spotlight.hook";

type Props = { name: string; className: string; zoom: Zoom };

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
