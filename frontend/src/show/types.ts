import type { ChatComment } from "@/chat/comments/types";

export const MAX_MESSAGE_LENGTH = 300;

export type CastMember = { id: string; name: string; role: string };

/** The line being spoken on screen right now. */
export type Caption = { id: string; speaker: string; text: string };

export type VoteOption = { id: string; label: string; votes: number };

/** The open audience vote. Free for everyone, one vote per viewer. */
export type Vote = {
  id: string;
  question: string;
  options: VoteOption[];
  /** When voting closes, in ms since epoch. */
  endsAt: number;
};

/** A paid event a viewer can drop into the story. Price is in coins. */
export type Twist = { id: string; label: string; price: number };

/** Everything the stream page shows. */
export type Show = {
  title: string;
  day: number;
  /** One line on what is happening in the villa right now. */
  now: string;
  cast: CastMember[];
  viewers: number;
  caption: Caption | null;
  comments: ChatComment[];
  vote: Vote | null;
  twists: Twist[];
  /** This viewer's coins. The server sends it to each viewer separately. */
  balance: number;
};

/** What the server pushes. Page state is these events folded together. */
export type FeedEvent =
  | { type: "caption"; caption: Caption | null }
  | { type: "now"; text: string }
  | { type: "viewers"; count: number }
  | { type: "comment"; comment: ChatComment }
  | { type: "vote"; vote: Vote | null }
  | { type: "balance"; balance: number };

/** A live connection to one show. Mocked for now, a WebSocket later. */
export type Feed = {
  snapshot(): Show;
  subscribe(listener: (event: FeedEvent) => void): () => void;
  send(author: string, text: string): void;
  vote(voteId: string, optionId: string): void;
  buyTwist(author: string, twistId: string): void;
};
