import { useState } from "react";
import { Chat } from "@/chat/Chat";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { readStored, writeStored } from "@/lib/storage";
import { useShow } from "@/show/useShow";
import { ThemeToggle } from "@/theme/ThemeToggle";
import { ShowInfo } from "./ShowInfo";
import { Stage } from "./Stage";
import { VillaPlaceholder } from "./VillaPlaceholder";

const CHAT_KEY = "showmance:chat";

export function StreamPage() {
  const { show, myVote, send, vote, dropTwist } = useShow();
  const isDesktop = useMediaQuery("(min-width: 64rem)");
  const [chatOpen, setChatOpen] = useState(() => readStored(CHAT_KEY) !== "hidden");
  const chatShown = chatOpen || !isDesktop;

  function setChat(open: boolean) {
    setChatOpen(open);
    writeStored(CHAT_KEY, open ? "shown" : "hidden");
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between px-4 lg:px-6">
        <span className="font-serif text-2xl leading-none italic">showmance</span>
        <ThemeToggle />
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row lg:px-6 lg:pb-6">
        <main className="flex shrink-0 flex-col lg:min-h-0 lg:min-w-0 lg:flex-1">
          <Stage
            viewers={show.viewers}
            caption={show.caption}
            onShowChat={chatShown ? undefined : () => setChat(true)}
          >
            <VillaPlaceholder />
          </Stage>
          <ShowInfo title={show.title} day={show.day} now={show.now} cast={show.cast} />
        </main>

        <div
          inert={!chatShown}
          className={`flex min-h-0 overflow-hidden transition-[width,margin] duration-300 ease-out motion-reduce:transition-none max-lg:flex-1 lg:shrink-0 ${chatShown ? "lg:ml-6 lg:w-[340px]" : "lg:ml-0 lg:w-0"}`}
        >
          <Chat
            comments={show.comments}
            vote={show.vote}
            myVote={myVote}
            canTwist={show.balance >= show.twistPrice}
            onSend={send}
            onVote={vote}
            onDropTwist={dropTwist}
            onHide={() => setChat(false)}
          />
        </div>
      </div>
    </div>
  );
}
