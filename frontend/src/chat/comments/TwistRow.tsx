import { EventRow } from "./EventRow";
import type { TwistComment } from "./types";

export function TwistRow({ comment }: { comment: TwistComment }) {
  return <EventRow title={comment.author ? `${comment.author} dropped a twist` : "Twist"}>{comment.twist}</EventRow>;
}
