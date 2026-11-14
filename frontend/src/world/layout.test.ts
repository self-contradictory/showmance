import { expect, test } from "bun:test";
import { besideOf, classicLayout, layoutRooms, spotFor } from "./layout";
import { assignRooms, findSet, modelLayout, type ModelSet } from "./sets";

const villa = findSet("villa") as ModelSet;
const locations = (...names: string[]) => names.map((name) => ({ id: name.toLowerCase(), name }));

test("classic rooms keep people side by side, facing the camera", () => {
  const kitchen = classicLayout(layoutRooms(locations("Pool", "Kitchen", "Bedroom"))).places[1]!;

  expect(kitchen.facing).toBe(0);
  expect(spotFor(kitchen, 0, 2)).toEqual([-0.75, 0, 1.2]);
  expect(kitchen.shot).toEqual({ position: [0, 3.4, 8.6], target: [0, 0.75, -0.4], fov: 35 });
});

test("each location gets the model room that fits it best", () => {
  const rooms = (...names: string[]) => assignRooms(villa.rooms, locations(...names)).map((room) => room.name);

  expect(rooms("Pool", "Kitchen", "Bedroom")).toEqual(["pool garden", "kitchen", "master bedroom"]);
  expect(rooms("Beach", "Bar", "Pool")).toEqual(["front garden", "dining room", "pool garden"]);
  expect(rooms("Attic", "Attic 2")).toEqual(["living room", "family room"]);
});

test("people walk within a room and jump between rooms", () => {
  const [pool, kitchen] = modelLayout(villa, locations("Pool", "Kitchen")).places;
  const { route } = modelLayout(villa, locations("Pool", "Kitchen"));

  expect(route(spotFor(kitchen!, 0, 3), spotFor(kitchen!, 2, 3))).toEqual([spotFor(kitchen!, 2, 3)]);
  expect(route(spotFor(pool!, 0, 1), spotFor(kitchen!, 0, 1))).toBeNull();
});

test("a cut-away sits between the people and the camera", () => {
  const { center, cut } = modelLayout(villa, locations("Kitchen")).places[0]!;

  expect(cut?.toward[2]).toBe(-1);
  expect(cut?.at[2]).toBeCloseTo(center[2] + 0.55);
});

test("stepping beside someone keeps your floor and your side", () => {
  expect(besideOf([0, 3.42, 0], [2, 3.42, 0])).toEqual([0.55, 3.42, 0]);
  expect(besideOf([0, 0, 0], [0, 0, -3])).toEqual([0, 0, -0.55]);
});
