import type { Location } from "@/show/types";
import { roomKind, type RoomKind } from "./kinds";
import { placeFor, type Layout, type Place, type Route, type Vec3 } from "./layout";
import cottageUrl from "./models/cottage.glb";
import twoStoryUrl from "./models/two-story.glb";
import villaUrl from "./models/villa.glb";

/**
 * A room in a model: people gather around `center` (on the floor) and `camera` films them.
 * `cut` films the room from outside: the model is cut away that far in front of the people.
 * `width` and `depth` keep the group clear of furniture in small rooms.
 */
export type ModelRoom = {
  name: string;
  kinds: RoomKind[];
  center: Vec3;
  camera: Vec3;
  fov?: number;
  spacing?: number;
  cut?: number;
  width?: number;
  depth?: number;
};

/** A house model. `ground` is the height of the lawn around it. */
export type ModelSet = {
  kind: "model";
  id: string;
  url: string;
  scale: number;
  offset: Vec3;
  ground: number;
  rooms: ModelRoom[];
  span: number;
};

export type ClassicSet = { kind: "classic"; id: string };

export type WorldSet = ModelSet | ClassicSet;

const VILLA: ModelSet = {
  kind: "model",
  id: "villa",
  url: villaUrl,
  scale: 1,
  offset: [-7, 0, 6],
  ground: 0,
  rooms: [
    { name: "back garden", kinds: ["pool", "beach", "deck"], center: [0, 0, -8.6], camera: [0, 3, -15], fov: 36 },
    { name: "kitchen", kinds: ["kitchen", "bar"], center: [4.3, 0.22, 1.15], camera: [4.3, 2.7, 6.9], fov: 40, spacing: 0.8, cut: 0.55, depth: 0.4 },
    { name: "family room", kinds: ["living", "room"], center: [-4, 0.22, -3.3], camera: [-4, 2.3, -0.75], spacing: 0.9, width: 4.6, depth: 0.9 },
    { name: "master bedroom", kinds: ["bedroom"], center: [-3.4, 3.42, 4.4], camera: [-3.4, 5.3, 1.35], spacing: 0.9, width: 4.4, depth: 0.8 },
    { name: "dining room", kinds: ["bar", "kitchen"], center: [4.3, 0.22, 5.4], camera: [4.3, 2.7, 11], fov: 40, spacing: 0.8, cut: 0.45, depth: 0.35 },
    { name: "front garden", kinds: ["deck", "beach", "pool"], center: [-3.5, 0, 8.4], camera: [-3.5, 3, 15.5], fov: 36 },
    { name: "living room", kinds: ["room", "living"], center: [-4.5, 0.22, 5.2], camera: [-4.5, 2.7, 11], fov: 40, spacing: 0.85, cut: 0.65, depth: 0.4 },
    { name: "second bedroom", kinds: ["bedroom"], center: [3.8, 3.42, 4.6], camera: [3.5, 5.3, 1.95], spacing: 0.9, width: 3.4, depth: 0.8 },
    { name: "hall", kinds: [], center: [0.5, 0.22, 4], camera: [0.5, 2.7, 10.5], fov: 40, spacing: 0.75, cut: 1.85, width: 2.6 },
  ],
  span: 26,
};

const COTTAGE: ModelSet = {
  kind: "model",
  id: "cottage",
  url: cottageUrl,
  scale: 1,
  offset: [-1.4, 0, -8.6],
  ground: 0,
  rooms: [
    { name: "garden", kinds: ["pool", "beach", "deck"], center: [0, 0, 1.6], camera: [0, 3, 8.2], fov: 36 },
    { name: "kitchen", kinds: ["kitchen", "bar"], center: [0.5, 0.13, -2.4], camera: [0.5, 2.1, -8.1], fov: 40, spacing: 0.75, cut: 0.75, width: 1.8, depth: 0.9 },
    { name: "living room", kinds: ["living", "room"], center: [0.2, 0.13, -7.7], camera: [0.2, 2.2, -13.6], fov: 40, spacing: 0.8, cut: 0.55, width: 2.5, depth: 0.8 },
    { name: "bedroom", kinds: ["bedroom", "room"], center: [-0.3, 2.96, -2.2], camera: [-5.9, 4.7, -2.2], fov: 40, spacing: 0.8, cut: 0.75, width: 2.4, depth: 0.6 },
  ],
  span: 22,
};

