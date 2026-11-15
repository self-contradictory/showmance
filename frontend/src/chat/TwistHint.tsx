import { motion } from "motion/react";

export function TwistHint({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div
      role="status"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="absolute right-0 bottom-full z-10 mb-3 w-64 rounded-xl bg-ink px-4 py-3 text-page shadow-lg"
    >
      <p className="text-sm font-semibold">Make something happen</p>
      <p className="mt-0.5 text-sm opacity-80">Write a twist and the cast acts it out live.</p>
      <button type="button" onClick={onDismiss} className="mt-2 text-sm font-semibold text-accent">
        Got it
      </button>
      <span aria-hidden className="absolute right-[2.375rem] -bottom-1.5 size-3 rotate-45 bg-ink" />
    </motion.div>
  );
}
