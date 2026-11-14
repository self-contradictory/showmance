import { useCallback, useEffect, useRef, useState } from "react";
import type { Caption } from "./types";

const LINE_MS = 3600;
const GAP_MS = 400;
const MAX_LINE_MS = 20_000;
const MAX_BACKLOG = 3;

function loadClip(url: string): HTMLAudioElement {
  const clip = new Audio();
  clip.preload = "auto";
  clip.src = url;
  return clip;
}

export function useCaptionQueue(sound: boolean) {
  const [caption, setCaption] = useState<Caption | null>(null);
  const queue = useRef<Caption[]>([]);
  const clips = useRef(new Map<string, HTMLAudioElement>());
  const playing = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const finishLine = useRef<(() => void) | null>(null);
  const soundOn = useRef(sound);

  const playNext = useCallback(() => {
    const next = queue.current.shift();
    if (!next) {
      playing.current = false;
      return;
    }
    playing.current = true;
    setCaption(next);

    const clip = clips.current.get(next.id);
    clips.current.delete(next.id);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      finishLine.current = null;
      clearTimeout(timer.current);
      if (clip) {
        clip.onended = null;
        clip.onerror = null;
        clip.pause();
      }
      setCaption(null);
      timer.current = setTimeout(playNext, GAP_MS);
    };
    const fallBack = () => {
      clearTimeout(timer.current);
      timer.current = setTimeout(finish, LINE_MS);
    };
    finishLine.current = finish;

    if (clip && soundOn.current) {
      clip.onended = finish;
      clip.onerror = fallBack;
      timer.current = setTimeout(finish, MAX_LINE_MS);
      clip.play().catch(fallBack);
    } else {
      timer.current = setTimeout(finish, LINE_MS);
    }
  }, []);

  const push = useCallback(
    (line: Caption) => {
      if (line.audio && soundOn.current) clips.current.set(line.id, loadClip(line.audio));
      queue.current.push(line);
      while (queue.current.length > MAX_BACKLOG) {
        const dropped = queue.current.shift();
        if (dropped) clips.current.delete(dropped.id);
      }
      if (!playing.current) playNext();
    },
    [playNext],
  );

  useEffect(() => {
    soundOn.current = sound;
    if (!sound) finishLine.current?.();
  }, [sound]);

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      finishLine.current = null;
      for (const clip of clips.current.values()) clip.pause();
    },
    [],
  );

  return { caption, push };
}
