import type { MessageComment } from "./types";

export function MessageRow({ comment }: { comment: MessageComment }) {
  return (
    <p className="px-1 py-0.5 text-sm leading-5 break-words">
      <span className="font-semibold text-muted">{comment.author}</span> {comment.text}
    </p>
  );
}
