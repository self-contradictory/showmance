import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { ChatComment } from "@/chat/comments/types";
import { api, ApiError } from "@/api/client";
import { TWIST_PRICE } from "@/api/config";
import { worldIdFromSlug } from "@/api/slug";
import type { ChatMessage, PollView, WorldEvent } from "@/api/types";
import { addToBeat, beatCaption, describeBeat, emptyBeat, type Beat } from "./beats";
import type { ShowHandle, ShowOptions } from "./handle";
import {
  actionsFor,
  castFor,
  chatComment,
  locationsFor,
  namesFor,
  skyFor,
  type LiveAction,
  type Names,
} from "./liveEvents";
import type { Show, Touching, Vote } from "./types";
import { useBeatQueue } from "./useBeatQueue";
import { useViewer } from "./useViewer";

const HISTORY_SIZE = 40;
const MAX_COMMENTS = 200;
const TWIST_CHECK_MS = 2000;
const TWIST_CHECKS = 30;
const WORLD_REFRESH_MS = 30_000;
const NO_TOUCHES: Touching[] = [];

type LiveState = { now: string; moved: Record<string, string>; comments: ChatComment[]; viewers?: number };

type LiveUpdate =
  | { type: "now"; text: string }
  | { type: "move"; castId: string; locationId: string }
  | { type: "comment"; comment: ChatComment }
  | { type: "viewers"; count: number };

function reduceLive(state: LiveState, update: LiveUpdate): LiveState {
  switch (update.type) {
    case "now":
      return { ...state, now: update.text };
    case "move":
      return { ...state, moved: { ...state.moved, [update.castId]: update.locationId } };
    case "comment":
      if (state.comments.some((comment) => comment.id === update.comment.id)) return state;
      return { ...state, comments: [...state.comments, update.comment].slice(-MAX_COMMENTS) };
    case "viewers":
      return { ...state, viewers: update.count };
  }
}

function useLatest<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}

