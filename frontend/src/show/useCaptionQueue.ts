import { useCallback, useEffect, useRef, useState } from "react";
import type { Caption } from "./types";

const LINE_MS = 3600;
const GAP_MS = 400;
const MAX_BACKLOG = 3;

export function useCaptionQueue() {
  const [caption, setCaption] = useState<Caption | null>(null);
  const queue = useRef<Caption[]>([]);
  const playing = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const playNext = useCallback(() => {
    const next = queue.current.shift();
    if (!next) {
      playing.current = false;
      return;
    }
    playing.current = true;
    setCaption(next);
    timer.current = setTimeout(() => {
      setCaption(null);
      timer.current = setTimeout(playNext, GAP_MS);
    }, LINE_MS);
  }, []);

  const push = useCallback(
    (line: Caption) => {
      queue.current.push(line);
      if (queue.current.length > MAX_BACKLOG) queue.current.splice(0, queue.current.length - MAX_BACKLOG);
      if (!playing.current) playNext();
    },
    [playNext],
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  return { caption, push };
}
