import type { FC } from "react";
import { MessageRow } from "./MessageRow";
import { TwistRow } from "./TwistRow";
import type { ChatComment, CommentKind, CommentOf } from "./types";
import { VoteResultRow } from "./VoteResultRow";

const rows: { [K in CommentKind]: FC<{ comment: CommentOf<K> }> } = {
  message: MessageRow,
  twist: TwistRow,
  vote_result: VoteResultRow,
};

export function CommentRow({ comment }: { comment: ChatComment }) {
  const Row = rows[comment.kind] as FC<{ comment: ChatComment }> | undefined;
  return Row ? <Row comment={comment} /> : null;
}