export function useLiveShow(slug: string, { sound = false }: ShowOptions = {}): ShowHandle {
  const worldId = worldIdFromSlug(slug) ?? -1;
  const queryClient = useQueryClient();
  const viewer = useViewer();

  const world = useQuery({
    queryKey: ["world", worldId],
    queryFn: () => api.world(worldId),
    refetchInterval: WORLD_REFRESH_MS,
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 3,
  });
  const history = useQuery({
    queryKey: ["history", worldId],
    queryFn: () => api.events(worldId, HISTORY_SIZE),
    enabled: world.isSuccess,
    staleTime: Infinity,
    gcTime: 0,
  });
  const poll = useQuery({
    queryKey: ["poll", worldId],
    queryFn: () => api.poll(worldId),
    enabled: world.isSuccess,
    refetchInterval: 3000,
  });

  const [live, update] = useReducer(reduceLive, { now: "", moved: {}, comments: [] });
  const { beat, add } = useBeatQueue(sound, (started: Beat, shown: boolean) => {
    for (const move of started.moves) update({ type: "move", castId: move.castId, locationId: move.locationId });
    const text = shown ? describeBeat(started) : null;
    if (text) update({ type: "now", text });
  });
  const caption = useMemo(() => (beat ? beatCaption(beat) : null), [beat]);
  const [ballot, setBallot] = useState<{ pollId: string; optionId: string } | null>(null);
  const myTwists = useRef(new Set<number>());
  const mounted = useRef(true);

  const names = useMemo(() => (world.data ? namesFor(world.data.agents, world.data.locations) : null), [world.data]);
  const namesRef = useLatest<Names | null>(names);
  const pollRef = useLatest<PollView | null | undefined>(poll.data);
  const meRef = useLatest(viewer.data?.viewer.name);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  function notice(id: string, title: string, text: string) {
    update({ type: "comment", comment: { kind: "notice", id, at: Date.now(), title, text } });
  }

  useEffect(() => {
    if (!history.data) return;

    function apply(action: LiveAction, event: WorldEvent, replay: boolean) {
      const eventId = event.id;
      switch (action.type) {
        case "speech":
        case "touch":
        case "move":
        case "headline": {
          if (!replay) {
            add(event.tick, action);
            return;
          }
          const text = describeBeat(addToBeat(emptyBeat(event.tick), action));
          if (text) update({ type: "now", text });
          return;
        }
        case "twist":
          update({
            type: "comment",
            comment: {
              kind: "twist",
              id: `event-${eventId}`,
              at: Date.now(),
              author: action.twistId !== null && myTwists.current.has(action.twistId) ? meRef.current : undefined,
              twist: action.text,
            },
          });
          return;
        case "pollOpened":
          if (!replay) void queryClient.invalidateQueries({ queryKey: ["poll", worldId] });
          return;
        case "pollClosed": {
          const view = replay ? null : pollRef.current;
          const total = view ? view.votes.reduce((sum, count) => sum + count, 0) : 0;
          const winnerVotes = view && action.winnerIndex !== null ? (view.votes[action.winnerIndex] ?? 0) : 0;
          update({
            type: "comment",
            comment: {
              kind: "vote_result",
              id: `event-${eventId}`,
              at: Date.now(),
              question: view?.poll.question,
              winner: action.winner,
              pct: total ? Math.round((winnerVotes / total) * 100) : undefined,
            },
          });
          if (!replay) void queryClient.invalidateQueries({ queryKey: ["poll", worldId] });
          return;
        }
        case "pollCancelled":
          update({
            type: "comment",
            comment: {
              kind: "notice",
              id: `event-${eventId}`,
              at: Date.now(),
              title: "Vote cancelled",
              text: "A viewer paid to decide it.",
            },
          });
          if (!replay) void queryClient.invalidateQueries({ queryKey: ["poll", worldId] });
          return;
        case "castChanged":
          if (!replay) void queryClient.invalidateQueries({ queryKey: ["world", worldId] });
          return;
      }
    }

    function handle(event: WorldEvent, replay: boolean) {
      const current = namesRef.current;
      if (!current) return;
      for (const action of actionsFor(event, current)) apply(action, event, replay);
    }

    for (const event of history.data.slice(-HISTORY_SIZE)) handle(event, true);
    const source = new EventSource(api.streamUrl(worldId, history.data.at(-1)?.id ?? 0));
    source.onmessage = (message) => handle(JSON.parse(String(message.data)) as WorldEvent, false);
    source.addEventListener("chat", (message) =>
      update({ type: "comment", comment: chatComment(JSON.parse(String(message.data)) as ChatMessage) }),
    );
    source.addEventListener("viewers", (message) =>
      update({ type: "viewers", count: Number(JSON.parse(String(message.data))) }),
    );
    source.onopen = () => {
      api
        .chat(worldId)
        .then((messages) => {
          for (const message of messages) update({ type: "comment", comment: chatComment(message) });
        })
        .catch(() => {});
    };
    return () => source.close();
  }, [history.data, worldId, add, queryClient, namesRef, pollRef, meRef]);

  async function watchTwist(twistId: number) {
    for (let check = 0; check < TWIST_CHECKS && mounted.current; check++) {
      await new Promise((resolve) => setTimeout(resolve, TWIST_CHECK_MS));
      const twist = await api.twist(worldId, twistId).catch(() => null);
      if (!twist || twist.status === "pending") continue;
      if (twist.status === "rejected" && mounted.current) {
        notice(`rejected-${twistId}`, "Twist turned down", `${twist.outcome ?? "The producers passed on it."} Your coins are back.`);
        void queryClient.invalidateQueries({ queryKey: ["viewer"] });
      }
      return;
    }
  }

  const voteMutation = useMutation({
    mutationFn: ({ option, token }: { option: number; token: string }) => api.vote(worldId, option, token),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["poll", worldId] }),
  });

  const chatMutation = useMutation({
    mutationFn: ({ text, token }: { text: string; token: string }) => api.sendChat(worldId, text, token),
    onSuccess: (message) => update({ type: "comment", comment: chatComment(message) }),
    onError: () => notice(`chat-${Date.now()}`, "Message not sent", "Try again in a moment."),
  });

  const twistMutation = useMutation({
    mutationFn: ({ text, token }: { text: string; token: string }) => api.dropTwist(worldId, text, token),
    onSuccess: (twist) => {
      myTwists.current.add(twist.id);
      void watchTwist(twist.id);
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 402) {
        notice(`coins-${Date.now()}`, "Not enough coins", "You need more coins to drop a twist.");
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["viewer"] }),
  });

  const openPoll = poll.data?.poll.status === "open" ? poll.data : null;
  const vote: Vote | null = openPoll
    ? {
        id: String(openPoll.poll.id),
        question: openPoll.poll.question,
        options: openPoll.poll.options.map((option, i) => ({
          id: String(i),
          label: option.label,
          votes: openPoll.votes[i] ?? 0,
        })),
      }
    : null;
  const myVote = ballot && vote && ballot.pollId === vote.id ? ballot.optionId : null;

  const data = world.data;
  const show: Show = {
    slug,
    title: data?.world.name ?? "",
    day: data?.world.day,
    now: live.now || data?.world.setting || "",
    cover: data?.world.thumbnail_url ?? undefined,
    sky: skyFor(data?.world.setting ?? ""),
    home: data?.world.home ?? undefined,
    figures: data?.world.figures ?? undefined,
    locations: data ? locationsFor(data.locations) : [],
    cast: data ? castFor(data.agents, live.moved) : [],
    viewers: live.viewers ?? data?.viewers,
    caption,
    touches: beat?.touches ?? NO_TOUCHES,
    comments: live.comments,
    vote,
    twistPrice: TWIST_PRICE,
    balance: viewer.data?.viewer.coins ?? 0,
  };

  return {
    show,
    notFound: world.error instanceof ApiError && world.error.status === 404,
    myVote,
    send: (text) => {
      const token = viewer.data?.token;
      if (token) chatMutation.mutate({ text, token });
    },
    vote: (optionId) => {
      const token = viewer.data?.token;
      if (!vote || myVote || !token) return;
      setBallot({ pollId: vote.id, optionId });
      voteMutation.mutate({ option: Number(optionId), token });
    },
    dropTwist: (text) => {
      const token = viewer.data?.token;
      if (token) twistMutation.mutate({ text, token });
    },
  };
}
