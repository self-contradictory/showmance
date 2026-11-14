import type { Location } from "@/show/types";
import { roomKind, type RoomKind } from "./kinds";

export type Vec3 = [number, number, number];

export const ROOM_WIDTH = 9;
export const ROOM_DEPTH = 8;
const GAP = 0.6;
const STEP = ROOM_WIDTH + GAP;
const FRONT_Z = ROOM_DEPTH / 2 - 0.9;
const SPOT_Z = 1.2;
const SPACING = 1.5;

export type RoomLayout = { id: string; kind: RoomKind; x: number };

export function layoutRooms(locations: Location[]): RoomLayout[] {
  const offset = ((locations.length - 1) * STEP) / 2;
  return locations.map((location, i) => ({
    id: location.id,
    kind: roomKind(location.name),
    x: i * STEP - offset,
  }));
}

export function worldWidth(rooms: RoomLayout[]): number {
  return rooms.length * STEP;
}

export function spotFor(room: RoomLayout, index: number, count: number): Vec3 {
  return [room.x + (index - (count - 1) / 2) * SPACING, 0, SPOT_Z];
}

export function walkway(from: Vec3, to: Vec3): Vec3[] {
  if (Math.abs(from[0] - to[0]) < ROOM_WIDTH / 2) return [to];
  return [[from[0], 0, FRONT_Z], [to[0], 0, FRONT_Z], to];
}

export function cameraFor(room: RoomLayout): { position: Vec3; target: Vec3 } {
  return { position: [room.x, 3.4, 8.6], target: [room.x, 0.75, -0.4] };
}
