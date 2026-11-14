import { useState } from "react";
import { MAX_MESSAGE_LENGTH } from "@/show/types";

export function ChatInput({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState("");

  return (
    <form
      className="min-w-0 flex-1"
      onSubmit={(event) => {
        event.preventDefault();
        const message = text.trim();
        if (!message) return;
        onSend(message);
        setText("");
      }}
    >
      <input
        value={text}
        onChange={(event) => setText(event.target.value)}
        maxLength={MAX_MESSAGE_LENGTH}
        placeholder="Send a message"
        aria-label="Send a message"
        autoComplete="off"
        enterKeyHint="send"
        className="h-10 w-full rounded-md bg-surface px-3 text-sm ring-1 ring-line outline-none placeholder:text-muted focus:ring-muted"
      />
    </form>
  );
}
