import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { useState } from "react";
import { Chat } from "@/chat/Chat";
import { readStored, writeStored } from "@/lib/storage";
import { useShow } from "@/show/useShow";
import { ThemeToggle } from "@/theme/ThemeToggle";
import { IconButton } from "@/ui/IconButton";
import { ShowInfo } from "./ShowInfo";
import { Stage } from "./Stage";
import { VillaPlaceholder } from "./VillaPlaceholder";

const CHAT_KEY = "showmance:chat";

export function StreamPage() {
  const { show, myVote, send, vote, dropTwist } = useShow();
  const [chatOpen, setChatOpen] = useState(() => readStored(CHAT_KEY) !== "hidden");

  function toggleChat() {
    const next = !chatOpen;
    setChatOpen(next);
    writeStored(CHAT_KEY, next ? "shown" : "hidden");
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between px-4 lg:px-6">
        <span className="font-serif text-2xl leading-none italic">showmance</span>
        <div className="flex items-center gap-1">
          <IconButton label={chatOpen ? "Hide chat" : "Show chat"} pressed={chatOpen} onClick={toggleChat}>
            {chatOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
          </IconButton>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row lg:px-6 lg:pb-6">
        <main className="flex shrink-0 flex-col lg:min-h-0 lg:min-w-0 lg:flex-1">
          <Stage viewers={show.viewers} caption={show.caption}>
            <VillaPlaceholder />
          </Stage>
          <ShowInfo title={show.title} day={show.day} now={show.now} cast={show.cast} />
        </main>

        <div
          inert={!chatOpen}
          className={`flex min-h-0 overflow-hidden transition-[width,margin] duration-300 ease-out motion-reduce:transition-none max-lg:flex-1 lg:shrink-0 ${chatOpen ? "lg:ml-6 lg:w-[340px]" : "max-lg:hidden lg:ml-0 lg:w-0"}`}
        >
          <Chat
            comments={show.comments}
            vote={show.vote}
            myVote={myVote}
            twistIdeas={show.twistIdeas}
            twistPrice={show.twistPrice}
            balance={show.balance}
            onSend={send}
            onVote={vote}
            onDropTwist={dropTwist}
          />
        </div>
      </div>
    </div>
  );
}
