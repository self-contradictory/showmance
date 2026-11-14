import { useEffect, useRef, useState } from "react";
import { Chat } from "@/chat/Chat";
import { useFullscreen } from "@/lib/useFullscreen";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { readStored, writeStored } from "@/lib/storage";
import { useShow } from "@/show/useShow";
import { Header } from "@/ui/Header";
import { ShowInfo } from "./ShowInfo";
import { Stage } from "./Stage";
import { ShowArt } from "./ShowArt";

const CHAT_KEY = "showmance:chat";

export function StreamPage({ slug }: { slug: string }) {
  const { show, myVote, send, vote, dropTwist } = useShow(slug);
  const streamRef = useRef<HTMLDivElement>(null);
  const fullscreen = useFullscreen(streamRef);
  const isDesktop = useMediaQuery("(min-width: 64rem)");
  const [chatOpen, setChatOpen] = useState(() => readStored(CHAT_KEY) !== "hidden");
  const chatShown = chatOpen || !isDesktop;
  const fs = fullscreen.isFullscreen;

  useEffect(() => {
    document.title = `${show.title} | Showmance`;
  }, [show.title]);

  function setChat(open: boolean) {
    setChatOpen(open);
    writeStored(CHAT_KEY, open ? "shown" : "hidden");
  }

  const chatWidth = !chatShown ? "lg:ml-0 lg:w-0" : fs ? "lg:w-[372px] lg:p-4" : "lg:ml-6 lg:w-[340px]";

  return (
    <div className="flex h-dvh flex-col">
      <Header />

      <div
        ref={streamRef}
        className={`flex min-h-0 flex-1 flex-col bg-page lg:flex-row ${fs ? "" : "lg:px-6 lg:pb-6"}`}
      >
        <main className={`flex flex-col lg:min-h-0 lg:min-w-0 lg:flex-1 ${fs ? "min-h-0 flex-1" : "shrink-0"}`}>
          <Stage
            viewers={show.viewers}
            caption={show.caption}
            fullscreen={fs}
            canFullscreen={fullscreen.supported}
            onToggleFullscreen={fullscreen.toggle}
            onShowChat={chatShown ? undefined : () => setChat(true)}
          >
            <ShowArt title={show.title} cover={show.cover} />
          </Stage>
          {!fs && <ShowInfo title={show.title} day={show.day} now={show.now} cast={show.cast} />}
        </main>

        <div
          inert={!chatShown}
          className={`flex min-h-0 overflow-hidden transition-[width,margin] duration-300 ease-out motion-reduce:transition-none lg:shrink-0 ${fs ? "max-lg:hidden" : "max-lg:flex-1"} ${chatWidth}`}
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
