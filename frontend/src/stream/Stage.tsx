import { Maximize, Minimize, PanelRightOpen } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Caption } from "@/show/types";
import { StageButton } from "./StageButton";

type Props = {
  viewers: number;
  caption: Caption | null;
  onShowChat?: () => void;
  children: ReactNode;
};

const canFullscreen = typeof document !== "undefined" && document.fullscreenEnabled;

export function Stage({ viewers, caption, onShowChat, children }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === frameRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function toggleFullscreen() {
    if (!canFullscreen) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void frameRef.current?.requestFullscreen();
  }

  return (
    <div
      ref={frameRef}
      onDoubleClick={toggleFullscreen}
      className="relative w-full overflow-hidden bg-stage text-on-overlay max-lg:aspect-video lg:min-h-0 lg:flex-1 lg:rounded-2xl [&:fullscreen]:rounded-none"
    >
      {children}

      <p className="absolute top-3 left-3 rounded-md bg-overlay px-2 py-1 text-xs font-medium tabular-nums">
        {viewers.toLocaleString("en-US")} watching
      </p>

      <AnimatePresence>
        {caption && (
          <motion.p
            key={caption.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute inset-x-0 bottom-[8%] mx-auto w-fit max-w-[70%] rounded-lg bg-overlay px-3 py-1.5 text-center text-sm leading-snug sm:text-lg"
          >
            <span className="font-semibold">{caption.speaker}:</span> {caption.text}
          </motion.p>
        )}
      </AnimatePresence>

      <div onDoubleClick={(event) => event.stopPropagation()}>
        {onShowChat && !isFullscreen && (
          <div className="absolute top-3 right-3">
            <StageButton label="Show chat" onClick={onShowChat}>
              <PanelRightOpen size={18} />
            </StageButton>
          </div>
        )}

        {canFullscreen && (
          <div className="absolute right-3 bottom-3">
            <StageButton label={isFullscreen ? "Exit fullscreen" : "Fullscreen"} onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </StageButton>
          </div>
        )}
      </div>
    </div>
  );
}
