import type { Show } from "./types";

export type ShowOptions = { sound?: boolean };

export type ShowHandle = {
  show: Show;
  notFound: boolean;
  myVote: string | null;
  send: (text: string) => void;
  vote: (optionId: string) => void;
  dropTwist: (text: string) => void;
};
