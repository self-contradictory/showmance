type Base = { id: string; at: number };

export type MessageComment = Base & { kind: "message"; author: string; text: string };

export type TwistComment = Base & { kind: "twist"; author: string; twist: string };

export type VoteResultComment = Base & {
  kind: "vote_result";
  question: string;
  winner: string;
  pct: number;
};

/** Every kind of row the chat can show. To add a kind, see CommentRow.tsx. */
export type ChatComment = MessageComment | TwistComment | VoteResultComment;

export type CommentKind = ChatComment["kind"];
export type CommentOf<K extends CommentKind> = Extract<ChatComment, { kind: K }>;
