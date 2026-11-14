import { API_URL } from "./config";
import type {
  ChatMessage,
  PollView,
  Twist,
  Viewer,
  ViewerSession,
  WorldEvent,
  WorldSummary,
  WorldView,
} from "./types";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

type Options = { method?: "GET" | "POST"; body?: unknown; token?: string };

async function request<T>(path: string, { method = "GET", body, token }: Options = {}): Promise<T> {
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (body !== undefined) headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new ApiError(response.status, await response.text());
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  worlds: () => request<WorldSummary[]>("/worlds"),
  world: (worldId: number) => request<WorldView>(`/worlds/${worldId}`),
  events: (worldId: number) => request<WorldEvent[]>(`/worlds/${worldId}/events`),
  streamUrl: (worldId: number, afterId: number) => `${API_URL}/worlds/${worldId}/stream?after_id=${afterId}`,
  poll: (worldId: number) => request<PollView | null>(`/worlds/${worldId}/poll`),
  vote: (worldId: number, option: number, token: string) =>
    request<void>(`/worlds/${worldId}/poll/vote`, { method: "POST", body: { option }, token }),
  dropTwist: (worldId: number, text: string, token: string) =>
    request<Twist>(`/worlds/${worldId}/twists`, { method: "POST", body: { text }, token }),
  twist: (worldId: number, twistId: number) => request<Twist>(`/worlds/${worldId}/twists/${twistId}`),
  join: (name: string) => request<ViewerSession>("/viewers", { method: "POST", body: { name } }),
  me: (token: string) => request<Viewer>("/viewers/me", { token }),
  chat: (worldId: number) => request<ChatMessage[]>(`/worlds/${worldId}/chat`),
  sendChat: (worldId: number, text: string, token: string) =>
    request<ChatMessage>(`/worlds/${worldId}/chat`, { method: "POST", body: { text }, token }),
  audioUrl: (worldId: number, eventId: number) => `${API_URL}/worlds/${worldId}/events/${eventId}/audio`,
};
