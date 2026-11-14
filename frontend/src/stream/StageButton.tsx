import type { ReactNode } from "react";

type Props = {
  label: string;
  onClick: () => void;
  children: ReactNode;
};

export function StageButton({ label, onClick, children }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid size-9 place-items-center rounded-full bg-overlay backdrop-blur-md transition-colors hover:bg-overlay-strong"
    >
      {children}
    </button>
  );
}
