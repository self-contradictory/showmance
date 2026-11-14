import type { Gender, Sky } from "@/show/types";
import type { Vec3 } from "./layout";

export const MATERIAL = {
  wall: "#f3eee8",
  tile: "#ebe6de",
  carpet: "#dccfc2",
  wood: "#c49a72",
  woodDark: "#7a5a45",
  sand: "#ead6ad",
  water: "#4fb7c5",
  white: "#f7f5f1",
  stone: "#b9b2aa",
  steel: "#dfe3e6",
  counterTop: "#3a3a3a",
  fabric: "#8fa3b8",
  blanket: "#d9a0ad",
  leaf: "#5f8f5a",
  trunk: "#9a7454",
  flame: "#ff9a3c",
  glow: "#ffd9a0",
} as const;

export type SkyPreset = {
  background: string;
  ground: string;
  hemiSky: string;
  hemiGround: string;
  hemi: number;
  sun: string;
  sunIntensity: number;
  sunPosition: Vec3;
  lamps: number;
};

export const SKIES: Record<Sky, SkyPreset> = {
  day: {
    background: "#bfe1ee",
    ground: "#cfe0b8",
    hemiSky: "#ffffff",
    hemiGround: "#d8c9ae",
    hemi: 1.1,
    sun: "#fff3e0",
    sunIntensity: 2.4,
    sunPosition: [8, 14, 10],
    lamps: 0,
  },
  sunset: {
    background: "#f2b49b",
    ground: "#d9b693",
    hemiSky: "#ffd7c2",
    hemiGround: "#8a6a5a",
    hemi: 0.9,
    sun: "#ffb27a",
    sunIntensity: 2.2,
    sunPosition: [-12, 6, 8],
    lamps: 0.6,
  },
  night: {
    background: "#121829",
    ground: "#1c2235",
    hemiSky: "#8090c8",
    hemiGround: "#2a2e40",
    hemi: 0.8,
    sun: "#9fb2ff",
    sunIntensity: 0.6,
    sunPosition: [-6, 12, 6],
    lamps: 1.6,
  },
  snow: {
    background: "#dbe6ef",
    ground: "#f4f7fa",
    hemiSky: "#ffffff",
    hemiGround: "#b9c6d3",
    hemi: 1,
    sun: "#eaf2ff",
    sunIntensity: 1.6,
    sunPosition: [6, 12, 8],
    lamps: 0.8,
  },
};

const SHIRTS = ["#3f6fb5", "#f0a43a", "#3a9d7a", "#8a5bd6", "#e46b4f", "#2f2f2f", "#f4f1ea", "#d65a8a"];
const PANTS = ["#2c3e50", "#4a4a4a", "#d9cbb3", "#5a6b7d", "#1f1f1f"];
const SKIN = ["#f1c7a5", "#e0ac86", "#c68a63", "#9a6444", "#6e4630"];
const HAIR = ["#2b1d14", "#5a3a22", "#b8803e", "#141414", "#d9b46c", "#7a2e1f"];

function hash(text: string): number {
  let h = 0;
  for (const char of text) h = (h * 31 + char.charCodeAt(0)) >>> 0;
  return h;
}

export type Build = {
  torso: number;
  shoulders: number;
  arm: number;
  hips: number;
  hairline: number;
  hairTilt: number;
  longHair: boolean;
};

const BUILDS: Record<Gender, Build> = {
  female: { torso: 0.24, shoulders: 0.31, arm: 0.068, hips: 0.11, hairline: Math.PI / 2.1, hairTilt: 0, longHair: true },
  male: { torso: 0.28, shoulders: 0.37, arm: 0.085, hips: 0.13, hairline: Math.PI / 2.5, hairTilt: -0.4, longHair: false },
};

export type Look = { shirt: string; pants: string; skin: string; hair: string; build: Build };

export function lookFor(id: string, index: number, gender?: Gender): Look {
  const h = hash(id);
  return {
    shirt: SHIRTS[index % SHIRTS.length]!,
    pants: PANTS[h % PANTS.length]!,
    skin: SKIN[(h >> 3) % SKIN.length]!,
    hair: HAIR[(h >> 6) % HAIR.length]!,
    build: BUILDS[gender ?? ((h >> 9) % 2 === 0 ? "female" : "male")],
  };
}
