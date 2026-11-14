import { USE_BACKEND } from "@/api/config";
import { worldIdFromSlug } from "@/api/slug";
import { findShow } from "./mockShows";
import { useLiveShow } from "./useLiveShow";
import { useMockShow } from "./useMockShow";

export const useShow = USE_BACKEND ? useLiveShow : useMockShow;

export function isKnownShow(slug: string): boolean {
  return USE_BACKEND ? worldIdFromSlug(slug) !== null : findShow(slug) !== undefined;
}
