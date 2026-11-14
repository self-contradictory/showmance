import { useLayoutEffect, useRef, useState } from "react";
import { CommentRow } from "./comments/CommentRow";
import type { ChatComment } from "./comments/types";

// How close to the bottom still counts as "reading the latest".
const NEAR_BOTTOM_PX = 32;

export function Comments({ comments }: { comments: ChatComment[] }) {
  const listRef = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  const [hasUnseen, setHasUnseen] = useState(false);

  // Keep showing the newest comments unless the reader scrolled up.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    if (following.current) list.scrollTop = list.scrollHeight;
    else setHasUnseen(true);
  }, [comments]);

  function onScroll() {
    const list = listRef.current;
    if (!list) return;
    following.current = list.scrollHeight - list.scrollTop - list.clientHeight < NEAR_BOTTOM_PX;
    if (following.current) setHasUnseen(false);
  }

  function jumpToLatest() {
    const list = listRef.current;
    if (!list) return;
    list.scrollTop = list.scrollHeight;
    following.current = true;
    setHasUnseen(false);
  }

  return (
    <div className="relative min-h-0 flex-1">
      <div ref={listRef} onScroll={onScroll} role="log" className="scrollbar-thin h-full overflow-y-auto px-3 py-2">
        {comments.length === 0 ? (
          <p className="pt-6 text-center text-sm text-muted">No messages yet. Say hi.</p>
        ) : (
          comments.map((comment) => <CommentRow key={comment.id} comment={comment} />)
        )}
      </div>

      {hasUnseen && (
        <button
          type="button"
          onClick={jumpToLatest}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-surface px-3 py-1 text-xs font-medium ring-1 ring-line hover:ring-muted"
        >
          New messages
        </button>
      )}
    </div>
  );
}
