import { Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { ChatInput } from "./ChatInput";
import { TwistComposer } from "./TwistComposer";

type Mode = "chat" | "twist";

type Props = {
  twistIdeas: string[];
  twistPrice: number;
  balance: number;
  onSend: (text: string) => void;
  onDropTwist: (text: string) => void;
};

export function Composer({ twistIdeas, twistPrice, balance, onSend, onDropTwist }: Props) {
  const [mode, setMode] = useState<Mode>("chat");

  return (
    <div className="shrink-0 space-y-2.5 pt-3">
      <div role="group" aria-label="Write a message or a twist" className="grid grid-cols-2 rounded-full bg-surface p-1">
        <ModeButton active={mode === "chat"} onClick={() => setMode("chat")}>
          Chat
        </ModeButton>
        <ModeButton active={mode === "twist"} onClick={() => setMode("twist")}>
          <Sparkles size={14} className="text-accent" />
          Twist
        </ModeButton>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          {mode === "chat" ? (
            <ChatInput onSend={onSend} />
          ) : (
            <TwistComposer
              ideas={twistIdeas}
              price={twistPrice}
              balance={balance}
              onDrop={(text) => {
                onDropTwist(text);
                setMode("chat");
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`relative flex h-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${active ? "text-ink" : "text-muted hover:text-ink"}`}
    >
      {active && (
        <motion.span
          layoutId="composer-mode"
          className="absolute inset-0 rounded-full bg-surface-strong"
          transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
        />
      )}
      <span className="relative flex items-center gap-1.5">{children}</span>
    </button>
  );
}
