import { API_HEADERS } from "./config";
import { EventParser, type StreamEvent } from "./events";

const RETRY_MS = 2000;

type Handlers = { onOpen?: () => void; onEvent: (event: StreamEvent) => void };

export function openEventStream(url: string, { onOpen, onEvent }: Handlers): () => void {
  const abort = new AbortController();
  let lastId: string | null = null;

  async function listen() {
    const headers = new Headers(API_HEADERS);
    headers.set("Accept", "text/event-stream");
    if (lastId) headers.set("Last-Event-ID", lastId);
    const response = await fetch(url, { headers, cache: "no-store", signal: abort.signal });
    if (!response.ok || !response.body) throw new Error(`stream answered ${response.status}`);
    onOpen?.();
    const parser = new EventParser();
    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
    for (;;) {
      const { value, done } = await reader.read();
      if (done) return;
      for (const event of parser.push(value)) {
        if (event.id) lastId = event.id;
        onEvent(event);
      }
    }
  }

  void (async () => {
    while (!abort.signal.aborted) {
      await listen().catch(() => {});
      if (abort.signal.aborted) return;
      await new Promise((resolve) => setTimeout(resolve, RETRY_MS));
    }
  })();

  return () => abort.abort();
}
