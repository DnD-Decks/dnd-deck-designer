type Props = {
  src: string;
  label: string;
  className?: string;
  /** Purely visual next to visible text: empty alt so it adds nothing to the accessible name. */
  decorative?: boolean;
};

export function Icon({ src, label, className, decorative = false }: Props) {
  if (decorative) return <img src={src} alt="" aria-hidden="true" className={className} />;
  return <img src={src} alt={label} title={label} className={className} />;
}
