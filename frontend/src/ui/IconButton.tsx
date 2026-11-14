import type { ReactNode } from "react";

type Props = {
  label: string;
  onClick: () => void;
  className?: string;
  children: ReactNode;
};

export function IconButton({ label, onClick, className = "", children }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface hover:text-ink ${className}`}
    >
      {children}
    </button>
  );
}
