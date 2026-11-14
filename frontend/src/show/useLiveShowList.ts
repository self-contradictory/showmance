import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { api } from "@/api/client";
import { worldSlug } from "@/api/slug";
import type { ShowSummary } from "./types";

export function useLiveShowList(): ShowSummary[] | undefined {
  const { data } = useQuery({ queryKey: ["worlds"], queryFn: api.worlds, refetchInterval: 10_000 });

  return useMemo(
    () =>
      data?.map(({ world }) => ({
        slug: worldSlug(world),
        title: world.name,
        now: world.setting,
        cover: world.thumbnail_url ?? undefined,
      })),
    [data],
  );
}
