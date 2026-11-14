import type { FeedEvent, Show } from "./types";

export function reduceShow(show: Show, event: FeedEvent): Show {
  switch (event.type) {
    case "caption":
      return { ...show, caption: event.caption };
    case "now":
      return { ...show, now: event.text };
    case "viewers":
      return { ...show, viewers: event.count };
  }
}
