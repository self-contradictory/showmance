import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "@/api/client";
import type { ViewerSession } from "@/api/types";
import { loadGuestName } from "@/lib/guestName";
import { readStored, writeStored } from "@/lib/storage";

const TOKEN_KEY = "showmance:token";

async function loadSession(): Promise<ViewerSession> {
  const token = readStored(TOKEN_KEY);
  if (token) {
    try {
      return { token, viewer: await api.me(token) };
    } catch (error) {
      if (!(error instanceof ApiError) || error.status >= 500) throw error;
    }
  }
  const session = await api.join(loadGuestName());
  writeStored(TOKEN_KEY, session.token);
  return session;
}

export function useViewer() {
  return useQuery({ queryKey: ["viewer"], queryFn: loadSession, staleTime: 30_000 });
}
