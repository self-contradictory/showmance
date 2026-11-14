import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { MathUtils, type Group } from "three";
import type { Gender, Touch } from "@/show/types";
import type { Route, Vec3 } from "./layout";
import { lookFor } from "./palette";

const WALK_SPEED = 2.2;

type Props = {
  id: string;
  index: number;
  gender?: Gender;
  spot: Vec3;
  rest: number;
  route: Route;
  face: Vec3 | null;
  talking: boolean;
  pose: Touch | null;
  accent: string;
};

function turnToward(current: number, target: number, lambda: number, delta: number): number {
  const diff = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + diff * (1 - Math.exp(-lambda * delta));
}

export function Person({ id, index, gender, spot, rest, route, face, talking, pose, accent }: Props) {
  const look = useMemo(() => lookFor(id, index, gender), [id, index, gender]);
  const build = look.build;
  const root = useRef<Group>(null);
  const torso = useRef<Group>(null);
  const head = useRef<Group>(null);
  const leftArm = useRef<Group>(null);
  const rightArm = useRef<Group>(null);
  const leftLeg = useRef<Group>(null);
  const rightLeg = useRef<Group>(null);
  const path = useRef<Vec3[]>([]);
  const placed = useRef(false);
  const [x, y, z] = spot;

  useEffect(() => {
    const body = root.current;
    if (!body) return;
    const walk = placed.current ? route([body.position.x, body.position.y, body.position.z], [x, y, z]) : null;
    placed.current = true;
    path.current = walk ?? [];
    if (!walk) body.position.set(x, y, z);
  }, [x, y, z, route]);

  useFrame((state, delta) => {
    const body = root.current;
    if (!body) return;
    const t = state.clock.elapsedTime + index * 1.7;

    let walking = false;
    const next = path.current[0];
    if (next) {
      const dx = next[0] - body.position.x;
      const dz = next[2] - body.position.z;
      const distance = Math.hypot(dx, dz);
      const step = WALK_SPEED * delta;
      if (distance <= step) {
        body.position.set(next[0], next[1], next[2]);
        path.current.shift();
      } else {
        body.position.x += (dx / distance) * step;
        body.position.y = next[1];
        body.position.z += (dz / distance) * step;
        body.rotation.y = turnToward(body.rotation.y, Math.atan2(dx, dz), 12, delta);
        walking = true;
      }
    }

    if (!walking) {
      const angle = face ? Math.atan2(face[0] - body.position.x, face[2] - body.position.z) : rest;
      body.rotation.y = turnToward(body.rotation.y, angle, 6, delta);
    }

    const swing = walking ? Math.sin(t * 9) * 0.7 : 0;
    const holding = walking ? null : pose;
    const reach = holding === "hug" ? -1.3 : holding === "kiss" ? -0.5 : null;
    const wrap = holding === "hug" ? 0.35 : 0;
    if (leftLeg.current) leftLeg.current.rotation.x = MathUtils.damp(leftLeg.current.rotation.x, swing, 14, delta);
    if (rightLeg.current) rightLeg.current.rotation.x = MathUtils.damp(rightLeg.current.rotation.x, -swing, 14, delta);
    if (leftArm.current) {
      leftArm.current.rotation.x = MathUtils.damp(leftArm.current.rotation.x, reach ?? -swing * 0.8, 10, delta);
      leftArm.current.rotation.z = MathUtils.damp(leftArm.current.rotation.z, wrap, 10, delta);
    }
    if (rightArm.current) {
      const gesture = talking ? -0.9 + Math.sin(t * 5) * 0.3 : swing * 0.8;
      rightArm.current.rotation.x = MathUtils.damp(rightArm.current.rotation.x, reach ?? gesture, 10, delta);
      rightArm.current.rotation.z = MathUtils.damp(rightArm.current.rotation.z, -wrap, 10, delta);
    }
    if (head.current) {
      const nod = holding === "kiss" ? 0.25 : talking ? Math.sin(t * 8) * 0.1 : 0;
      head.current.rotation.x = MathUtils.damp(head.current.rotation.x, nod, 10, delta);
    }
    if (torso.current) {
      torso.current.position.y = walking ? Math.abs(Math.sin(t * 9)) * 0.06 : Math.sin(t * 2) * 0.01;
      const lean = holding === "kiss" ? 0.12 : holding === "hug" ? 0.06 : 0;
      torso.current.rotation.x = MathUtils.damp(torso.current.rotation.x, lean, 8, delta);
    }
  });

  return (
    <group ref={root}>
      {talking && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
          <ringGeometry args={[0.42, 0.5, 40]} />
          <meshBasicMaterial color={accent} toneMapped={false} />
        </mesh>
      )}
      <group ref={torso}>
        <group ref={leftLeg} position={[-build.hips, 0.55, 0]}>
          <mesh position={[0, -0.27, 0]} castShadow>
            <capsuleGeometry args={[0.1, 0.36, 4, 10]} />
            <meshStandardMaterial color={look.pants} />
          </mesh>
        </group>
        <group ref={rightLeg} position={[build.hips, 0.55, 0]}>
          <mesh position={[0, -0.27, 0]} castShadow>
            <capsuleGeometry args={[0.1, 0.36, 4, 10]} />
            <meshStandardMaterial color={look.pants} />
          </mesh>
        </group>
        <mesh position={[0, 0.98, 0]} castShadow>
          <capsuleGeometry args={[build.torso, 0.4, 6, 14]} />
          <meshStandardMaterial color={look.shirt} />
        </mesh>
        <group ref={leftArm} position={[-build.shoulders, 1.36, 0]}>
          <mesh position={[0, -0.28, 0]} castShadow>
            <capsuleGeometry args={[build.arm, 0.42, 4, 10]} />
            <meshStandardMaterial color={look.shirt} />
          </mesh>
        </group>
        <group ref={rightArm} position={[build.shoulders, 1.36, 0]}>
          <mesh position={[0, -0.28, 0]} castShadow>
            <capsuleGeometry args={[build.arm, 0.42, 4, 10]} />
            <meshStandardMaterial color={look.shirt} />
          </mesh>
        </group>
        <group ref={head} position={[0, 1.45, 0]}>
          <mesh position={[0, 0.21, 0]} castShadow>
            <sphereGeometry args={[0.21, 20, 16]} />
            <meshStandardMaterial color={look.skin} />
          </mesh>
          {[-0.075, 0.075].map((eyeX) => (
            <mesh key={eyeX} position={[eyeX, 0.23, 0.19]}>
              <sphereGeometry args={[0.028, 10, 8]} />
              <meshStandardMaterial color="#1a1a1a" />
            </mesh>
          ))}
          <mesh position={[0, 0.23, -0.01]} rotation={[build.hairTilt, 0, 0]} castShadow>
            <sphereGeometry args={[0.225, 20, 16, 0, Math.PI * 2, 0, build.hairline]} />
            <meshStandardMaterial color={look.hair} />
          </mesh>
          {build.longHair && (
            <mesh position={[0, 0.1, -0.1]} castShadow>
              <capsuleGeometry args={[0.17, 0.22, 4, 12]} />
              <meshStandardMaterial color={look.hair} />
            </mesh>
          )}
        </group>
      </group>
    </group>
  );
}
