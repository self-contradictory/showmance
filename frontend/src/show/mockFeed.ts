import { reduceShow } from "./reduce";
import type { CastMember, Feed, FeedEvent, Show } from "./types";

// Stands in for the backend so the page can be built without a server.
// It plays scripted scenes through the same Feed interface a WebSocket
// feed will implement.

const CAST: CastMember[] = [
  { id: "mia", name: "Mia", role: "The planner" },
  { id: "jake", name: "Jake", role: "The charmer" },
  { id: "sara", name: "Sara", role: "The wildcard" },
  { id: "chris", name: "Chris", role: "The newcomer" },
  { id: "leo", name: "Leo", role: "The strategist" },
  { id: "nina", name: "Nina", role: "The queen bee" },
];

type Scene = { now: string; lines: [speaker: string, text: string][] };

const SCENES: Scene[] = [
  {
    now: "Mia and Jake are talking by the pool",
    lines: [
      ["Mia", "Do you ever think about what happens after this?"],
      ["Jake", "All the time. With you."],
      ["Mia", "That's a very good answer."],
      ["Jake", "I've been practicing."],
    ],
  },
  {
    now: "Leo and Nina are making plans in the kitchen",
    lines: [
      ["Leo", "If Chris stays another week, we're in trouble."],
      ["Nina", "Then we make sure he doesn't."],
      ["Leo", "Quietly."],
      ["Nina", "I'm always quiet."],
    ],
  },
  {
    now: "Chris is working up the nerve to talk to Sara",
    lines: [
      ["Chris", "Sara, got a second?"],
      ["Sara", "For you? Maybe two."],
      ["Chris", "I wanted to ask you something."],
      ["Sara", "Then ask."],
    ],
  },
  {
    now: "Sara can't stop thinking about the kiss",
    lines: [
      ["Sara", "I shouldn't have done that."],
      ["Sara", "Jake is with Mia. Everyone knows that."],
      ["Sara", "But I'd do it again."],
    ],
  },
];

const LINE_MS = 3600;
const GAP_MS = 700;

export function createMockFeed(): Feed {
  let state: Show = {
    title: "The Villa",
    day: 3,
    now: SCENES[0]!.now,
    cast: CAST,
    viewers: 412,
    caption: null,
  };

  const listeners = new Set<(event: FeedEvent) => void>();
  const timers = new Set<ReturnType<typeof setTimeout>>();
  let seq = 0;
  const nextId = (prefix: string) => `${prefix}-${++seq}`;

  function emit(event: FeedEvent) {
    state = reduceShow(state, event);
    for (const listener of listeners) listener(event);
  }

  function later(ms: number, fn: () => void) {
    const timer = setTimeout(() => {
      timers.delete(timer);
      fn();
    }, ms);
    timers.add(timer);
  }

  // Scenes: one caption at a time, with a short gap between lines.
  let queue: Scene["lines"] = [];
  let sceneIndex = 0;

  function playScene(scene: Scene) {
    queue = [...scene.lines];
    emit({ type: "now", text: scene.now });
  }

  function playNextLine() {
    if (queue.length === 0) playScene(SCENES[sceneIndex++ % SCENES.length]!);
    const [speaker, text] = queue.shift()!;
    emit({ type: "caption", caption: { id: nextId("line"), speaker, text } });
    later(LINE_MS, () => {
      emit({ type: "caption", caption: null });
      later(GAP_MS, playNextLine);
    });
  }

  function driftViewers() {
    const change = Math.round((Math.random() - 0.4) * 8);
    emit({ type: "viewers", count: Math.max(300, state.viewers + change) });
    later(5000, driftViewers);
  }

  function start() {
    later(800, playNextLine);
    later(5000, driftViewers);
  }

  function stop() {
    for (const timer of timers) clearTimeout(timer);
    timers.clear();
  }

  return {
    snapshot: () => state,
    subscribe(listener) {
      listeners.add(listener);
      if (listeners.size === 1) start();
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) stop();
      };
    },
  };
}
