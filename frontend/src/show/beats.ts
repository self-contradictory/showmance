import type { Caption, Touching } from "./types";

export type Moved = { castId: string; name: string; locationId: string; place: string };

export type Beat = {
  tick: number;
  speech: Caption | null;
  touches: Touching[];
  moves: Moved[];
  headline: string | null;
};

export type BeatPart =
  | { type: "speech"; caption: Caption }
  | { type: "touch"; touching: Touching }
  | { type: "move"; move: Moved }
  | { type: "headline"; text: string };

const names = new Intl.ListFormat("en", { type: "conjunction" });

export function emptyBeat(tick: number): Beat {
  return { tick, speech: null, touches: [], moves: [], headline: null };
}

export function fitsBeat(beat: Beat, tick: number, part: BeatPart): boolean {
  return beat.tick === tick && !(part.type === "speech" && beat.speech);
}

export function addToBeat(beat: Beat, part: BeatPart): Beat {
  switch (part.type) {
    case "speech":
      beat.speech = part.caption;
      break;
    case "touch":
      beat.touches.push(part.touching);
      break;
    case "move":
      beat.moves.push(part.move);
      break;
    case "headline":
      beat.headline = part.text;
      break;
  }
  return beat;
}

function touchText(touching: Touching): string {
  return `${touching.kind === "hug" ? "hugs" : "kisses"} ${touching.target}`;
}

export function describeBeat(beat: Beat): string | null {
  if (beat.headline) return beat.headline;
  const phrases = beat.touches.map((touching) => `${touching.actor} ${touchText(touching)}`);
  const movers = Map.groupBy(beat.moves, (move) => move.place);
  for (const [place, moves] of movers) {
    phrases.push(`${names.format(moves.map((move) => move.name))} ${moves.length > 1 ? "head" : "heads"} to the ${place}`);
  }
  return phrases.length ? phrases.join(". ") : null;
}

export function beatCaption(beat: Beat): Caption | null {
  if (beat.speech) return beat.speech;
  const touching = beat.touches[0];
  if (!touching) return null;
  return {
    id: touching.id,
    speakerId: touching.actorId,
    speaker: touching.actor,
    text: touchText(touching),
    locationId: touching.locationId,
    targetId: touching.targetId,
    touch: touching.kind,
  };
}
