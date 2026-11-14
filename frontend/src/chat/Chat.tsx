import type { Vote as VoteData } from "@/show/types";
import { ChatInput } from "./ChatInput";
import { Comments } from "./Comments";
import type { ChatComment } from "./comments/types";
import { Vote } from "./Vote";

type Props = {
  comments: ChatComment[];
  vote: VoteData | null;
  myVote: string | null;
  onSend: (text: string) => void;
  onVote: (optionId: string) => void;
};

export function Chat({ comments, vote, myVote, onSend, onVote }: Props) {
  return (
    <aside
      aria-label="Chat"
      className="flex min-h-0 flex-col border-line max-lg:flex-1 max-lg:border-t lg:w-[340px] lg:border-l"
    >
      <h2 className="flex h-11 shrink-0 items-center border-b border-line px-4 text-sm font-semibold">Chat</h2>
      {vote && <Vote vote={vote} myVote={myVote} onVote={onVote} />}
      <Comments comments={comments} />
      <div className="flex shrink-0 gap-2 p-3">
        <ChatInput onSend={onSend} />
      </div>
    </aside>
  );
}
