import { useEffect, useState } from "react";
import { createMockDirectory } from "./mockDirectory";
import type { ShowSummary } from "./types";

export function useShowList(): ShowSummary[] {
  const [directory] = useState(createMockDirectory);
  const [shows, setShows] = useState(() => directory.snapshot());

  useEffect(() => directory.subscribe(setShows), [directory]);

  return shows;
}
