import { useState } from "react";

export type Theme = "light" | "dark";

// index.html reads the same key before the page paints, so a saved
// light theme doesn't flash dark on load.
const STORAGE_KEY = "showmance:theme";

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

/** The color theme, saved in this browser. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(currentTheme);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    setTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage is blocked (private mode). The choice lasts until reload.
    }
  }

  return { theme, toggle };
}
