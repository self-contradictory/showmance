import type { Location } from "@/show/types";
import { roomKind, type RoomKind } from "./kinds";

export type Vec3 = [number, number, number];

export type Shot = { position: Vec3; target: Vec3; fov: number };

/** A cut-away: the model is hidden on the camera's side of the vertical plane through `at`. */
export type Cut = { at: Vec3; toward: Vec3 };

/**
 * Where one location's people gather, and the camera that films them.
 * `width` and `depth` cap how far the group spreads, for small rooms.
 */
export type Place = {
  id: string;
  center: Vec3;
  lateral: Vec3;
  spacing: number;
  facing: number;
  shot: Shot;
  cut?: Cut;
  width?: number;
  depth?: number;
};

export type Standing = { spot: Vec3; facing: number };

/** The points to walk through, or null to appear at the destination. */
export type Route = (from: Vec3, to: Vec3) => Vec3[] | null;

/** `cuts`: the camera cuts between places instead of gliding through walls. */
export type Layout = { places: Place[]; route: Route; span: number; cuts: boolean };

export const ROOM_WIDTH = 9;
export const ROOM_DEPTH = 8;
const GAP = 0.6;
const STEP = ROOM_WIDTH + GAP;
const FRONT_Z = ROOM_DEPTH / 2 - 0.9;
const SPOT_Z = 1.2;
const SPACING = 1.5;
const FOV = 35;

export type RoomLayout = { id: string; kind: RoomKind; x: number };

export function layoutRooms(locations: Location[]): RoomLayout[] {
  const offset = ((locations.length - 1) * STEP) / 2;
  return locations.map((location, i) => ({
    id: location.id,
    kind: roomKind(location.name),
    x: i * STEP - offset,
  }));
}

export function classicLayout(rooms: RoomLayout[]): Layout {
  return {
    places: rooms.map((room) => placeFor(room.id, [room.x, 0, SPOT_Z], cameraFor(room), SPACING)),
    route: walkway,
    span: rooms.length * STEP,
    cuts: false,
  };
}

/** `cut`: how far in front of the people, toward the camera, to cut the model away. */
export function placeFor(id: string, center: Vec3, shot: Shot, spacing: number, cut?: number): Place {
  const dx = shot.position[0] - center[0];
  const dz = shot.position[2] - center[2];
  const length = Math.hypot(dx, dz) || 1;
  const [ux, uz] = [dx / length, dz / length];
  return {
    id,
    center,
    lateral: [uz, 0, -ux],
    spacing,
    facing: Math.atan2(dx, dz),
    shot,
    cut:
      cut === undefined
        ? undefined
        : { at: [center[0] + ux * cut, center[1], center[2] + uz * cut], toward: [-ux, 0, -uz] },
  };
}

const ALONE_TURN = 0.5;

/**
 * People gather on a half circle that opens toward the camera, turned toward its middle,
 * so they talk to each other rather than to the camera. Two people face each other.
 */
export function gather(place: Place, count: number): Standing[] {
  const [x, y, z] = place.center;
  if (count === 1) return [{ spot: place.center, facing: place.facing + ALONE_TURN }];

  const [tx, tz] = [Math.sin(place.facing), Math.cos(place.facing)];
  const [lx, lz] = [place.lateral[0], place.lateral[2]];
  const ideal = count === 2 ? place.spacing / 2 : Math.max(place.spacing, (place.spacing * (count - 1)) / Math.PI);
  const radius = Math.min(ideal, (place.width ?? Infinity) / 2);
  const back = Math.min(count === 2 ? 0 : radius, place.depth ?? Infinity);
  const [ox, oz] = [x + (tx * back) / 2, z + (tz * back) / 2];

  return Array.from({ length: count }, (_, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI) / (count - 1);
    const side = Math.sin(angle) * radius;
    const behind = Math.cos(angle) * back;
    const spot: Vec3 = [ox + lx * side - tx * behind, y, oz + lz * side - tz * behind];
    return { spot, facing: Math.atan2(ox - spot[0], oz - spot[2]) };
  });
}

export function walkway(from: Vec3, to: Vec3): Vec3[] {
  if (Math.abs(from[0] - to[0]) < ROOM_WIDTH / 2) return [to];
  return [[from[0], 0, FRONT_Z], [to[0], 0, FRONT_Z], to];
}

function cameraFor(room: RoomLayout): Shot {
  return { position: [room.x, 3.4, 8.6], target: [room.x, 0.75, -0.4], fov: FOV };
}

const BESIDE = 0.55;

export function besideOf(target: Vec3, from: Vec3): Vec3 {
  const dx = from[0] - target[0];
  const dz = from[2] - target[2];
  const length = Math.hypot(dx, dz);
  const [ux, uz] = length > 0.01 ? [dx / length, dz / length] : [-1, 0];
  return [target[0] + ux * BESIDE, target[1], target[2] + uz * BESIDE];
}
