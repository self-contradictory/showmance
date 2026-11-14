import { Check } from "lucide-react";
import { motion } from "motion/react";
import { useNow } from "@/lib/useNow";
import type { Vote as VoteData } from "@/show/types";

type Props = {
  vote: VoteData;
  myVote: string | null;
  onVote: (optionId: string) => void;
};

export function Vote({ vote, myVote, onVote }: Props) {
  const now = useNow(1000);
  const secondsLeft = vote.endsAt === undefined ? null : Math.max(0, Math.ceil((vote.endsAt - now) / 1000));
  const closed = secondsLeft === 0;
  const total = vote.options.reduce((sum, option) => sum + option.votes, 0);

  return (
    <section aria-label="Vote" className="pb-3">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium">{vote.question}</p>
        <p className="shrink-0 text-xs text-muted tabular-nums">
          {secondsLeft === null ? "" : closed ? "Closing" : `${formatClock(secondsLeft)} left`}
        </p>
      </div>

      <ul className="space-y-1.5">
        {vote.options.map((option) => {
          const pct = total ? Math.round((option.votes / total) * 100) : 0;
          const mine = option.id === myVote;
          return (
            <li key={option.id}>
              <button
                type="button"
                onClick={() => onVote(option.id)}
                disabled={myVote !== null || closed}
                aria-pressed={mine}
                className="relative flex h-10 w-full items-center justify-between overflow-hidden rounded-full bg-surface px-4 text-sm focus-visible:outline-offset-[-2px] enabled:hover:ring-1 enabled:hover:ring-muted/50 enabled:hover:ring-inset"
              >
                <motion.span
                  aria-hidden
                  initial={false}
                  animate={{ width: `${pct}%` }}
                  transition={{ type: "spring", stiffness: 140, damping: 22 }}
                  className={`absolute inset-y-0 left-0 ${mine ? "bg-accent/30" : "bg-surface-strong"}`}
                />
                <span className="relative flex items-center gap-1.5 font-medium">
                  {option.label}
                  {mine && <Check size={14} strokeWidth={2.5} className="text-accent" aria-label="Your vote" />}
                </span>
                <span className="relative text-muted tabular-nums">{pct}%</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function formatClock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
