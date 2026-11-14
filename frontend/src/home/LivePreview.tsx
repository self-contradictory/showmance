import { AnimatePresence, motion } from "motion/react";
import { useShow } from "@/show/useShow";

export function LivePreview({ slug }: { slug: string }) {
  const { show } = useShow(slug);

  return (
    <AnimatePresence>
      {show.caption && (
        <motion.p
          key={show.caption.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute inset-x-0 bottom-4 mx-auto w-fit max-w-[85%] rounded-lg bg-overlay px-3 py-1.5 text-center text-sm leading-snug"
        >
          <span className="font-semibold">{show.caption.speaker}:</span> {show.caption.text}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