const TWO_STORY: ModelSet = {
  kind: "model",
  id: "two-story",
  url: twoStoryUrl,
  scale: 1,
  offset: [-6, 0, 2],
  ground: -0.02,
  rooms: [
    { name: "back garden", kinds: ["pool", "beach", "deck"], center: [-0.5, 0, -5.3], camera: [-0.5, 3, -11.5], fov: 36 },
    { name: "kitchen", kinds: ["kitchen", "bar"], center: [-4.1, 0, -2.5], camera: [-10, 2.3, -2.5], fov: 40, spacing: 0.8, cut: 1.15, width: 2.8, depth: 0.8 },
    { name: "living room", kinds: ["living", "room"], center: [-0.7, 0, 1.3], camera: [-0.7, 2.4, 7.4], fov: 40, spacing: 0.9, cut: 1.05, width: 2.6, depth: 0.9 },
    { name: "bedroom", kinds: ["bedroom"], center: [-0.4, 3, -2.6], camera: [-0.4, 4.9, 3.5], fov: 40, spacing: 0.8, cut: 1.45, width: 1.7, depth: 0.9 },
    { name: "front garden", kinds: ["deck", "beach", "pool"], center: [1.5, 0, 7.3], camera: [1.5, 3, 13.5], fov: 36 },
  ],
  span: 18,
};

const CLASSIC: ClassicSet = { kind: "classic", id: "classic" };

const HOMES: WorldSet[] = [VILLA, COTTAGE, TWO_STORY, CLASSIC];

export const DEFAULT_HOME = VILLA;

/** The home a world is staged in, by the world's `home` id. */
export function findSet(id: string | null | undefined): WorldSet {
  return HOMES.find((set) => set.id === id) ?? DEFAULT_HOME;
}

const SPACING = 1.1;
const FOV = 55;
const CHEST = 1.1;

export function modelLayout(set: ModelSet, locations: Location[]): Layout {
  const rooms = assignRooms(set.rooms, locations);
  const places = locations.map((location, i) => {
    const room = rooms[i]!;
    const [x, y, z] = room.center;
    const shot = { position: room.camera, target: [x, y + CHEST, z] as Vec3, fov: room.fov ?? FOV };
    const place = placeFor(location.id, room.center, shot, room.spacing ?? SPACING, room.cut);
    return { ...place, width: room.width, depth: room.depth };
  });
  return { places, route: withinPlace(places), span: set.span, cuts: true };
}

/** Matches each location to a room: main kind first, then any listed kind, then whatever is left. */
export function assignRooms(rooms: ModelRoom[], locations: Location[]): ModelRoom[] {
  const kinds = locations.map((location) => roomKind(location.name));
  const chosen: (ModelRoom | undefined)[] = locations.map(() => undefined);
  const free = new Set(rooms);
  const fill = (fits: (room: ModelRoom, kind: RoomKind) => boolean) => {
    kinds.forEach((kind, i) => {
      if (chosen[i]) return;
      const room = [...free].find((candidate) => fits(candidate, kind));
      if (!room) return;
      chosen[i] = room;
      free.delete(room);
    });
  };
  fill((room, kind) => room.kinds[0] === kind);
  fill((room, kind) => room.kinds.includes(kind));
  fill(() => true);
  return chosen.map((room, i) => room ?? rooms[i % rooms.length]!);
}

function withinPlace(places: Place[]): Route {
  const nearest = (point: Vec3) => {
    let best = places[0];
    let bestDistance = Infinity;
    for (const place of places) {
      const [x, y, z] = place.center;
      const distance = Math.hypot(point[0] - x, (point[1] - y) * 3, point[2] - z);
      if (distance < bestDistance) [best, bestDistance] = [place, distance];
    }
    return best;
  };
  return (from, to) => (nearest(from) === nearest(to) ? [to] : null);
}
