export type RoomKind = "pool" | "kitchen" | "bedroom" | "living" | "bar" | "beach" | "deck" | "room";

const KEYWORDS: [RoomKind, string[]][] = [
  ["pool", ["pool"]],
  ["kitchen", ["kitchen"]],
  ["bedroom", ["bed", "sleep", "cabin"]],
  ["living", ["living", "lounge", "fire"]],
  ["bar", ["bar", "club"]],
  ["beach", ["beach", "shore", "sand"]],
  ["deck", ["deck", "terrace", "garden", "patio", "balcony"]],
];

const OUTDOOR: ReadonlySet<RoomKind> = new Set(["pool", "beach", "deck"]);

export function roomKind(name: string): RoomKind {
  const lower = name.toLowerCase();
  return KEYWORDS.find(([, words]) => words.some((word) => lower.includes(word)))?.[0] ?? "room";
}

export function isOutdoor(kind: RoomKind): boolean {
  return OUTDOOR.has(kind);
}
