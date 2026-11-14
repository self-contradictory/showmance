import { Maximize, Minimize } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Caption } from "@/show/types";

type Props = {
  viewers: number;
  caption: Caption | null;
  children: ReactNode;
};

const canFullscreen = typeof document !== "undefined" && document.fullscreenEnabled;

export function Stage({ viewers, caption, children }: Props) {
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
      className="group relative w-full overflow-hidden bg-stage text-on-overlay max-lg:aspect-video lg:min-h-0 lg:flex-1 lg:rounded-2xl [&:fullscreen]:rounded-none"
    >
      {children}

      <p className="absolute top-3 left-3 rounded-md bg-overlay px-2 py-1 text-xs font-medium tabular-nums">
        {viewers.toLocaleString("en-US")} watching
      </p>

      {caption && (
        <p
          key={caption.id}
          className="absolute inset-x-0 bottom-[8%] mx-auto w-fit max-w-[70%] rounded-lg bg-overlay px-3 py-1.5 text-center text-sm leading-snug motion-safe:animate-fade-in sm:text-lg"
        >
          <span className="font-semibold">{caption.speaker}:</span> {caption.text}
        </p>
      )}

      {canFullscreen && (
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          className="absolute right-3 bottom-3 grid size-9 place-items-center rounded-lg bg-overlay transition-opacity group-hover:opacity-100 focus-visible:opacity-100 lg:opacity-0"
        >
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
      )}
    </div>
  );
}
