import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, type RefObject } from "react";
import { Box3, Mesh, Quaternion, Vector3, type Bone, type Object3D } from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { Touch } from "@/show/types";

export type Motion = { walking: boolean; time: number };

type Props = { url: string; motion: RefObject<Motion>; talking: boolean; pose: Touch | null };

const HEIGHT = 1.8;

type Limb = { bone: Bone; tip: Bone; rest: Quaternion };

const LIMBS = {
  leftArm: ["LeftArm", "LeftForeArm"],
  leftForearm: ["LeftForeArm", "LeftHand"],
  rightArm: ["RightArm", "RightForeArm"],
  rightForearm: ["RightForeArm", "RightHand"],
  leftThigh: ["LeftUpLeg", "LeftLeg"],
  leftShin: ["LeftLeg", "LeftFoot"],
  rightThigh: ["RightUpLeg", "RightLeg"],
  rightShin: ["RightLeg", "RightFoot"],
} as const;

type LimbName = keyof typeof LIMBS;

/** A rigged Mixamo character, posed from code: arms down, walking, gesturing, hugging. */
export function Rigged({ url, motion, talking, pose }: Props) {
  const { scene } = useGLTF(url);
  const { body, scale, limbs, head } = useMemo(() => rig(scene), [scene]);

  useFrame(() => {
    const { walking, time } = motion.current;
    body.updateMatrixWorld(true);
    for (const limb of Object.values(limbs)) limb?.bone.quaternion.copy(limb.rest);

    const swing = walking ? Math.sin(time * 9) * 0.55 : 0;
    const holding = walking ? null : pose;
    const gesture = talking && !holding ? Math.sin(time * 5) * 0.25 : 0;
    const arm = (side: 1 | -1, forward: number): Vector3 => {
      if (holding === "hug") return new Vector3(0.25 * side, 0.05, 1);
      if (holding === "kiss") return new Vector3(0.3 * side, -0.45, 0.8);
      return new Vector3(0.22 * side, -1, forward);
    };
    const forearm = (side: 1 | -1, lifted: boolean): Vector3 => {
      if (holding === "hug") return new Vector3(-0.7 * side, 0, 0.7);
      if (holding === "kiss") return new Vector3(-0.4 * side, -0.1, 0.9);
      return lifted ? new Vector3(-0.15 * side, 0.25 + gesture, 1) : new Vector3(0.05 * side, -1, 0.2);
    };

    aimLimb(body, limbs.leftArm, arm(1, -swing * 0.6));
    aimLimb(body, limbs.leftForearm, forearm(1, false));
    aimLimb(body, limbs.rightArm, talking && !holding ? new Vector3(-0.3, -0.55, 0.75) : arm(-1, swing * 0.6));
    aimLimb(body, limbs.rightForearm, forearm(-1, talking));
    aimLimb(body, limbs.leftThigh, new Vector3(0, -1, swing * 0.6));
    aimLimb(body, limbs.leftShin, new Vector3(0, -1, swing * 0.6 - Math.max(0, swing) * 0.9));
    aimLimb(body, limbs.rightThigh, new Vector3(0, -1, -swing * 0.6));
    aimLimb(body, limbs.rightShin, new Vector3(0, -1, -swing * 0.6 - Math.max(0, -swing) * 0.9));

    if (head) {
      head.bone.quaternion.copy(head.rest);
      const nod = holding === "kiss" ? 0.25 : talking ? Math.sin(time * 8) * 0.08 : 0;
      head.bone.rotateX(nod);
    }
  });

  return <primitive object={body} scale={scale} />;
}

function rig(scene: Object3D) {
  const body = clone(scene);
  body.traverse((object) => {
    if (object instanceof Mesh) {
      object.castShadow = true;
      object.frustumCulled = false;
    }
  });
  const height = new Box3().setFromObject(body).getSize(new Vector3()).y || HEIGHT;
  const bones = new Map<string, Bone>();
  body.traverse((object) => {
    if ((object as Bone).isBone) bones.set(object.name.replace(/^mixamorig:?/, ""), object as Bone);
  });
  const limb = ([from, to]: readonly [string, string]): Limb | undefined => {
    const bone = bones.get(from);
    const tip = bones.get(to);
    return bone && tip ? { bone, tip, rest: bone.quaternion.clone() } : undefined;
  };
  const limbs = Object.fromEntries(
    Object.entries(LIMBS).map(([name, pair]) => [name, limb(pair)]),
  ) as Record<LimbName, Limb | undefined>;
  const headBone = bones.get("Head");
  const head = headBone ? { bone: headBone, rest: headBone.quaternion.clone() } : undefined;
  return { body, scale: HEIGHT / height, limbs, head };
}

const boneAt = new Vector3();
const tipAt = new Vector3();
const from = new Vector3();
const to = new Vector3();
const turn = new Quaternion();
const parentTurn = new Quaternion();
const boneTurn = new Quaternion();
const bodyTurn = new Quaternion();

/** Turns a bone so it points along `direction`, given in the character's own frame. */
function aimLimb(body: Object3D, limb: Limb | undefined, direction: Vector3) {
  const parent = limb?.bone.parent;
  if (!limb || !parent) return;
  const { bone, tip } = limb;
  bone.updateMatrixWorld(true);
  from.subVectors(tip.getWorldPosition(tipAt), bone.getWorldPosition(boneAt)).normalize();
  to.copy(direction).normalize().applyQuaternion(body.getWorldQuaternion(bodyTurn));
  turn.setFromUnitVectors(from, to);
  parent.getWorldQuaternion(parentTurn);
  bone.getWorldQuaternion(boneTurn);
  bone.quaternion.copy(parentTurn.invert().multiply(turn.multiply(boneTurn)));
  bone.updateMatrixWorld(true);
}
