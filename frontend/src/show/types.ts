import type { ChatComment } from "@/chat/comments/types";

export const MAX_MESSAGE_LENGTH = 300;
export const MAX_TWIST_LENGTH = 140;

export type Location = { id: string; name: string };

export type Sky = "day" | "sunset" | "night" | "snow";

export type CastMember = { id: string; name: string; role: string; locationId: string; portrait?: string };

export type Touch = "hug" | "kiss";

export type Caption = {
  id: string;
  speakerId: string;
  speaker: string;
  text: string;
  locationId: string;
  targetId?: string;
  audio?: string;
  touch?: Touch;
};

export type VoteOption = { id: string; label: string; votes: number };

export type Vote = {
  id: string;
  question: string;
  options: VoteOption[];
  endsAt?: number;
};

export type Show = {
  slug: string;
  title: string;
  day?: number;
  now: string;
  cover?: string;
  sky: Sky;
  locations: Location[];
  cast: CastMember[];
  viewers?: number;
  caption: Caption | null;
  comments: ChatComment[];
  vote: Vote | null;
  twistPrice: number;
  balance: number;
};

export type ShowSummary = {
  slug: string;
  title: string;
  day?: number;
  now: string;
  viewers?: number;
  cover?: string;
};

export type Directory = {
  snapshot(): ShowSummary[];
  subscribe(listener: (shows: ShowSummary[]) => void): () => void;
};

export type FeedEvent =
  | { type: "caption"; caption: Caption | null }
  | { type: "now"; text: string }
  | { type: "move"; castId: string; locationId: string }
  | { type: "viewers"; count: number }
  | { type: "comment"; comment: ChatComment }
  | { type: "vote"; vote: Vote | null }
  | { type: "balance"; balance: number };

export type Feed = {
  snapshot(): Show;
  subscribe(listener: (event: FeedEvent) => void): () => void;
  send(author: string, text: string): void;
  vote(voteId: string, optionId: string): void;
  dropTwist(author: string, text: string): void;
};
