import { expect, test } from "bun:test";
import { addToBeat, beatCaption, describeBeat, emptyBeat, fitsBeat, type BeatPart } from "./beats";
import type { Caption, Touching } from "./types";

const line: Caption = { id: "event-1", speakerId: "1", speaker: "Mia", text: "Hi", locationId: "1" };
const hug: Touching = {
  id: "event-2",
  kind: "hug",
  actorId: "2",
  actor: "Jake",
  targetId: "3",
  target: "Sara",
  locationId: "2",
};

function move(name: string, place: string): BeatPart {
  return { type: "move", move: { castId: name, name, locationId: place, place } };
}

test("moves to the same place read as one phrase", () => {
  const beat = emptyBeat(1);
  for (const part of [move("Chris", "kitchen"), move("Sara", "kitchen"), move("Leo", "pool")]) addToBeat(beat, part);

  expect(describeBeat(beat)).toBe("Chris and Sara head to the kitchen. Leo heads to the pool");
});

test("a headline wins over what people do", () => {
  const beat = addToBeat(addToBeat(emptyBeat(1), move("Chris", "kitchen")), { type: "headline", text: "Twist: a new girl" });

  expect(describeBeat(beat)).toBe("Twist: a new girl");
});

test("a beat takes one speaker from one tick", () => {
  const beat = addToBeat(emptyBeat(1), { type: "speech", caption: line });

  expect(fitsBeat(beat, 1, { type: "touch", touching: hug })).toBe(true);
  expect(fitsBeat(beat, 1, { type: "speech", caption: { ...line, id: "event-3" } })).toBe(false);
  expect(fitsBeat(beat, 2, move("Chris", "kitchen"))).toBe(false);
});

test("speech is the caption, a touch only when nobody speaks", () => {
  const both = addToBeat(addToBeat(emptyBeat(1), { type: "touch", touching: hug }), { type: "speech", caption: line });
  const touchOnly = addToBeat(emptyBeat(1), { type: "touch", touching: hug });

  expect(beatCaption(both)).toBe(line);
  expect(beatCaption(touchOnly)).toMatchObject({ speaker: "Jake", text: "hugs Sara", touch: "hug", targetId: "3" });
  expect(describeBeat(both)).toBe("Jake hugs Sara");
});
