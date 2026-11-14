import { useEffect, useRef, useState } from "react";
import type { Twist } from "@/show/types";

type Props = {
  twists: Twist[];
  balance: number;
  onBuy: (twistId: string) => void;
};

export function TwistButton({ twists, balance, onBuy }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on a click outside or Escape.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((isOpen) => !isOpen)}
        aria-expanded={open}
        aria-label="Drop a twist"
        title="Drop a twist"
        className="grid size-10 place-items-center rounded-full bg-accent text-lg text-on-accent hover:opacity-90"
      >
        ✦
      </button>

      {open && (
        <div className="absolute right-0 bottom-full mb-2 w-72 rounded-2xl bg-surface p-1.5 motion-safe:animate-fade-in">
          <ul>
            {twists.map((twist) => (
              <li key={twist.id}>
                <button
                  type="button"
                  disabled={twist.price > balance}
                  onClick={() => {
                    onBuy(twist.id);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-2 py-2 text-left text-sm enabled:hover:bg-surface-strong disabled:opacity-40"
                >
                  <span>{twist.label}</span>
                  <span className="shrink-0 text-muted tabular-nums">{twist.price}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="px-2 pt-2 pb-1 text-xs text-muted">You have {balance} coins</p>
        </div>
      )}
    </div>
  );
}
