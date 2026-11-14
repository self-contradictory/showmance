import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect } from "react";

export function Count({ value }: { value: number }) {
  const shown = useMotionValue(value);
  const text = useTransform(shown, (current) => Math.round(current).toLocaleString("en-US"));
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      shown.set(value);
      return;
    }
    const controls = animate(shown, value, { duration: 0.8, ease: "easeOut" });
    return () => controls.stop();
  }, [shown, value, reduced]);

  return <motion.span>{text}</motion.span>;
}
