import { Chat } from "@/chat/Chat";
import { useShow } from "@/show/useShow";
import { ThemeToggle } from "@/theme/ThemeToggle";
import { ShowInfo } from "./ShowInfo";
import { Stage } from "./Stage";
import { VillaPlaceholder } from "./VillaPlaceholder";

export function StreamPage() {
  const { show, myVote, send, vote, buyTwist } = useShow();

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between px-4 lg:px-6">
        <span className="font-serif text-2xl leading-none italic">showmance</span>
        <ThemeToggle />
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row lg:gap-6 lg:px-6 lg:pb-6">
        <main className="flex shrink-0 flex-col lg:min-h-0 lg:min-w-0 lg:flex-1">
          <Stage viewers={show.viewers} caption={show.caption}>
            <VillaPlaceholder />
          </Stage>
          <ShowInfo title={show.title} day={show.day} now={show.now} cast={show.cast} />
        </main>

        <Chat
          comments={show.comments}
          vote={show.vote}
          myVote={myVote}
          twists={show.twists}
          balance={show.balance}
          onSend={send}
          onVote={vote}
          onBuyTwist={buyTwist}
        />
      </div>
    </div>
  );
}
