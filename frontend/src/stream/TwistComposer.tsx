import { Sparkles, X } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { MAX_TWIST_LENGTH } from "@/show/types";

type Props = {
  price: number;
  balance: number;
  onDrop: (text: string) => void;
  onClose: () => void;
};

export function TwistComposer({ price, balance, onDrop, onClose }: Props) {
  const [text, setText] = useState("");
  const twist = text.trim();
  const canAfford = balance >= price;

  return (
    <motion.form
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onSubmit={(event) => {
        event.preventDefault();
        if (twist && canAfford) onDrop(twist);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
      className="absolute inset-x-3 bottom-3 mx-auto flex max-w-xl items-center gap-1.5 rounded-full bg-overlay p-1.5 backdrop-blur-md"
    >
      <input
        value={text}
        onChange={(event) => setText(event.target.value)}
        maxLength={MAX_TWIST_LENGTH}
        autoFocus
        autoComplete="off"
        enterKeyHint="send"
        placeholder="What should happen next?"
        aria-label="Your twist"
        className="h-9 min-w-0 flex-1 bg-transparent pl-3 text-sm outline-none placeholder:text-on-overlay/60"
      />
      <button
        type="submit"
        disabled={!twist || !canAfford}
        className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 text-sm font-semibold text-on-accent transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        <Sparkles size={16} />
        {canAfford ? (
          <span>
            <span className="max-sm:hidden">Drop for </span>
            {price} coins
          </span>
        ) : (
          "Not enough coins"
        )}
      </button>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cancel twist"
        className="grid size-9 shrink-0 place-items-center rounded-full opacity-80 transition hover:bg-on-overlay/10 hover:opacity-100"
      >
        <X size={18} />
      </button>
    </motion.form>
  );
}
