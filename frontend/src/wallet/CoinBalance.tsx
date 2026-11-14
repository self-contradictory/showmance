import { Coins, Plus } from "lucide-react";
import { useViewer } from "@/show/useViewer";
import { Count } from "@/ui/Count";

export function CoinBalance({ onOpen }: { onOpen: () => void }) {
  const coins = useViewer().data?.viewer.coins;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={coins === undefined ? "Get coins" : `${coins.toLocaleString("en-US")} coins, get more`}
      className="flex h-9 items-center gap-1.5 rounded-full bg-surface pr-2.5 pl-3 text-sm font-semibold tabular-nums transition-colors hover:bg-surface-strong"
    >
      <Coins size={16} className="text-accent" />
      {coins === undefined ? <span className="w-5" /> : <Count value={coins} />}
      <Plus size={14} className="text-muted" />
    </button>
  );
}
