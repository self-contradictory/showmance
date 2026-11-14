import { SHOWS, type ShowScript } from "./mockShows";
import type { Directory, ShowSummary } from "./types";

const TICK_MS = 4000;

type Entry = { script: ShowScript; scene: number; viewers: number };

function summarize({ script, scene, viewers }: Entry): ShowSummary {
  return {
    slug: script.slug,
    title: script.title,
    day: script.day,
    now: script.scenes[scene]?.now ?? "",
    viewers,
    cover: script.cover,
  };
}

export function createMockDirectory(): Directory {
  let entries: Entry[] = [...SHOWS]
    .sort((a, b) => b.viewers - a.viewers)
    .map((script) => ({ script, scene: 0, viewers: script.viewers }));
  let shows = entries.map(summarize);

  const listeners = new Set<(shows: ShowSummary[]) => void>();
  let timer: ReturnType<typeof setInterval> | undefined;

  function tick() {
    entries = entries.map((entry) => ({
      script: entry.script,
      viewers: Math.max(20, entry.viewers + Math.round((Math.random() - 0.4) * 6)),
      scene: Math.random() < 0.25 ? (entry.scene + 1) % entry.script.scenes.length : entry.scene,
    }));
    shows = entries.map(summarize);
    for (const listener of listeners) listener(shows);
  }

  return {
    snapshot: () => shows,
    subscribe(listener) {
      listeners.add(listener);
      if (listeners.size === 1) timer = setInterval(tick, TICK_MS);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) clearInterval(timer);
      };
    },
  };
}
