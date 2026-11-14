import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

export function EventRow({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="my-1.5 rounded-2xl bg-accent/10 px-3 py-2 text-sm leading-5 motion-safe:animate-flash">
      <p className="flex items-center gap-1.5 font-semibold">
        <Sparkles size={14} className="shrink-0 text-accent" aria-hidden />
        {title}
      </p>
      <p>{children}</p>
    </div>
  );
}
