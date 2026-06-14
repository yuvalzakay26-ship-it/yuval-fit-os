"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";
import type { ThemePreference } from "@/lib/fitness-types";
import { updateSettings, useSettings } from "@/lib/fitness-store";

interface ThemeContextValue {
  /** The user's saved appearance — only "light" or "dark" (no "system"). */
  theme: ThemePreference;
  /**
   * The actually-applied appearance. Kept as a distinct field (equal to `theme`)
   * so existing callers like the header toggle keep working unchanged after the
   * "system" mode was removed in Phase 3.xx.
   */
  resolved: "light" | "dark";
  setTheme: (theme: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const settings = useSettings();
  // `settings.theme` is already sanitized to "light" | "dark" on read
  // (see lib/storage.ts), so there is no "system" value to resolve.
  const theme = settings.theme;
  const resolved: "light" | "dark" = theme;

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
 * flash of the wrong theme. Injected in <head> in the root layout. Only "light"
 * and "dark" are supported; any legacy/unknown value (incl. the removed
 * "system") falls back to "light", matching `sanitizeTheme` in `lib/storage.ts`
 * so the pre-paint class and React's first render always agree (no hydration
 * mismatch, no content flash).
 */
export const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem('yfos:settings');var t=s?JSON.parse(s).theme:'light';if(t!=='dark'&&t!=='light')t='light';if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`;
