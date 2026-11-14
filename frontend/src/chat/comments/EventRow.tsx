import type { ReactNode } from "react";

/** Shared look for things that happened in the show, as opposed to messages. */
export function EventRow({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="my-1.5 rounded-md bg-accent/10 px-2.5 py-2 text-sm leading-5 motion-safe:animate-flash">
      <p className="font-medium text-accent">✦ {title}</p>
      <p>{children}</p>
    </div>
  );
}
