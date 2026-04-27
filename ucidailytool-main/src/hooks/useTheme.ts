import { useState, useEffect } from "react";

export type Theme = "high-contrast" | "dark" | "light";

const THEME_KEY = "icu-theme";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem(THEME_KEY) as Theme) || "high-contrast";
    } catch {
      return "high-contrast";
    }
  });

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
  }, [theme]);

  return { theme, setTheme };
}
