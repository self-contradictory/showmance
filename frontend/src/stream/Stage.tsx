import { Maximize, Minimize, PanelRightOpen, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, type ReactNode } from "react";
import type { Caption } from "@/show/types";
import { StageButton } from "./StageButton";

type Props = {
  viewers: number;
  caption: Caption | null;
  fullscreen: boolean;
  canFullscreen: boolean;
  onToggleFullscreen: () => void;
  onShowChat?: () => void;
  children: ReactNode;
};

export function Stage({
  viewers,
  caption,
  fullscreen,
  canFullscreen,
  onToggleFullscreen,
  onShowChat,
  children,
}: Props) {
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [frozenCaption, setFrozenCaption] = useState<Caption | null>(null);
  const shownCaption = paused ? frozenCaption : caption;

  function togglePause() {
    if (!paused) setFrozenCaption(caption);
    setPaused(!paused);
  }

  return (
    <div
      onDoubleClick={canFullscreen ? onToggleFullscreen : undefined}
      className={`group relative w-full overflow-hidden bg-stage text-on-overlay ${fullscreen ? "min-h-0 flex-1" : "max-lg:aspect-video lg:min-h-0 lg:flex-1 lg:rounded-2xl"}`}
    >
      {children}

      <p className="absolute top-3 left-3 rounded-md bg-overlay px-2 py-1 text-xs font-medium tabular-nums">
        {viewers.toLocaleString("en-US")} watching
      </p>

      <AnimatePresence>
        {shownCaption && (
          <motion.p
            key={shownCaption.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute inset-x-0 bottom-16 mx-auto w-fit max-w-[70%] rounded-lg bg-overlay px-3 py-1.5 text-center text-sm leading-snug sm:text-lg"
          >
            <span className="font-semibold">{shownCaption.speaker}:</span> {shownCaption.text}
          </motion.p>
        )}
      </AnimatePresence>

      <div onDoubleClick={(event) => event.stopPropagation()}>
        <AnimatePresence>
          {paused && (
            <motion.button
              type="button"
              onClick={togglePause}
              aria-label="Play"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 grid place-items-center bg-stage/40"
            >
              <span className="grid size-16 place-items-center rounded-full bg-overlay backdrop-blur-md">
                <Play size={26} fill="currentColor" className="translate-x-0.5" />
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        {onShowChat && (
          <div className="absolute top-3 right-3">
            <StageButton label="Show chat" onClick={onShowChat}>
              <PanelRightOpen size={18} />
            </StageButton>
          </div>
        )}

        <div
          className={`absolute inset-x-3 bottom-3 flex items-center justify-between transition-opacity duration-200 ${paused ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100 pointer-coarse:opacity-100"}`}
        >
          <div className="flex items-center gap-2">
            <StageButton label={paused ? "Play" : "Pause"} onClick={togglePause}>
              {paused ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}
            </StageButton>
            <StageButton label={muted ? "Unmute" : "Mute"} onClick={() => setMuted(!muted)}>
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </StageButton>
          </div>
          {canFullscreen && (
            <StageButton label={fullscreen ? "Exit fullscreen" : "Fullscreen"} onClick={onToggleFullscreen}>
              {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </StageButton>
          )}
        </div>
      </div>
    </div>
  );
}
