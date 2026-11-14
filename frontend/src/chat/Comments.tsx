import { ArrowDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";
import { CommentRow } from "./comments/CommentRow";
import type { ChatComment } from "./comments/types";

const NEAR_BOTTOM_PX = 32;

export function Comments({ comments }: { comments: ChatComment[] }) {
  const listRef = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  const [hasUnseen, setHasUnseen] = useState(false);

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
      <div ref={listRef} onScroll={onScroll} role="log" className="scrollbar-thin fade-top h-full overflow-y-auto py-2">
        {comments.length === 0 ? (
          <p className="pt-6 text-center text-sm text-muted">No messages yet. Say hi.</p>
        ) : (
          comments.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <CommentRow comment={comment} />
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {hasUnseen && (
          <motion.button
            type="button"
            onClick={jumpToLatest}
            initial={{ opacity: 0, y: 6, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 6, x: "-50%" }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-3 left-1/2 flex items-center gap-1 rounded-full bg-ink py-1 pr-3 pl-2 text-xs font-medium text-page hover:opacity-90"
          >
            <ArrowDown size={14} />
            New messages
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
