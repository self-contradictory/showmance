import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Redirect } from "wouter";
import { Chat } from "@/chat/Chat";
import { useFullscreen } from "@/lib/useFullscreen";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { readStored, writeStored } from "@/lib/storage";
import { useShow } from "@/show/useShow";
import { ErrorBoundary } from "@/ui/ErrorBoundary";
import { Header } from "@/ui/Header";
import { ShowArt } from "@/ui/ShowArt";
import { ShowInfo } from "./ShowInfo";
import { Stage } from "./Stage";

const WorldScene = lazy(() => import("@/world/WorldScene"));

const CHAT_KEY = "showmance:chat";
const MUTED_KEY = "showmance:muted";

export function StreamPage({ slug }: { slug: string }) {
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(() => readStored(MUTED_KEY) === "muted");
  const { show, notFound, myVote, send, vote, dropTwist } = useShow(slug, { sound: !muted && !paused });
  const streamRef = useRef<HTMLDivElement>(null);
  const fullscreen = useFullscreen(streamRef);
  const isDesktop = useMediaQuery("(min-width: 64rem)");
  const [chatOpen, setChatOpen] = useState(() => readStored(CHAT_KEY) !== "hidden");
  const chatShown = chatOpen || !isDesktop;
  const fs = fullscreen.isFullscreen;

  useEffect(() => {
    document.title = show.title ? `${show.title} | Showmance` : "Showmance";
  }, [show.title]);

  function toggleMute() {
    setMuted(!muted);
    writeStored(MUTED_KEY, muted ? "sound" : "muted");
  }

  function setChat(open: boolean) {
    setChatOpen(open);
    writeStored(CHAT_KEY, open ? "shown" : "hidden");
  }

  if (notFound) return <Redirect to="/" replace />;

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
            paused={paused}
            muted={muted}
            fullscreen={fs}
            canFullscreen={fullscreen.supported}
            onTogglePause={() => setPaused(!paused)}
            onToggleMute={toggleMute}
            onToggleFullscreen={fullscreen.toggle}
            onShowChat={chatShown ? undefined : () => setChat(true)}
          >
            <ErrorBoundary fallback={<ShowArt title={show.title} cover={show.cover} />}>
              <Suspense fallback={<ShowArt title={show.title} cover={show.cover} />}>
                <WorldScene show={show} paused={paused} />
              </Suspense>
            </ErrorBoundary>
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
