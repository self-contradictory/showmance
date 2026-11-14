import { PanelRightClose } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { Vote as VoteData } from "@/show/types";
import { IconButton } from "@/ui/IconButton";
import { Comments } from "./Comments";
import type { ChatComment } from "./comments/types";
import { Composer } from "./Composer";
import { Vote } from "./Vote";

type Props = {
  comments: ChatComment[];
  vote: VoteData | null;
  myVote: string | null;
  twistIdeas: string[];
  twistPrice: number;
  balance: number;
  onSend: (text: string) => void;
  onVote: (optionId: string) => void;
  onDropTwist: (text: string) => void;
  onHide: () => void;
};

export function Chat({
  comments,
  vote,
  myVote,
  twistIdeas,
  twistPrice,
  balance,
  onSend,
  onVote,
  onDropTwist,
  onHide,
}: Props) {
  return (
    <aside
      aria-label="Chat"
      className="flex min-h-0 flex-col max-lg:flex-1 max-lg:px-4 max-lg:pb-3 lg:w-[340px] lg:shrink-0"
    >
      <div className="flex items-center justify-between pb-2 max-lg:hidden">
        <h2 className="text-sm font-semibold">Chat</h2>
        <IconButton label="Hide chat" onClick={onHide} className="-mr-2">
          <PanelRightClose size={18} />
        </IconButton>
      </div>
      <AnimatePresence initial={false}>
        {vote && (
          <motion.div
            key={vote.id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="shrink-0 overflow-hidden"
          >
            <Vote vote={vote} myVote={myVote} onVote={onVote} />
          </motion.div>
        )}
      </AnimatePresence>
      <Comments comments={comments} />
      <Composer
        twistIdeas={twistIdeas}
        twistPrice={twistPrice}
        balance={balance}
        onSend={onSend}
        onDropTwist={onDropTwist}
      />
    </aside>
  );
}
