import { EventRow } from "./EventRow";
import type { VoteResultComment } from "./types";

export function VoteResultRow({ comment }: { comment: VoteResultComment }) {
  return (
    <EventRow title="Vote closed">
      {comment.question && `${comment.question} `}
      {comment.winner} won{comment.pct === undefined ? "" : ` with ${comment.pct}%`}.
    </EventRow>
  );
}
