import { ChatInput } from "./ChatInput";
import { Comments } from "./Comments";
import type { ChatComment } from "./comments/types";

type Props = {
  comments: ChatComment[];
  onSend: (text: string) => void;
};

export function Chat({ comments, onSend }: Props) {
  return (
    <aside
      aria-label="Chat"
      className="flex min-h-0 flex-col border-line max-lg:flex-1 max-lg:border-t lg:w-[340px] lg:border-l"
    >
      <h2 className="flex h-11 shrink-0 items-center border-b border-line px-4 text-sm font-semibold">Chat</h2>
      <Comments comments={comments} />
      <div className="flex shrink-0 gap-2 p-3">
        <ChatInput onSend={onSend} />
      </div>
    </aside>
  );
}
