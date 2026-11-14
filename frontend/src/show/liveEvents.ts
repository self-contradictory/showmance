import { api } from "@/api/client";
import type { Agent, ChatMessage, Place, WorldEvent } from "@/api/types";
import type { ChatComment } from "@/chat/comments/types";
import type { BeatPart } from "./beats";
import type { CastMember, Location, Sky } from "./types";

export type Names = { agents: Map<number, string>; places: Map<number, string> };

export type LiveAction =
  | BeatPart
  | { type: "twist"; twistId: number | null; text: string }
  | { type: "pollOpened" }
  | { type: "pollClosed"; winner: string; winnerIndex: number | null }
  | { type: "pollCancelled" }
  | { type: "castChanged" };

export function namesFor(agents: Agent[], places: Place[]): Names {
  return {
    agents: new Map(agents.map((agent) => [agent.id, agent.name])),
    places: new Map(places.map((place) => [place.id, place.name])),
  };
}

function numberField(data: Record<string, unknown>, key: string): number | null {
  const value = data[key];
  return typeof value === "number" ? value : null;
}

export function actionsFor(event: WorldEvent, names: Names): LiveAction[] {
  const actor = event.actor_id === null ? undefined : names.agents.get(event.actor_id);
  const target = event.target_id === null ? undefined : names.agents.get(event.target_id);
  const destination = numberField(event.data, "destination_id");

  switch (event.kind) {
    case "say":
    case "confess":
      if (!event.text || event.actor_id === null) return [];
      return [
        {
          type: "speech",
          caption: {
            id: `event-${event.id}`,
            speakerId: String(event.actor_id),
            speaker: actor ?? "Someone",
            text: event.text,
            locationId: String(event.location_id ?? ""),
            targetId: event.kind === "say" && event.target_id !== null ? String(event.target_id) : undefined,
            audio: api.audioUrl(event.world_id, event.id),
          },
        },
      ];
    case "move":
    case "relocate": {
      const movedId = event.kind === "move" ? event.actor_id : event.target_id;
      if (movedId === null || destination === null) return [];
      return [
        {
          type: "move",
          move: {
            castId: String(movedId),
            name: (event.kind === "move" ? actor : target) ?? "Someone",
            locationId: String(destination),
            place: names.places.get(destination) ?? "next room",
          },
        },
      ];
    }
    case "hug":
    case "kiss":
      if (!actor || !target || event.actor_id === null || event.target_id === null) return [];
      return [
        {
          type: "touch",
          touching: {
            id: `event-${event.id}`,
            kind: event.kind,
            actorId: String(event.actor_id),
            actor,
            targetId: String(event.target_id),
            target,
            locationId: String(event.location_id ?? ""),
          },
        },
      ];
    case "announce":
      return event.text ? [{ type: "headline", text: event.text }] : [];
    case "arrive":
      return [{ type: "castChanged" }, { type: "headline", text: "Someone new just walked in" }];
    case "twist":
      if (!event.text) return [];
      return [
        { type: "twist", twistId: numberField(event.data, "twist_id"), text: event.text },
        { type: "headline", text: `Twist: ${event.text}` },
      ];
    case "poll_opened":
      return [{ type: "pollOpened" }];
    case "poll_cancelled":
      return [{ type: "pollCancelled" }];
    case "poll_closed":
      return [{ type: "pollClosed", winner: event.text ?? "", winnerIndex: numberField(event.data, "winner") }];
    default:
      return [];
  }
}

export function chatComment(message: ChatMessage): ChatComment {
  return { kind: "message", id: `chat-${message.id}`, at: Date.now(), author: message.name, text: message.text };
}

export function skyFor(setting: string): Sky {
  const text = setting.toLowerCase();
  if (/snow|ski|winter|chalet|cabin/.test(text)) return "snow";
  if (/night|club|city/.test(text)) return "night";
  if (/beach|bali|island|tropic|resort|villa|summer/.test(text)) return "sunset";
  return "day";
}

export function locationsFor(places: Place[]): Location[] {
  return places.map((place) => ({ id: String(place.id), name: place.name }));
}

export function castFor(agents: Agent[], moved: Record<string, string>): CastMember[] {
  return agents.map((agent) => ({
    id: String(agent.id),
    name: agent.name,
    role: agent.persona.split(".")[0]?.trim() ?? "",
    locationId: moved[String(agent.id)] ?? String(agent.location_id),
  }));
}
