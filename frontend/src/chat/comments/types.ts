type Base = { id: string; at: number };

export type MessageComment = Base & { kind: "message"; author: string; text: string };

/** Every kind of row the chat can show. To add a kind, see CommentRow.tsx. */
export type ChatComment = MessageComment;

export type CommentKind = ChatComment["kind"];
export type CommentOf<K extends CommentKind> = Extract<ChatComment, { kind: K }>;
