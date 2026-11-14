import { reduceShow } from "./reduce";
import {
  MAX_MESSAGE_LENGTH,
  MAX_TWIST_LENGTH,
  type CastMember,
  type Feed,
  type FeedEvent,
  type Show,
} from "./types";

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

const TWIST_PRICE = 50;
const STARTING_COINS = 300;

const FAKE_VIEWERS = ["jess_k", "mike88", "tina", "sam_r", "dee", "carlos.v", "priya", "ben_t"];
const FAKE_MESSAGES = [
  "he's done lol",
  "NINA PLANNED THIS",
  "Chris deserves better",
  "leo is so shady",
  "mia is too good for him",
  "sara really is the wildcard",
  "this villa is chaos",
  "jake has no idea what's coming",
  "someone send the tempter",
  "I need a date like that",
  "the pool scene was everything",
  "who else is voting Chris",
];

const VOTES: { question: string; options: string[] }[] = [
  { question: "Who should Sara take on a date?", options: ["Chris", "Leo"] },
  { question: "Should Mia forgive Jake?", options: ["Forgive him", "Walk away"] },
  { question: "Who goes to the confession room?", options: ["Nina", "Leo", "Jake"] },
];

const LINE_MS = 3600;
const GAP_MS = 700;
const VOTE_MS = 75_000;
const BETWEEN_VOTES_MS = 20_000;

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function twistScene(twist: string): Scene {
  const first = pick(CAST);
  const second = pick(CAST.filter((member) => member !== first));
  return {
    now: `Twist: ${twist}`,
    lines: [
      [first.name, "Wait. Did everyone just see that?"],
      [second.name, "Nobody saw that coming."],
      [first.name, "This changes everything."],
    ],
  };
}

export function createMockFeed(): Feed {
  let state: Show = {
    title: "The Villa",
    day: 3,
    now: SCENES[0]!.now,
    cast: CAST,
    viewers: 412,
    caption: null,
    comments: [],
    vote: null,
    twistPrice: TWIST_PRICE,
    balance: STARTING_COINS,
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

  function postMessage(author: string, text: string) {
    emit({ type: "comment", comment: { kind: "message", id: nextId("comment"), at: Date.now(), author, text } });
  }

  function fakeChatter() {
    postMessage(pick(FAKE_VIEWERS), pick(FAKE_MESSAGES));
    later(1200 + Math.random() * 2800, fakeChatter);
  }

  let voteIndex = 0;

  function openVote() {
    const plan = VOTES[voteIndex++ % VOTES.length]!;
    emit({
      type: "vote",
      vote: {
        id: nextId("vote"),
        question: plan.question,
        options: plan.options.map((label, i) => ({ id: String(i), label, votes: 0 })),
        endsAt: Date.now() + VOTE_MS,
      },
    });
    later(900, fakeVotes);
    later(VOTE_MS, closeVote);
  }

  function addVotes(voteId: string, optionId: string, count: number) {
    const vote = state.vote;
    if (!vote || vote.id !== voteId || Date.now() >= vote.endsAt) return;
    const options = vote.options.map((o) => (o.id === optionId ? { ...o, votes: o.votes + count } : o));
    emit({ type: "vote", vote: { ...vote, options } });
  }

  function fakeVotes() {
    const vote = state.vote;
    if (!vote) return;
    const option = Math.random() < 0.6 ? vote.options[0]! : pick(vote.options);
    addVotes(vote.id, option.id, 1 + Math.floor(Math.random() * 3));
    later(700, fakeVotes);
  }

  function closeVote() {
    const vote = state.vote;
    if (!vote) return;
    const total = vote.options.reduce((sum, o) => sum + o.votes, 0);
    const winner = vote.options.reduce((best, o) => (o.votes > best.votes ? o : best));
    emit({ type: "vote", vote: null });
    emit({
      type: "comment",
      comment: {
        kind: "vote_result",
        id: nextId("comment"),
        at: Date.now(),
        question: vote.question,
        winner: winner.label,
        pct: total ? Math.round((winner.votes / total) * 100) : 0,
      },
    });
    later(BETWEEN_VOTES_MS, openVote);
  }

  function start() {
    later(800, playNextLine);
    later(5000, driftViewers);
    later(600, fakeChatter);
    later(1500, openVote);
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
    send(author, text) {
      const message = text.trim().slice(0, MAX_MESSAGE_LENGTH);
      if (message) postMessage(author, message);
    },
    vote(voteId, optionId) {
      addVotes(voteId, optionId, 1);
    },
    dropTwist(author, text) {
      const twist = text.trim().slice(0, MAX_TWIST_LENGTH);
      if (!twist || state.balance < TWIST_PRICE) return;
      emit({ type: "balance", balance: state.balance - TWIST_PRICE });
      emit({ type: "comment", comment: { kind: "twist", id: nextId("comment"), at: Date.now(), author, twist } });
      playScene(twistScene(twist));
    },
  };
}
