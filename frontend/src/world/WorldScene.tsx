import { Html } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import type { Show } from "@/show/types";
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

  const touch = caption?.touch;
  const spots = useMemo(() => {
    if (!caption?.touch || !caption.targetId) return placed;
    const target = placed.get(caption.targetId);
    const actor = placed.get(caption.speakerId);
    if (!target || !actor) return placed;
    return new Map(placed).set(caption.speakerId, besideOf(target, actor));
  }, [placed, caption]);

  const actorSpot = touch && caption ? spots.get(caption.speakerId) : undefined;
  const targetSpot = touch && caption?.targetId ? spots.get(caption.targetId) : undefined;

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
          const leading = caption?.speakerId === member.id;
          const partner = leading ? caption?.targetId : caption?.targetId === member.id ? caption?.speakerId : undefined;
          const face = (partner ? spots.get(partner) : undefined) ?? null;
          return (
            <Person
              key={member.id}
              id={member.id}
              index={index}
              spot={spot}
              face={face}
              talking={leading && !touch}
              pose={touch && (leading || partner) ? touch : null}
              accent={accent}
            />
          );
        })}
        {actorSpot && targetSpot && (
          <Html position={[(actorSpot[0] + targetSpot[0]) / 2, 2.3, (actorSpot[2] + targetSpot[2]) / 2]} center>
            <span className="pointer-events-none animate-bounce text-3xl select-none">
              {touch === "hug" ? "🤗" : "💋"}
            </span>
          </Html>
        )}
        <CameraRig room={rooms.find((room) => room.id === activeRoomId) ?? rooms[0]} />
      </Canvas>
    </div>
  );
}
