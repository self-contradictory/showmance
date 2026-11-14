import { useEffect, useReducer, useState } from "react";
import { loadGuestName } from "@/lib/guestName";
import type { ShowHandle } from "./handle";
import { createMockFeed } from "./mockFeed";
import { reduceShow } from "./reduce";

export function useMockShow(slug: string): ShowHandle {
  const [feed] = useState(() => createMockFeed(slug));
  const [me] = useState(loadGuestName);
  const [show, dispatch] = useReducer(reduceShow, feed, (f) => f.snapshot());
  const [ballot, setBallot] = useState<{ voteId: string; optionId: string } | null>(null);

  useEffect(() => feed.subscribe(dispatch), [feed]);

  const openVote = show.vote;
  const myVote = ballot && ballot.voteId === openVote?.id ? ballot.optionId : null;

  return {
    show,
    notFound: false,
    myVote,
    send: (text) => feed.send(me, text),
    vote: (optionId) => {
      if (!openVote || myVote) return;
      setBallot({ voteId: openVote.id, optionId });
      feed.vote(openVote.id, optionId);
    },
    dropTwist: (text) => feed.dropTwist(me, text),
  };
}
