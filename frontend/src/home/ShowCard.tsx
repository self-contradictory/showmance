import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Link } from "wouter";
import type { ShowSummary } from "@/show/types";
import { ShowArt } from "@/ui/ShowArt";
import { LivePreview } from "./LivePreview";

export function ShowCard({ show }: { show: ShowSummary }) {
  const [previewing, setPreviewing] = useState(false);

  return (
    <Link
      href={`/${show.slug}`}
      onPointerEnter={(event) => event.pointerType === "mouse" && setPreviewing(true)}
      onPointerLeave={() => setPreviewing(false)}
      onFocus={() => setPreviewing(true)}
      onBlur={() => setPreviewing(false)}
      className="block rounded-2xl"
    >
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-stage text-on-overlay">
        <ShowArt title={show.title} cover={show.cover} />
        {previewing && <LivePreview slug={show.slug} />}
        {show.viewers !== undefined && (
          <p className="absolute top-3 left-3 rounded-md bg-overlay px-2 py-1 text-xs font-medium tabular-nums">
            {show.viewers.toLocaleString("en-US")} watching
          </p>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2.5">
        <h2 className="text-lg font-semibold">{show.title}</h2>
        {show.day !== undefined && <span className="text-sm text-muted">Day {show.day}</span>}
      </div>

      <div className="mt-0.5 min-h-10">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={show.now}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="line-clamp-2 text-sm text-muted"
          >
            {show.now}
          </motion.p>
        </AnimatePresence>
      </div>
    </Link>
  );
}
