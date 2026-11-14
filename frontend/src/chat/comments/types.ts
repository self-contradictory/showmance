type Base = { id: string; at: number };

export type MessageComment = Base & { kind: "message"; author: string; text: string };

export type TwistComment = Base & { kind: "twist"; author?: string; twist: string };

export type VoteResultComment = Base & {
  kind: "vote_result";
  question?: string;
  winner: string;
  pct?: number;
};

export type NoticeComment = Base & { kind: "notice"; title: string; text: string };

export type ChatComment = MessageComment | TwistComment | VoteResultComment | NoticeComment;

export type CommentKind = ChatComment["kind"];
export type CommentOf<K extends CommentKind> = Extract<ChatComment, { kind: K }>;
