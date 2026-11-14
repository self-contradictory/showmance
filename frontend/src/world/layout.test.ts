import { expect, test } from "bun:test";
import { besideOf, classicLayout, gather, layoutRooms, type Standing } from "./layout";
import { assignRooms, findSet, modelLayout, type ModelSet } from "./sets";

const villa = findSet("villa") as ModelSet;
const locations = (...names: string[]) => names.map((name) => ({ id: name.toLowerCase(), name }));
const classicKitchen = () => classicLayout(layoutRooms(locations("Pool", "Kitchen", "Bedroom"))).places[1]!;

function faces(from: Standing, to: Standing): boolean {
  const toward = Math.atan2(to.spot[0] - from.spot[0], to.spot[2] - from.spot[2]);
  return Math.abs(Math.atan2(Math.sin(toward - from.facing), Math.cos(toward - from.facing))) < 0.01;
}

test("two people face each other, not the camera", () => {
  const [left, right] = gather(classicKitchen(), 2);

  expect(faces(left!, right!)).toBe(true);
  expect(faces(right!, left!)).toBe(true);
  expect(left!.spot[0]).toBeLessThan(right!.spot[0]);
});

test("a group stands on a half circle turned toward its middle", () => {
  const group = gather(classicKitchen(), 4);
  const [mx, , mz] = [0, 0, group.reduce((sum, { spot }) => sum + spot[2], 0) / group.length];

  for (const { spot, facing } of group) {
    expect(Math.cos(facing - Math.atan2(mx - spot[0], mz - spot[2]))).toBeGreaterThan(0.5);
  }
  expect(group.map(({ spot }) => spot[0])).toEqual([...group.map(({ spot }) => spot[0])].sort((a, b) => a - b));
});

test("small rooms keep the group inside their width and depth", () => {
  const place = { ...classicKitchen(), width: 1.6, depth: 0.4 };
  const xs = gather(place, 6).map(({ spot }) => spot[0]);
  const zs = gather(place, 6).map(({ spot }) => spot[2]);

  expect(Math.max(...xs) - Math.min(...xs)).toBeLessThanOrEqual(1.6 + 1e-9);
  expect(Math.max(...zs) - Math.min(...zs)).toBeLessThanOrEqual(0.4 + 1e-9);
});

test("each location gets the model room that fits it best", () => {
  const rooms = (...names: string[]) => assignRooms(villa.rooms, locations(...names)).map((room) => room.name);

  expect(rooms("Pool", "Kitchen", "Bedroom")).toEqual(["back garden", "kitchen", "master bedroom"]);
  expect(rooms("Beach", "Bar", "Pool")).toEqual(["front garden", "dining room", "back garden"]);
  expect(rooms("Attic", "Attic 2")).toEqual(["living room", "family room"]);
});

test("a world without a home is staged in the villa", () => {
  expect(findSet(undefined).id).toBe("villa");
  expect(findSet("cottage").id).toBe("cottage");
});

test("people walk within a room and jump between rooms", () => {
  const { places, route } = modelLayout(villa, locations("Pool", "Kitchen"));
  const [pool, kitchen] = places.map((place) => gather(place, 3));

  expect(route(kitchen![0]!.spot, kitchen![2]!.spot)).toEqual([kitchen![2]!.spot]);
  expect(route(pool![0]!.spot, kitchen![0]!.spot)).toBeNull();
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
