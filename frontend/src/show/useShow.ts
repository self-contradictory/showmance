import { useEffect, useReducer, useState } from "react";
import { createMockFeed } from "./mockFeed";
import { reduceShow } from "./reduce";

/** Connects to the show feed and keeps the page state in sync with it. */
export function useShow() {
  const [feed] = useState(createMockFeed);
  const [show, dispatch] = useReducer(reduceShow, feed, (f) => f.snapshot());

  useEffect(() => feed.subscribe(dispatch), [feed]);

  return { show };
}
