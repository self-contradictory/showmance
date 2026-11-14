import { FAKE_VIEWERS, findShow, type Scene, type ShowScript } from "./mockShows";
import { reduceShow } from "./reduce";
import { MAX_MESSAGE_LENGTH, MAX_TWIST_LENGTH, type Feed, type FeedEvent, type Show } from "./types";

const TWIST_PRICE = 50;
const STARTING_COINS = 300;

const LINE_MS = 3600;
const GAP_MS = 700;
const VOTE_MS = 75_000;
const BETWEEN_VOTES_MS = 20_000;

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function twistScene(script: ShowScript, twist: string): Scene {
  const first = pick(script.cast);
  const second = pick(script.cast.filter((member) => member !== first));
  return {
    now: `Twist: ${twist}`,
    lines: [
      [first.name, "Wait. Did everyone just see that?"],
      [second.name, "Nobody saw that coming."],
      [first.name, "This changes everything."],
    ],
  };
}

export function createMockFeed(slug: string): Feed {
  const found = findShow(slug);
  if (!found) throw new Error(`Unknown show: ${slug}`);
  const script: ShowScript = found;

  let state: Show = {
    slug: script.slug,
    title: script.title,
    day: script.day,
    now: script.scenes[0]!.now,
    cover: script.cover,
    cast: script.cast,
    viewers: script.viewers,
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
    if (queue.length === 0) playScene(script.scenes[sceneIndex++ % script.scenes.length]!);
    const [speaker, text] = queue.shift()!;
    emit({ type: "caption", caption: { id: nextId("line"), speaker, text } });
    later(LINE_MS, () => {
      emit({ type: "caption", caption: null });
      later(GAP_MS, playNextLine);
    });
  }

  function driftViewers() {
    const change = Math.round((Math.random() - 0.4) * 8);
    emit({ type: "viewers", count: Math.max(20, state.viewers + change) });
    later(5000, driftViewers);
  }

  function postMessage(author: string, text: string) {
    emit({ type: "comment", comment: { kind: "message", id: nextId("comment"), at: Date.now(), author, text } });
  }

  function fakeChatter() {
    postMessage(pick(FAKE_VIEWERS), pick(script.chatter));
    later(1200 + Math.random() * 2800, fakeChatter);
  }

  let voteIndex = 0;

  function openVote() {
    const plan = script.votes[voteIndex++ % script.votes.length]!;
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
    later(300, playNextLine);
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
      playScene(twistScene(script, twist));
    },
  };
}
