import { useCallback, useEffect, useState } from "react";
import { readStored, writeStored } from "./storage";

export function useHint(key: string, delayMs = 0): [boolean, () => void] {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (readStored(key) === "seen") return;
    const timer = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(timer);
  }, [key, delayMs]);

  const dismiss = useCallback(() => {
    writeStored(key, "seen");
    setVisible(false);
  }, [key]);

  return [visible, dismiss];
}
