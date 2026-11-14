import { useNow } from "@/lib/useNow";
import type { Vote as VoteData } from "@/show/types";

type Props = {
  vote: VoteData;
  /** The option this viewer picked, or null if they haven't voted. */
  myVote: string | null;
  onVote: (optionId: string) => void;
};

export function Vote({ vote, myVote, onVote }: Props) {
  const now = useNow(1000);
  const secondsLeft = Math.max(0, Math.ceil((vote.endsAt - now) / 1000));
  const closed = secondsLeft === 0;
  const total = vote.options.reduce((sum, option) => sum + option.votes, 0);

  return (
    <section aria-label="Vote" className="shrink-0 pb-3">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium">{vote.question}</p>
        <p className="shrink-0 text-xs text-muted tabular-nums">
          {closed ? "Closing" : `${formatClock(secondsLeft)} left`}
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
                className="relative flex h-10 w-full items-center justify-between overflow-hidden rounded-full bg-surface px-4 text-sm enabled:hover:ring-1 enabled:hover:ring-muted/50"
              >
                <span
                  aria-hidden
                  style={{ width: `${pct}%` }}
                  className={`absolute inset-y-0 left-0 transition-[width] duration-500 motion-reduce:transition-none ${mine ? "bg-accent/30" : "bg-surface-strong"}`}
                />
                <span className="relative font-medium">
                  {option.label}
                  {mine && <span className="text-accent"> ✓</span>}
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
