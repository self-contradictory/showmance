import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Mesh, Plane, Vector3 } from "three";
import type { Cut, Place, Vec3 } from "./layout";
import { MATERIAL } from "./palette";
import { Block, Lounger, Palm, Plant } from "./props";
import type { ModelSet } from "./sets";

type Props = { set: ModelSet; places: Place[]; cut: Cut | undefined; lamps: number };

const KEEP_ALL = 1e6;

export function ModelWorld({ set, places, cut, lamps }: Props) {
  const { scene } = useGLTF(set.url);
  const gl = useThree((state) => state.gl);
  const plane = useMemo(() => new Plane(new Vector3(0, 1, 0), KEEP_ALL), []);
  const shown = useRef<Cut | undefined | null>(null);

  useEffect(() => {
    gl.localClippingEnabled = true;
    scene.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      object.receiveShadow = true;
      for (const material of [object.material].flat()) material.clippingPlanes = [plane];
    });
  }, [gl, scene, plane]);

  // Moves the cut in the same frame the camera cuts to the new place.
  useFrame(() => {
    if (shown.current === cut) return;
    shown.current = cut;
    if (cut) plane.setFromNormalAndCoplanarPoint(new Vector3(...cut.toward), new Vector3(...cut.at));
    else plane.set(new Vector3(0, 1, 0), KEEP_ALL);
  });

  return (
    <>
      <primitive object={scene} scale={set.scale} position={set.offset} />
      {set.grounds.map(({ at, size }) => (
        <Block
          key={at.join()}
          size={[size[0], 0.3, size[1]]}
          at={[at[0], at[1] - 0.15, at[2]]}
          color={MATERIAL.tile}
        />
      ))}
      {set.pools.map((at) => (
        <Pool key={at.join()} at={at} />
      ))}
      {lamps > 0 &&
        places.map((place) => (
          <pointLight
            key={place.id}
            position={[place.center[0], place.center[1] + 2.4, place.center[2]]}
            color={MATERIAL.glow}
            intensity={lamps * 14}
            distance={10}
            decay={2}
          />
        ))}
    </>
  );
}

function Pool({ at }: { at: Vec3 }) {
  return (
    <group position={at}>
      <Block size={[7, 0.16, 3.4]} at={[0, 0.06, 0]} color={MATERIAL.white} />
      <Block size={[6.4, 0.1, 2.8]} at={[0, 0.12, 0]} color={MATERIAL.water} />
      <Lounger at={[-4.6, 0, 0.2]} />
      <Lounger at={[4.6, 0, 0.2]} />
      <Palm at={[-5.2, 0, -1.9]} />
      <Plant at={[5.2, 0, -1.9]} />
    </group>
  );
}
