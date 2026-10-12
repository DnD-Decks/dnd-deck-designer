export const spendLabel = (spent: boolean) => (spent ? "Recover" : "Spend");
export const withSpent = (name: string, spent: boolean) => (spent ? `${name}, spent` : name);

export function SpentMark({ className }: { className: string }) {
  return (
    <span className={className} aria-hidden="true">
      Spent
    </span>
  );
}
