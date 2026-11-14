import type { FeedEvent, Show } from "./types";

// Chat keeps only the latest comments so the page stays light.
const MAX_COMMENTS = 200;

export function reduceShow(show: Show, event: FeedEvent): Show {
  switch (event.type) {
    case "caption":
      return { ...show, caption: event.caption };
    case "now":
      return { ...show, now: event.text };
    case "viewers":
      return { ...show, viewers: event.count };
    case "comment":
      return { ...show, comments: [...show.comments, event.comment].slice(-MAX_COMMENTS) };
  }
}
