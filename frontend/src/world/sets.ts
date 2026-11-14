import type { Location } from "@/show/types";
import { roomKind, type RoomKind } from "./kinds";
import { placeFor, type Layout, type Place, type Route, type Vec3 } from "./layout";
import cottageUrl from "./models/cottage.glb";
import villaUrl from "./models/villa.glb";

/**
 * A room in a model: people line up at `center` (on the floor) and `camera` films them.
 * `cut` films the room from outside: the model is cut away that far in front of the people.
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
};

/** A flat platform people can stand on outside, its top at `at[1]`. */
export type Ground = { at: Vec3; size: [width: number, depth: number] };

export type Credit = { text: string; href: string };

export type ModelSet = {
  kind: "model";
  id: string;
  name: string;
  url: string;
  scale: number;
  offset: Vec3;
  rooms: ModelRoom[];
  grounds: Ground[];
  pools: Vec3[];
  span: number;
  credit?: Credit;
};

export type ClassicSet = { kind: "classic"; id: string; name: string; credit?: undefined };

export type WorldSet = ModelSet | ClassicSet;

const VILLA: ModelSet = {
  kind: "model",
  id: "villa",
  name: "Villa",
  url: villaUrl,
  scale: 1,
  offset: [-7, 0, 6],
  rooms: [
    { name: "pool garden", kinds: ["pool", "beach", "deck"], center: [0, 0, -14.2], camera: [0, 3.4, -20.6], fov: 36 },
    { name: "kitchen", kinds: ["kitchen", "bar"], center: [4.3, 0.22, 1.15], camera: [4.3, 2.7, 6.9], fov: 40, spacing: 0.8, cut: 0.55 },
    { name: "family room", kinds: ["living", "room"], center: [-4, 0.22, -3.3], camera: [-4, 2.3, -0.75], spacing: 0.9 },
    { name: "master bedroom", kinds: ["bedroom"], center: [-3.4, 3.42, 4.4], camera: [-3.4, 5.3, 1.35], spacing: 0.9 },
    { name: "dining room", kinds: ["bar", "kitchen"], center: [4.3, 0.22, 5.4], camera: [4.3, 2.7, 11], fov: 40, spacing: 0.8, cut: 0.45 },
    { name: "front garden", kinds: ["deck", "beach", "pool"], center: [-3.5, 0, 8.4], camera: [-3.5, 3, 15.5], fov: 36 },
    { name: "living room", kinds: ["room", "living"], center: [-4.5, 0.22, 5.2], camera: [-4.5, 2.7, 11], fov: 40, spacing: 0.85, cut: 0.65 },
    { name: "second bedroom", kinds: ["bedroom"], center: [3.8, 3.42, 4.6], camera: [3.5, 5.3, 1.95], spacing: 0.9 },
    { name: "hall", kinds: [], center: [0.5, 0.22, 4], camera: [0.5, 2.7, 10.5], fov: 40, spacing: 0.75, cut: 1.85 },
  ],
  grounds: [
    { at: [0, 0, -13], size: [20, 14] },
    { at: [0, 0, 9], size: [18, 6] },
  ],
  pools: [[0, 0, -11.6]],
  span: 26,
};

const COTTAGE: ModelSet = {
  kind: "model",
  id: "cottage",
  name: "Cottage",
  url: cottageUrl,
  scale: 1,
  offset: [-1.4, 0, -8.6],
  rooms: [
    { name: "garden", kinds: ["pool", "beach", "deck"], center: [0, 0, 5.4], camera: [0, 3.4, 11.8], fov: 36 },
    { name: "kitchen", kinds: ["kitchen", "bar"], center: [0.5, 0.13, -2.6], camera: [0.5, 2.1, -8.1], fov: 40, spacing: 0.75, cut: 0.55, width: 1.6 },
    { name: "living room", kinds: ["living", "room"], center: [0.2, 0.13, -7.7], camera: [0.2, 2.2, -13.6], fov: 40, spacing: 0.8, cut: 0.55, width: 2.5 },
    { name: "bedroom", kinds: ["bedroom", "room"], center: [-0.3, 2.96, -2.2], camera: [-5.9, 4.7, -2.2], fov: 40, spacing: 0.8, cut: 0.75, width: 2.4 },
  ],
  grounds: [{ at: [0, 0, 4.4], size: [16, 11] }],
  pools: [[0, 0, 2.7]],
  span: 22,
  credit: {
    text: "Low Poly House Interior by Paolo Mercogliano, CC BY 4.0",
    href: "https://sketchfab.com/3d-models/low-poly-house-interior-62b1714ef66f4e0d9f42dcd12efb3f52",
  },
};

const CLASSIC: ClassicSet = { kind: "classic", id: "classic", name: "Classic" };

export const WORLD_SETS: WorldSet[] = [VILLA, COTTAGE, CLASSIC];

export const DEFAULT_SET = VILLA;

export function findSet(id: string | null): WorldSet {
  return WORLD_SETS.find((set) => set.id === id) ?? DEFAULT_SET;
}

export function nextSet(current: WorldSet): WorldSet {
  return WORLD_SETS[(WORLD_SETS.indexOf(current) + 1) % WORLD_SETS.length] ?? DEFAULT_SET;
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
    const spacing = room.spacing ?? SPACING;
    const place = placeFor(location.id, room.center, shot, spacing, room.cut);
    return room.width ? { ...place, perRow: Math.floor(room.width / spacing) + 1 } : place;
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
