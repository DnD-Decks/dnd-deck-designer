type Props = { src: string; label: string; className?: string };

export function Icon({ src, label, className }: Props) {
  return <img src={src} alt={label} title={label} className={className} />;
}
