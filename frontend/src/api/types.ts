export type World = {
  id: number;
  name: string;
  setting: string;
  thumbnail_url: string | null;
  home: string | null;
  tick: number;
  day: number;
};

export type WorldSummary = { world: World; running: boolean; viewers: number };

export type Place = { id: number; world_id: number; name: string; description: string };

export type Agent = {
  id: number;
  world_id: number;
  name: string;
  persona: string;
  location_id: number;
  mood: string;
  gender: "female" | "male" | null;
};

export type WorldView = {
  world: World;
  locations: Place[];
  agents: Agent[];
  running: boolean;
  viewers: number;
};

export type WorldEvent = {
  id: number;
  world_id: number;
  tick: number;
  kind: string;
  actor_id: number | null;
  target_id: number | null;
  location_id: number | null;
  text: string | null;
  data: Record<string, unknown>;
};

export type Poll = {
  id: number;
  question: string;
  options: { label: string; twist: string }[];
  opened_tick: number;
  closes_tick: number;
  status: "open" | "closed";
  winner: number | null;
};

export type PollView = { poll: Poll; votes: number[] };

export type Viewer = { id: number; name: string; coins: number };

export type ChatMessage = { id: number; world_id: number; viewer_id: number; name: string; text: string };

export type ViewerSession = { viewer: Viewer; token: string };

export type Twist = {
  id: number;
  text: string;
  source: "vote" | "donation";
  status: "pending" | "staged" | "rejected";
  outcome: string | null;
};

export type CoinPack = { id: string; coins: number; price_cents: number };

export type CoinShop = { currency: string; packs: CoinPack[] };

export type Checkout = { id: string; client_secret: string };
