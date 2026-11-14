import type { FeedEvent, Show } from "./types";

const MAX_COMMENTS = 200;

export function reduceShow(show: Show, event: FeedEvent): Show {
  switch (event.type) {
    case "caption":
      return { ...show, caption: event.caption };
    case "now":
      return { ...show, now: event.text };
    case "move":
      return {
        ...show,
        cast: show.cast.map((member) =>
          member.id === event.castId ? { ...member, locationId: event.locationId } : member,
        ),
      };
    case "viewers":
      return { ...show, viewers: event.count };
    case "comment":
      return { ...show, comments: [...show.comments, event.comment].slice(-MAX_COMMENTS) };
    case "vote":
      return { ...show, vote: event.vote };
    case "balance":
      return { ...show, balance: event.balance };
  }
}
