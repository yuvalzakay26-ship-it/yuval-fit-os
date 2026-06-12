"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { ThemePreference } from "@/lib/fitness-types";
import { updateSettings, useSettings } from "@/lib/fitness-store";

interface ThemeContextValue {
  theme: ThemePreference;
  /** The actually-applied appearance after resolving "system". */
  resolved: "light" | "dark";
  setTheme: (theme: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function subscribeSystem(callback: () => void): () => void {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function useSystemDark(): boolean {
  return useSyncExternalStore(
    subscribeSystem,
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
    () => false,
  );
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const settings = useSettings();
  const systemDark = useSystemDark();

  const theme = settings.theme;
  const resolved: "light" | "dark" =
    theme === "system" ? (systemDark ? "dark" : "light") : theme;

  // Apply the resolved appearance to the DOM (external-system sync).
  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolved === "dark");
  }, [resolved]);

  const setTheme = useCallback(
    (next: ThemePreference) => {
      updateSettings({ ...settings, theme: next });
    },
    [settings],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolved, setTheme }),
    [theme, resolved, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

/**
 * Inline script string that applies the saved theme before paint to avoid a
 * flash of the wrong theme. Injected in <head> in the root layout.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem('yfos:settings');var t=s?JSON.parse(s).theme:'system';if(!t)t='system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;
