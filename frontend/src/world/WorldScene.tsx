import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import type { Show } from "@/show/types";
import { Atmosphere } from "./Atmosphere";
import { CameraRig } from "./CameraRig";
import { layoutRooms, spotFor, worldWidth, type Vec3 } from "./layout";
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

  const spots = useMemo(() => {
    const result = new Map<string, Vec3>();
    for (const room of rooms) {
      const occupants = show.cast.filter((member) => member.locationId === room.id);
      occupants.forEach((member, i) => result.set(member.id, spotFor(room, i, occupants.length)));
    }
    return result;
  }, [rooms, show.cast]);

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
          const talking = caption?.speakerId === member.id;
          const listening = caption?.targetId === member.id;
          const face =
            (talking && caption?.targetId ? spots.get(caption.targetId) : undefined) ??
            (listening && caption ? spots.get(caption.speakerId) : undefined) ??
            null;
          return (
            <Person
              key={member.id}
              id={member.id}
              index={index}
              spot={spot}
              face={face}
              talking={talking}
              accent={accent}
            />
          );
        })}
        <CameraRig room={rooms.find((room) => room.id === activeRoomId)} />
      </Canvas>
    </div>
  );
}
