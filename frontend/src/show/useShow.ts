import { useEffect, useReducer, useState } from "react";
import { createMockFeed } from "./mockFeed";
import { reduceShow } from "./reduce";

const NAME_KEY = "showmance:name";

/** A guest name like guest_4821, kept in this browser so it stays the same. */
function loadGuestName(): string {
  const fresh = `guest_${Math.floor(1000 + Math.random() * 9000)}`;
  try {
    const saved = localStorage.getItem(NAME_KEY);
    if (saved) return saved;
    localStorage.setItem(NAME_KEY, fresh);
  } catch {
    // Storage is blocked. Use a new name for this visit.
  }
  return fresh;
}

/** Connects to the show feed and keeps the page state in sync with it. */
export function useShow() {
  const [feed] = useState(createMockFeed);
  const [me] = useState(loadGuestName);
  const [show, dispatch] = useReducer(reduceShow, feed, (f) => f.snapshot());
  const [ballot, setBallot] = useState<{ voteId: string; optionId: string } | null>(null);

  useEffect(() => feed.subscribe(dispatch), [feed]);

  const openVote = show.vote;
  const myVote = ballot && ballot.voteId === openVote?.id ? ballot.optionId : null;

  return {
    show,
    myVote,
    send: (text: string) => feed.send(me, text),
    vote: (optionId: string) => {
      if (!openVote || myVote) return;
      setBallot({ voteId: openVote.id, optionId });
      feed.vote(openVote.id, optionId);
    },
  };
}
