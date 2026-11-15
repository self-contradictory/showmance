export type StreamEvent = { type: string; data: string; id: string | null };

export class EventParser {
  private buffer = "";
  private type = "message";
  private data: string[] = [];
  private id: string | null = null;

  push(text: string): StreamEvent[] {
    this.buffer += text;
    const cut = this.buffer.endsWith("\r") ? this.buffer.length - 1 : this.buffer.length;
    const lines = this.buffer.slice(0, cut).split(/\r\n|\r|\n/);
    this.buffer = (lines.pop() ?? "") + this.buffer.slice(cut);
    const events: StreamEvent[] = [];
    for (const line of lines) {
      if (line === "") {
        if (this.data.length) events.push({ type: this.type, data: this.data.join("\n"), id: this.id });
        this.type = "message";
        this.data = [];
        this.id = null;
        continue;
      }
      if (line.startsWith(":")) continue;
      const colon = line.indexOf(":");
      const field = colon < 0 ? line : line.slice(0, colon);
      const value = colon < 0 ? "" : line.slice(colon + 1).replace(/^ /, "");
      if (field === "event") this.type = value;
      else if (field === "data") this.data.push(value);
      else if (field === "id") this.id = value;
    }
    return events;
  }
}
