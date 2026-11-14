import { useState } from "react";
import { writeStored } from "@/lib/storage";

export type Theme = "light" | "dark";

const STORAGE_KEY = "showmance:theme";

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(currentTheme);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    setTheme(next);
    writeStored(STORAGE_KEY, next);
  }

  return { theme, toggle };
}
