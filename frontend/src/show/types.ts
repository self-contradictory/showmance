import type { ChatComment } from "@/chat/comments/types";

export const MAX_MESSAGE_LENGTH = 300;
export const MAX_TWIST_LENGTH = 140;

export type CastMember = { id: string; name: string; role: string };

export type Caption = { id: string; speaker: string; text: string };

export type VoteOption = { id: string; label: string; votes: number };

export type Vote = {
  id: string;
  question: string;
  options: VoteOption[];
  endsAt: number;
};

export type Show = {
  title: string;
  day: number;
  now: string;
  cast: CastMember[];
  viewers: number;
  caption: Caption | null;
  comments: ChatComment[];
  vote: Vote | null;
  twistIdeas: string[];
  twistPrice: number;
  balance: number;
};

export type FeedEvent =
  | { type: "caption"; caption: Caption | null }
  | { type: "now"; text: string }
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
