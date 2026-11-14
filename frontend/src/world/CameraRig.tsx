import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { MathUtils, PerspectiveCamera, Vector3 } from "three";
import type { Shot } from "./layout";

const reducedMotion =
  typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

type Props = { shot: Shot | undefined; cuts: boolean };

export function CameraRig({ shot, cuts }: Props) {
  const lookAt = useRef(new Vector3());
  const framed = useRef<Shot | null>(null);

  useFrame(({ camera }, delta) => {
    if (!shot) return;
    const { position, target, fov } = shot;
    const lens = camera instanceof PerspectiveCamera ? camera : null;

    if (!framed.current || reducedMotion || (cuts && framed.current !== shot)) {
      camera.position.set(...position);
      lookAt.current.set(...target);
      if (lens) lens.fov = fov;
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
      if (lens) lens.fov = MathUtils.damp(lens.fov, fov, 2.5, delta);
    }
    framed.current = shot;
    lens?.updateProjectionMatrix();
    camera.lookAt(lookAt.current);
  });

  return null;
}
