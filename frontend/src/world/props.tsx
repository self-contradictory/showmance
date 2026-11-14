import { RoundedBox } from "@react-three/drei";
import type { Vec3 } from "./layout";
import { MATERIAL } from "./palette";

type BlockProps = { size: Vec3; at: Vec3; color: string; glow?: boolean; rotation?: Vec3 };

export function Block({ size, at, color, glow = false, rotation }: BlockProps) {
  const radius = Math.min(0.06, Math.min(...size) / 2 - 0.005);
  return (
    <RoundedBox args={size} radius={radius} smoothness={3} position={at} rotation={rotation} castShadow receiveShadow>
      <meshStandardMaterial color={color} emissive={glow ? color : "#000000"} emissiveIntensity={glow ? 1.2 : 0} />
    </RoundedBox>
  );
}

type At = { at: Vec3; turn?: number };

export function Plant({ at }: At) {
  return (
    <group position={at}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.17, 0.44, 16]} />
        <meshStandardMaterial color={MATERIAL.white} />
      </mesh>
      <mesh position={[0, 0.75, 0]} castShadow>
        <sphereGeometry args={[0.38, 16, 12]} />
        <meshStandardMaterial color={MATERIAL.leaf} flatShading />
      </mesh>
    </group>
  );
}

export function Palm({ at }: At) {
  return (
    <group position={at}>
      <mesh position={[0, 1.4, 0]} rotation={[0, 0, 0.08]} castShadow>
        <cylinderGeometry args={[0.1, 0.16, 2.8, 10]} />
        <meshStandardMaterial color={MATERIAL.trunk} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={i}
          position={[0.12, 2.85, 0]}
          rotation={[0, (i / 5) * Math.PI * 2, 0.55]}
          castShadow
        >
          <boxGeometry args={[1.6, 0.04, 0.36]} />
          <meshStandardMaterial color={MATERIAL.leaf} />
        </mesh>
      ))}
    </group>
  );
}

export function Lounger({ at, turn = 0 }: At) {
  return (
    <group position={at} rotation={[0, turn, 0]}>
      <Block size={[0.75, 0.3, 1.8]} at={[0, 0.2, 0]} color={MATERIAL.white} />
      <Block size={[0.75, 0.08, 0.7]} at={[0, 0.55, -0.7]} rotation={[0.9, 0, 0]} color={MATERIAL.white} />
    </group>
  );
}

export function Umbrella({ at }: At) {
  return (
    <group position={at}>
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 2.2, 8]} />
        <meshStandardMaterial color={MATERIAL.white} />
      </mesh>
      <mesh position={[0, 2.25, 0]} castShadow>
        <coneGeometry args={[1.2, 0.5, 12]} />
        <meshStandardMaterial color={MATERIAL.blanket} />
      </mesh>
    </group>
  );
}

export function Stool({ at }: At) {
  return (
    <group position={at}>
      <mesh position={[0, 0.33, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.66, 8]} />
        <meshStandardMaterial color={MATERIAL.counterTop} />
      </mesh>
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.08, 16]} />
        <meshStandardMaterial color={MATERIAL.wood} />
      </mesh>
    </group>
  );
}

export function Chair({ at, turn = 0 }: At) {
  return (
    <group position={at} rotation={[0, turn, 0]}>
      <Block size={[0.6, 0.08, 0.6]} at={[0, 0.45, 0]} color={MATERIAL.wood} />
      <Block size={[0.6, 0.6, 0.08]} at={[0, 0.75, -0.27]} color={MATERIAL.wood} />
      {[-0.25, 0.25].flatMap((x) =>
        [-0.25, 0.25].map((z) => <Block key={`${x}${z}`} size={[0.05, 0.45, 0.05]} at={[x, 0.22, z]} color={MATERIAL.woodDark} />),
      )}
    </group>
  );
}

export function Lamp({ at, size = 0.18 }: At & { size?: number }) {
  return (
    <mesh position={at}>
      <sphereGeometry args={[size, 16, 12]} />
      <meshStandardMaterial color={MATERIAL.glow} emissive={MATERIAL.glow} emissiveIntensity={1.5} />
    </mesh>
  );
}
