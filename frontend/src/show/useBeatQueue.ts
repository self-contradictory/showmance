import { useCallback, useEffect, useRef, useState } from "react";
import { API_HEADERS } from "@/api/config";
import { addToBeat, emptyBeat, fitsBeat, type Beat, type BeatPart } from "./beats";

const LINE_MS = 3600;
const STILL_MS = 1600;
const GAP_MS = 400;
const MAX_LINE_MS = 20_000;
const MAX_BACKLOG = 3;
const GATHER_MS = 250;

type Timer = ReturnType<typeof setTimeout> | undefined;

type Clip = { audio: HTMLAudioElement; ready: Promise<void>; release: () => void };

function loadClip(url: string): Clip {
  const audio = new Audio();
  audio.preload = "auto";
  let released = false;
  let objectUrl: string | null = null;
  const ready = fetch(url, { headers: API_HEADERS })
    .then((response) => {
      if (!response.ok) throw new Error(`voice answered ${response.status}`);
      return response.blob();
    })
    .then((blob) => {
      if (released) return;
      objectUrl = URL.createObjectURL(blob);
      audio.src = objectUrl;
    });
  ready.catch(() => {});
  return {
    audio,
    ready,
    release: () => {
      released = true;
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    },
  };
}

export function useBeatQueue(sound: boolean, onBeat: (beat: Beat, shown: boolean) => void) {
  const [beat, setBeat] = useState<Beat | null>(null);
  const gathering = useRef<Beat | null>(null);
  const gatherTimer = useRef<Timer>(undefined);
  const queue = useRef<Beat[]>([]);
  const clips = useRef(new Map<string, Clip>());
  const playing = useRef(false);
  const timer = useRef<Timer>(undefined);
  const finishBeat = useRef<(() => void) | null>(null);
  const soundOn = useRef(sound);
  const started = useRef(onBeat);

  useEffect(() => {
    started.current = onBeat;
  });

  const playNext = useCallback(() => {
    const next = queue.current.shift();
    if (!next) {
      playing.current = false;
      return;
    }
    playing.current = true;
    started.current(next, true);
    setBeat(next);

    const speech = next.speech;
    const clip = speech ? clips.current.get(speech.id) : undefined;
    if (speech) clips.current.delete(speech.id);
    const hold = speech || next.touches.length ? LINE_MS : STILL_MS;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      finishBeat.current = null;
      clearTimeout(timer.current);
      clip?.release();
      setBeat(null);
      timer.current = setTimeout(playNext, GAP_MS);
    };
    const fallBack = () => {
      clearTimeout(timer.current);
      timer.current = setTimeout(finish, hold);
    };
    finishBeat.current = finish;

    if (clip && soundOn.current) {
      clip.audio.onended = finish;
      clip.audio.onerror = fallBack;
      timer.current = setTimeout(finish, MAX_LINE_MS);
      clip.ready
        .then(() => (done || !soundOn.current ? undefined : clip.audio.play()))
        .catch(fallBack);
    } else {
      timer.current = setTimeout(finish, hold);
    }
  }, []);

  const enqueue = useCallback(
    (next: Beat) => {
      if (next.speech?.audio && soundOn.current) clips.current.set(next.speech.id, loadClip(next.speech.audio));
      queue.current.push(next);
      while (queue.current.length > MAX_BACKLOG) {
        const dropped = queue.current.shift();
        if (!dropped) break;
        if (dropped.speech) {
          clips.current.get(dropped.speech.id)?.release();
          clips.current.delete(dropped.speech.id);
        }
        started.current(dropped, false);
      }
      if (!playing.current) playNext();
    },
    [playNext],
  );

  const flush = useCallback(() => {
    clearTimeout(gatherTimer.current);
    const gathered = gathering.current;
    gathering.current = null;
    if (gathered) enqueue(gathered);
  }, [enqueue]);

  const add = useCallback(
    (tick: number, part: BeatPart) => {
      if (gathering.current && !fitsBeat(gathering.current, tick, part)) flush();
      gathering.current = addToBeat(gathering.current ?? emptyBeat(tick), part);
      clearTimeout(gatherTimer.current);
      gatherTimer.current = setTimeout(flush, GATHER_MS);
    },
    [flush],
  );

  useEffect(() => {
    soundOn.current = sound;
    if (!sound) {
      finishBeat.current?.();
      return;
    }
    for (const queued of queue.current) {
      const speech = queued.speech;
      if (speech?.audio && !clips.current.has(speech.id)) clips.current.set(speech.id, loadClip(speech.audio));
    }
  }, [sound]);

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      clearTimeout(gatherTimer.current);
      finishBeat.current = null;
      for (const clip of clips.current.values()) clip.release();
    },
    [],
  );

  return { beat, add };
}
