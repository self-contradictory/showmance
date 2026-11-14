import { Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { MAX_MESSAGE_LENGTH, MAX_TWIST_LENGTH } from "@/show/types";

type Mode = "chat" | "twist";

type Props = {
  canTwist: boolean;
  onSend: (text: string) => void;
  onDropTwist: (text: string) => void;
};

const actionButton =
  "flex h-10 w-[5.5rem] shrink-0 items-center justify-center gap-1.5 rounded-full bg-accent text-sm font-semibold text-on-accent transition-opacity hover:opacity-90 disabled:opacity-50";

export function ChatInput({ canTwist, onSend, onDropTwist }: Props) {
  const [mode, setMode] = useState<Mode>("chat");
  const [drafts, setDrafts] = useState<Record<Mode, string>>({ chat: "", twist: "" });
  const inputRef = useRef<HTMLInputElement>(null);
  const twisting = mode === "twist";
  const text = drafts[mode];
  const message = text.trim();

  function switchTo(next: Mode) {
    setMode(next);
    inputRef.current?.focus();
  }

  function submit() {
    if (!message) return;
    if (twisting) {
      if (!canTwist) return;
      onDropTwist(message);
      setMode("chat");
    } else {
      onSend(message);
    }
    setDrafts((current) => ({ ...current, [mode]: "" }));
  }

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div
        className={`flex h-10 min-w-0 flex-1 items-center rounded-full transition-colors ${twisting ? "bg-accent/10 ring-1 ring-accent/60 ring-inset" : "bg-surface focus-within:ring-1 focus-within:ring-muted/50 focus-within:ring-inset"}`}
      >
        <input
          ref={inputRef}
          value={text}
          onChange={(event) => setDrafts((current) => ({ ...current, [mode]: event.target.value }))}
          onKeyDown={(event) => {
            if (event.key === "Escape" && twisting) switchTo("chat");
          }}
          maxLength={twisting ? MAX_TWIST_LENGTH : MAX_MESSAGE_LENGTH}
          placeholder={twisting ? (canTwist ? "What should happen next?" : "You're out of coins") : "Send a message"}
          aria-label={twisting ? "Your twist" : "Send a message"}
          autoComplete="off"
          enterKeyHint="send"
          className="h-full min-w-0 flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-muted"
        />
        <AnimatePresence>
          {twisting && (
            <motion.button
              type="button"
              onClick={() => switchTo("chat")}
              aria-label="Cancel twist"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="mr-1 grid size-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:text-ink"
            >
              <X size={16} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {twisting ? (
        <button key="drop" type="submit" disabled={!message || !canTwist} className={actionButton}>
          <Sparkles size={16} />
          Drop
        </button>
      ) : (
        <button key="twist" type="button" onClick={() => switchTo("twist")} className={actionButton}>
          <Sparkles size={16} />
          Twist
        </button>
      )}
    </form>
  );
}
