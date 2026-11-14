import type { ReactNode } from "react";
import { isOutdoor, type RoomKind } from "./kinds";
import { ROOM_DEPTH, ROOM_WIDTH, type RoomLayout } from "./layout";
import { MATERIAL } from "./palette";
import { Block, Chair, Lamp, Lounger, Palm, Plant, Stool, Umbrella } from "./props";

const FLOORS: Record<RoomKind, string> = {
  pool: MATERIAL.tile,
  kitchen: MATERIAL.tile,
  bedroom: MATERIAL.carpet,
  living: MATERIAL.wood,
  bar: MATERIAL.woodDark,
  beach: MATERIAL.sand,
  deck: MATERIAL.wood,
  room: MATERIAL.carpet,
};

const FURNITURE: Record<RoomKind, () => ReactNode> = {
  pool: () => (
    <>
      <Block size={[6, 0.16, 3.2]} at={[0, 0.06, -1.7]} color={MATERIAL.white} />
      <Block size={[5.4, 0.1, 2.6]} at={[0, 0.12, -1.7]} color={MATERIAL.water} />
      <Lounger at={[-3.6, 0, -1.4]} />
      <Lounger at={[3.6, 0, -1.4]} />
      <Palm at={[-3.8, 0, -3.5]} />
      <Plant at={[3.9, 0, -3.5]} />
    </>
  ),
  kitchen: () => (
    <>
      <Block size={[6.4, 0.95, 0.9]} at={[-0.6, 0.475, -3.4]} color={MATERIAL.white} />
      <Block size={[6.5, 0.08, 0.95]} at={[-0.6, 0.99, -3.4]} color={MATERIAL.counterTop} />
      <Block size={[1.1, 2.1, 0.9]} at={[3.6, 1.05, -3.4]} color={MATERIAL.steel} />
      <Block size={[3, 0.95, 1.2]} at={[0, 0.475, -1.3]} color={MATERIAL.white} />
      <Block size={[3.1, 0.08, 1.3]} at={[0, 0.99, -1.3]} color={MATERIAL.counterTop} />
      <Stool at={[-0.9, 0, -0.35]} />
      <Stool at={[0.9, 0, -0.35]} />
      <Plant at={[-3.9, 0, -1]} />
    </>
  ),
  bedroom: () => (
    <>
      <Block size={[3.2, 0.45, 3.6]} at={[0, 0.225, -2.1]} color={MATERIAL.wood} />
      <Block size={[3, 0.25, 3.3]} at={[0, 0.55, -2.05]} color={MATERIAL.white} />
      <Block size={[3.02, 0.08, 2]} at={[0, 0.7, -1.4]} color={MATERIAL.blanket} />
      <Block size={[1.1, 0.22, 0.6]} at={[-0.75, 0.8, -3.3]} color={MATERIAL.white} />
      <Block size={[1.1, 0.22, 0.6]} at={[0.75, 0.8, -3.3]} color={MATERIAL.white} />
      <Block size={[0.7, 0.6, 0.6]} at={[-2.3, 0.3, -3.4]} color={MATERIAL.wood} />
      <Block size={[0.7, 0.6, 0.6]} at={[2.3, 0.3, -3.4]} color={MATERIAL.wood} />
      <Lamp at={[2.3, 0.85, -3.4]} />
      <Plant at={[-3.9, 0, -1]} />
    </>
  ),
  living: () => (
    <>
      <Block size={[5, 0.02, 3.2]} at={[0, 0.01, -1.6]} color={MATERIAL.carpet} />
      <Block size={[3.6, 0.45, 1.1]} at={[0, 0.225, -3]} color={MATERIAL.fabric} />
      <Block size={[3.6, 0.7, 0.3]} at={[0, 0.6, -3.45]} color={MATERIAL.fabric} />
      <Block size={[0.3, 0.6, 1.1]} at={[-1.8, 0.3, -3]} color={MATERIAL.fabric} />
      <Block size={[0.3, 0.6, 1.1]} at={[1.8, 0.3, -3]} color={MATERIAL.fabric} />
      <Block size={[1.6, 0.35, 0.9]} at={[0, 0.175, -1.5]} color={MATERIAL.wood} />
      <Block size={[1.8, 1.6, 0.5]} at={[3.4, 0.8, -3.6]} color={MATERIAL.stone} />
      <Block size={[1, 0.6, 0.1]} at={[3.4, 0.45, -3.33]} color={MATERIAL.flame} glow />
      <Plant at={[-3.9, 0, -3.3]} />
    </>
  ),
  bar: () => (
    <>
      <Block size={[5, 1.1, 0.9]} at={[0, 0.55, -2.2]} color={MATERIAL.woodDark} />
      <Block size={[5.1, 0.08, 1]} at={[0, 1.14, -2.2]} color={MATERIAL.counterTop} />
      <Block size={[5.5, 0.12, 0.4]} at={[0, 1.6, -3.75]} color={MATERIAL.wood} />
      {[-2, -1.2, -0.4, 0.4, 1.2, 2].map((x, i) => (
        <Block key={x} size={[0.18, 0.5, 0.18]} at={[x, 1.91, -3.75]} color={i % 2 ? MATERIAL.water : MATERIAL.blanket} />
      ))}
      <Stool at={[-1.5, 0, -1.3]} />
      <Stool at={[0, 0, -1.3]} />
      <Stool at={[1.5, 0, -1.3]} />
      <Lamp at={[0, 2.4, -2.2]} />
    </>
  ),
  beach: () => (
    <>
      <Block size={[ROOM_WIDTH, 0.06, 2.6]} at={[0, 0.03, -2.7]} color={MATERIAL.water} />
      <Palm at={[-3.6, 0, -0.8]} />
      <Lounger at={[2.4, 0, -0.6]} />
      <Umbrella at={[3.5, 0, -0.9]} />
    </>
  ),
  deck: () => (
    <>
      {[-4.3, -2.15, 0, 2.15, 4.3].map((x) => (
        <Block key={x} size={[0.1, 1.05, 0.1]} at={[x, 0.52, -3.8]} color={MATERIAL.woodDark} />
      ))}
      <Block size={[ROOM_WIDTH, 0.08, 0.1]} at={[0, 1.05, -3.8]} color={MATERIAL.woodDark} />
      <Chair at={[-2, 0, -2.4]} turn={0.3} />
      <Chair at={[2, 0, -2.4]} turn={-0.3} />
      <Block size={[1, 0.6, 1]} at={[0, 0.3, -2.4]} color={MATERIAL.wood} />
      <Plant at={[-3.9, 0, -3.2]} />
      <Plant at={[3.9, 0, -3.2]} />
      {[-3, -1, 1, 3].map((x) => (
        <Lamp key={x} at={[x, 2.6, -3.8]} size={0.08} />
      ))}
    </>
  ),
  room: () => (
    <>
      <Block size={[4, 0.02, 3]} at={[0, 0.01, -1.5]} color={MATERIAL.fabric} />
      <Plant at={[-3.9, 0, -3.3]} />
    </>
  ),
};

type Props = { room: RoomLayout; lamps: number };

export function Room({ room, lamps }: Props) {
  const Furniture = FURNITURE[room.kind];

  return (
    <group position={[room.x, 0, 0]}>
      <Block size={[ROOM_WIDTH, 0.3, ROOM_DEPTH]} at={[0, -0.15, 0]} color={FLOORS[room.kind]} />
      {!isOutdoor(room.kind) && (
        <>
          <Block size={[ROOM_WIDTH, 2.8, 0.25]} at={[0, 1.4, -ROOM_DEPTH / 2]} color={MATERIAL.wall} />
          <Block size={[0.25, 2.8, ROOM_DEPTH / 2]} at={[-ROOM_WIDTH / 2, 1.4, -ROOM_DEPTH / 4]} color={MATERIAL.wall} />
          <Block size={[0.25, 2.8, ROOM_DEPTH / 2]} at={[ROOM_WIDTH / 2, 1.4, -ROOM_DEPTH / 4]} color={MATERIAL.wall} />
        </>
      )}
      <Furniture />
      {lamps > 0 && <pointLight position={[0, 2.8, 2.8]} color={MATERIAL.glow} intensity={lamps * 14} distance={10} decay={2} />}
    </group>
  );
}
