import { useRef, type ReactNode } from "react";
import type { Caption } from "@/show/types";
import { FullscreenIcon } from "@/ui/icons";

type Props = {
  viewers: number;
  caption: Caption | null;
  /** What plays in the frame: the villa placeholder now, the 3D scene later. */
  children: ReactNode;
};

const canFullscreen = typeof document !== "undefined" && document.fullscreenEnabled;

export function Stage({ viewers, caption, children }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);

  function toggleFullscreen() {
    if (!canFullscreen) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void frameRef.current?.requestFullscreen();
  }

  return (
    // On desktop the frame is the largest 16:9 box that fits, so the rows
    // under it always stay on screen.
    <div className="bg-stage lg:flex lg:min-h-0 lg:flex-1 lg:items-center lg:justify-center lg:[container-type:size]">
      <div
        ref={frameRef}
        onDoubleClick={toggleFullscreen}
        className="group relative aspect-video w-full overflow-hidden bg-stage text-on-overlay lg:w-[min(100cqw,calc(100cqh*16/9))]"
      >
        {children}

        <div className="absolute top-3 left-3 flex items-center gap-2 text-xs font-medium">
          <span className="flex items-center gap-1.5 rounded bg-overlay px-2 py-1">
            <span className="size-2 rounded-full bg-accent" aria-hidden />
            Live
          </span>
          <span className="rounded bg-overlay px-2 py-1 tabular-nums opacity-80">
            {viewers.toLocaleString("en-US")} watching
          </span>
        </div>

        {caption && (
          <p
            key={caption.id}
            className="absolute inset-x-0 bottom-[8%] mx-auto w-fit max-w-[70%] rounded-md bg-overlay px-3 py-1.5 text-center text-sm leading-snug motion-safe:animate-fade-in sm:text-lg"
          >
            <span className="font-semibold">{caption.speaker}:</span> {caption.text}
          </p>
        )}

        {canFullscreen && (
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label="Fullscreen"
            className="absolute right-3 bottom-3 grid size-9 place-items-center rounded-md bg-overlay transition-opacity group-hover:opacity-100 focus-visible:opacity-100 lg:opacity-0"
          >
            <FullscreenIcon />
          </button>
        )}
      </div>
    </div>
  );
}
