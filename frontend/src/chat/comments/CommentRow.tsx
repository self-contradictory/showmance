import type { FC } from "react";
import { MessageRow } from "./MessageRow";
import type { ChatComment, CommentKind, CommentOf } from "./types";
import { VoteResultRow } from "./VoteResultRow";

// One row component per comment kind. To add a kind:
//   1. add its type to the ChatComment union in types.ts
//   2. write its row component
//   3. register it below (the build fails until you do)
const rows: { [K in CommentKind]: FC<{ comment: CommentOf<K> }> } = {
  message: MessageRow,
  vote_result: VoteResultRow,
};

export function CommentRow({ comment }: { comment: ChatComment }) {
  // A newer server may send kinds this build doesn't know yet. Skip them.
  const Row = rows[comment.kind] as FC<{ comment: ChatComment }> | undefined;
  return Row ? <Row comment={comment} /> : null;
}
