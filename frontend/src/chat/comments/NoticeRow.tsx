import { EventRow } from "./EventRow";
import type { NoticeComment } from "./types";

export function NoticeRow({ comment }: { comment: NoticeComment }) {
  return <EventRow title={comment.title}>{comment.text}</EventRow>;
}
