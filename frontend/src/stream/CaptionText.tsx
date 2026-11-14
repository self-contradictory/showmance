import type { Caption } from "@/show/types";

export function CaptionText({ caption }: { caption: Caption }) {
  if (caption.touch) {
    return (
      <span className="italic">
        {caption.touch === "hug" ? "🤗" : "💋"} <span className="font-semibold">{caption.speaker}</span> {caption.text}
      </span>
    );
  }
  return (
    <>
      <span className="font-semibold">{caption.speaker}:</span> {caption.text}
    </>
  );
}
