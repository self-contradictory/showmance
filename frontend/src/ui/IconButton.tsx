import type { ReactNode } from "react";

type Props = {
  label: string;
  onClick: () => void;
  pressed?: boolean;
  children: ReactNode;
};

export function IconButton({ label, onClick, pressed, children }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className="grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface hover:text-ink"
    >
      {children}
    </button>
  );
}
