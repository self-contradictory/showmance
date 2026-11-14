import { useEffect, useReducer, useState } from "react";
import { readStored, writeStored } from "@/lib/storage";
import { createMockFeed } from "./mockFeed";
import { reduceShow } from "./reduce";

const NAME_KEY = "showmance:name";

function loadGuestName(): string {
  const saved = readStored(NAME_KEY);
  if (saved) return saved;
  const fresh = `guest_${Math.floor(1000 + Math.random() * 9000)}`;
  writeStored(NAME_KEY, fresh);
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
    dropTwist: (text: string) => feed.dropTwist(me, text),
  };
}
