import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { MathUtils, Vector3 } from "three";
import { cameraFor, type RoomLayout } from "./layout";

const reducedMotion =
  typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export function CameraRig({ room }: { room: RoomLayout | undefined }) {
  const lookAt = useRef(new Vector3());
  const placed = useRef(false);

  useFrame(({ camera }, delta) => {
    if (!room) return;
    const { position, target } = cameraFor(room);

    if (!placed.current || reducedMotion) {
      camera.position.set(...position);
      lookAt.current.set(...target);
      placed.current = true;
    } else {
      camera.position.set(
        MathUtils.damp(camera.position.x, position[0], 2.5, delta),
        MathUtils.damp(camera.position.y, position[1], 2.5, delta),
        MathUtils.damp(camera.position.z, position[2], 2.5, delta),
      );
      lookAt.current.set(
        MathUtils.damp(lookAt.current.x, target[0], 2.5, delta),
        MathUtils.damp(lookAt.current.y, target[1], 2.5, delta),
        MathUtils.damp(lookAt.current.z, target[2], 2.5, delta),
      );
    }
    camera.lookAt(lookAt.current);
  });

  return null;
}
