import type { Gender } from "@/show/types";
import ch02Url from "./models/ch02.glb";
import remyUrl from "./models/remy.glb";

const FIGURES: Record<Gender, string> = { female: ch02Url, male: remyUrl };

/** The rigged character model for someone in a world drawn with realistic people. */
export function figureFor(gender: Gender | undefined, index: number): string {
  return FIGURES[gender ?? (index % 2 ? "male" : "female")];
}
