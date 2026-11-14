import { Sparkles } from "lucide-react";
import { useState } from "react";
import { MAX_TWIST_LENGTH } from "@/show/types";

type Props = {
  ideas: string[];
  price: number;
  balance: number;
  onDrop: (text: string) => void;
};

export function TwistComposer({ ideas, price, balance, onDrop }: Props) {
  const [text, setText] = useState("");
  const twist = text.trim();
  const canAfford = balance >= price;
  const canDrop = twist.length > 0 && canAfford;

  function drop() {
    if (!canDrop) return;
    onDrop(twist);
    setText("");
  }

  return (
    <form
      className="space-y-2.5"
      onSubmit={(event) => {
        event.preventDefault();
        drop();
      }}
    >
      <ul className="flex flex-wrap gap-1.5" aria-label="Twist ideas">
        {ideas.map((idea) => (
          <li key={idea}>
            <button
              type="button"
              onClick={() => setText(idea)}
              className={`rounded-full px-3 py-1.5 text-xs transition-colors ${text === idea ? "bg-accent/15 text-ink" : "bg-surface text-muted hover:bg-surface-strong hover:text-ink"}`}
            >
              {idea}
            </button>
          </li>
        ))}
      </ul>

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
          event.preventDefault();
          drop();
        }}
        rows={3}
        maxLength={MAX_TWIST_LENGTH}
        autoFocus
        placeholder="What should happen next?"
        aria-label="Your twist"
        className="block w-full resize-none rounded-2xl bg-surface px-4 py-3 text-sm outline-none placeholder:text-muted focus:ring-1 focus:ring-muted/50"
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted">
          {canAfford ? `${price} coins per twist. You have ${balance}.` : `You need ${price} coins. You have ${balance}.`}
        </p>
        <button
          type="submit"
          disabled={!canDrop}
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 text-sm font-semibold text-on-accent transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <Sparkles size={16} />
          Drop twist
        </button>
      </div>
    </form>
  );
}
