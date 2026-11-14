import type { Sky } from "@/show/types";
import { SKIES } from "./palette";

export function Atmosphere({ sky, width }: { sky: Sky; width: number }) {
  const preset = SKIES[sky];
  const half = width / 2 + 2;

  return (
    <>
      <color attach="background" args={[preset.background]} />
      <fog attach="fog" args={[preset.background, 22, 55]} />
      <hemisphereLight args={[preset.hemiSky, preset.hemiGround, preset.hemi]} />
      <directionalLight
        castShadow
        position={preset.sunPosition}
        color={preset.sun}
        intensity={preset.sunIntensity}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-half}
        shadow-camera-right={half}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-bias={-0.0005}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color={preset.ground} />
      </mesh>
    </>
  );
}
