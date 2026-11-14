import { Html } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useState } from "react";
import type { Show, Touch } from "@/show/types";
import { Atmosphere } from "./Atmosphere";
import { CameraRig } from "./CameraRig";
import { besideOf, classicLayout, layoutRooms, spotFor, type Vec3 } from "./layout";
import { ModelWorld } from "./ModelWorld";
import { SKIES } from "./palette";
import { Person } from "./Person";
import { Room } from "./Room";
import { modelLayout, type WorldSet } from "./sets";

type Props = { show: Show; paused: boolean; set: WorldSet };

function readAccent(): string {
  return getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#e3175f";
}

export default function WorldScene({ show, paused, set }: Props) {
  const rooms = useMemo(() => (set.kind === "classic" ? layoutRooms(show.locations) : []), [set, show.locations]);
  const layout = useMemo(
    () => (set.kind === "classic" ? classicLayout(rooms) : modelLayout(set, show.locations)),
    [set, rooms, show.locations],
  );
  const accent = useMemo(readAccent, []);
  const caption = show.caption;
  const [activePlaceId, setActivePlaceId] = useState(() => layout.places[0]?.id);

  useEffect(() => {
    if (caption) setActivePlaceId(caption.locationId);
  }, [caption]);

  const { placed, rests } = useMemo(() => {
    const placed = new Map<string, Vec3>();
    const rests = new Map<string, number>();
    for (const place of layout.places) {
      const occupants = show.cast.filter((member) => member.locationId === place.id);
      occupants.forEach((member, i) => {
        placed.set(member.id, spotFor(place, i, occupants.length));
        rests.set(member.id, place.facing);
      });
    }
    return { placed, rests };
  }, [layout, show.cast]);

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
  const activePlace = layout.places.find((place) => place.id === activePlaceId) ?? layout.places[0];
  const lamps = SKIES[show.sky].lamps;

  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        dpr={[1, 1.75]}
        frameloop={paused ? "never" : "always"}
        camera={{ fov: activePlace?.shot.fov ?? 35, near: 0.1, far: 120 }}
      >
        <Atmosphere sky={show.sky} width={layout.span} />
        <Suspense fallback={null}>
          {set.kind === "classic" ? (
            rooms.map((room) => <Room key={room.id} room={room} lamps={lamps} />)
          ) : (
            <ModelWorld set={set} places={layout.places} cut={activePlace?.cut} lamps={lamps} />
          )}
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
                gender={member.gender}
                spot={spot}
                rest={rests.get(member.id) ?? 0}
                route={layout.route}
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
                position={[
                  (actorSpot[0] + targetSpot[0]) / 2,
                  targetSpot[1] + 2.3,
                  (actorSpot[2] + targetSpot[2]) / 2,
                ]}
                center
              >
                <span className="pointer-events-none animate-bounce text-3xl select-none">
                  {touching.kind === "hug" ? "🤗" : "💋"}
                </span>
              </Html>
            );
          })}
        </Suspense>
        <CameraRig shot={activePlace?.shot} cuts={layout.cuts} />
      </Canvas>
    </div>
  );
}
