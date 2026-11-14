import { useEffect, useState, type RefObject } from "react";

const supported = typeof document !== "undefined" && document.fullscreenEnabled;

export function useFullscreen(ref: RefObject<HTMLElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === ref.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [ref]);

  function toggle() {
    if (!supported) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void ref.current?.requestFullscreen();
  }

  return { isFullscreen, toggle, supported };
}
