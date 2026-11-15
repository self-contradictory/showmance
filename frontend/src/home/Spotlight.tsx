import { Play } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";

export function Spotlight({ onDismiss }: { onDismiss: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onDismiss();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  return (
    <motion.div
      aria-hidden
      onClick={onDismiss}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-30 bg-page/50 backdrop-blur-md"
    />
  );
}

export function WatchLabel() {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="pointer-events-none absolute inset-x-0 top-0 flex aspect-video items-end justify-center pb-[6%]"
    >
      <span className="relative">
        <span className="absolute inset-0 animate-ping rounded-full bg-accent/50 motion-reduce:animate-none" />
        <span className="relative flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent shadow-lg">
          <Play size={14} fill="currentColor" />
          Watch live
        </span>
      </span>
    </motion.span>
  );
}
