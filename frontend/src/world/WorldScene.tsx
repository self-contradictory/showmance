import { Html } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import type { Show, Touch } from "@/show/types";
import { Atmosphere } from "./Atmosphere";
import { CameraRig } from "./CameraRig";
import { besideOf, layoutRooms, spotFor, worldWidth, type Vec3 } from "./layout";
import { SKIES } from "./palette";
import { Person } from "./Person";
import { Room } from "./Room";

type Props = { show: Show; paused: boolean };

function readAccent(): string {
  return getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#e3175f";
}

export default function WorldScene({ show, paused }: Props) {
  const rooms = useMemo(() => layoutRooms(show.locations), [show.locations]);
  const accent = useMemo(readAccent, []);
  const caption = show.caption;
  const [activeRoomId, setActiveRoomId] = useState(() => rooms[0]?.id);

  useEffect(() => {
    if (caption) setActiveRoomId(caption.locationId);
  }, [caption]);

  const placed = useMemo(() => {
    const result = new Map<string, Vec3>();
    for (const room of rooms) {
      const occupants = show.cast.filter((member) => member.locationId === room.id);
      occupants.forEach((member, i) => result.set(member.id, spotFor(room, i, occupants.length)));
    }
    return result;
  }, [rooms, show.cast]);

  const touches = show.touches;
  const spots = useMemo(() => {
    if (!touches.length) return placed;
    const result = new Map(placed);
    for (const touching of touches) {
      const target = result.get(touching.targetId);
      const actor = result.get(touching.actorId);
      if (target && actor) result.set(touching.actorId, besideOf(target, actor));
    }
    return result;
  }, [placed, touches]);

  const holding = useMemo(() => {
    const result = new Map<string, { partnerId: string; kind: Touch }>();
    for (const touching of touches) {
      result.set(touching.actorId, { partnerId: touching.targetId, kind: touching.kind });
      result.set(touching.targetId, { partnerId: touching.actorId, kind: touching.kind });
    }
    return result;
  }, [touches]);

  const speech = caption && !caption.touch ? caption : null;

  return (
    <div className="absolute inset-0">
      <Canvas shadows dpr={[1, 1.75]} frameloop={paused ? "never" : "always"} camera={{ fov: 35, near: 0.1, far: 120 }}>
        <Atmosphere sky={show.sky} width={worldWidth(rooms)} />
        {rooms.map((room) => (
          <Room key={room.id} room={room} lamps={SKIES[show.sky].lamps} />
        ))}
        {show.cast.map((member, index) => {
          const spot = spots.get(member.id);
          if (!spot) return null;
          const held = holding.get(member.id);
          const speaking = speech?.speakerId === member.id;
          const partner =
            held?.partnerId ??
            (speaking ? speech?.targetId : speech?.targetId === member.id ? speech.speakerId : undefined);
          const face = (partner ? spots.get(partner) : undefined) ?? null;
          return (
            <Person
              key={member.id}
              id={member.id}
              index={index}
              spot={spot}
              face={face}
              talking={speaking}
              pose={held?.kind ?? null}
              accent={accent}
            />
          );
        })}
        {touches.map((touching) => {
          const actorSpot = spots.get(touching.actorId);
          const targetSpot = spots.get(touching.targetId);
          if (!actorSpot || !targetSpot) return null;
          return (
            <Html
              key={touching.id}
              position={[(actorSpot[0] + targetSpot[0]) / 2, 2.3, (actorSpot[2] + targetSpot[2]) / 2]}
              center
            >
              <span className="pointer-events-none animate-bounce text-3xl select-none">
                {touching.kind === "hug" ? "🤗" : "💋"}
              </span>
            </Html>
          );
        })}
        <CameraRig room={rooms.find((room) => room.id === activeRoomId) ?? rooms[0]} />
      </Canvas>
    </div>
  );
}
