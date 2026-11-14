import type { Twist, Vote as VoteData } from "@/show/types";
import { ChatInput } from "./ChatInput";
import { Comments } from "./Comments";
import type { ChatComment } from "./comments/types";
import { TwistButton } from "./TwistButton";
import { Vote } from "./Vote";

type Props = {
  comments: ChatComment[];
  vote: VoteData | null;
  myVote: string | null;
  twists: Twist[];
  balance: number;
  onSend: (text: string) => void;
  onVote: (optionId: string) => void;
  onBuyTwist: (twistId: string) => void;
};

export function Chat({ comments, vote, myVote, twists, balance, onSend, onVote, onBuyTwist }: Props) {
  return (
    <aside aria-label="Chat" className="flex min-h-0 flex-col max-lg:flex-1 max-lg:px-4 max-lg:pb-3 lg:w-[340px] lg:shrink-0">
      <h2 className="pb-3 text-sm font-semibold max-lg:hidden">Chat</h2>
      {vote && <Vote vote={vote} myVote={myVote} onVote={onVote} />}
      <Comments comments={comments} />
      <div className="flex shrink-0 gap-2 pt-3">
        <ChatInput onSend={onSend} />
        <TwistButton twists={twists} balance={balance} onBuy={onBuyTwist} />
      </div>
    </aside>
  );
}
