"use client";

import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";
import { MoonIcon, SettingsIcon, SunIcon } from "@/components/ui/icons";

export function Header() {
  const { resolved, setTheme } = useTheme();
  const toggleTheme = () => setTheme(resolved === "dark" ? "light" : "dark");

  return (
    <header className="sticky top-0 z-30">
      <div
        className="border-b border-border/70 bg-surface/80 backdrop-blur-xl"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex h-[58px] max-w-md items-center justify-between px-4">
          <Link href="/" className="tap flex items-center gap-2.5">
            <span className="brand-gradient flex h-9 w-9 items-center justify-center rounded-[0.7rem] text-[15px] font-black text-[color:var(--accent-contrast)] shadow-glow">
              Y
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-[15px] font-extrabold tracking-tight text-foreground">
                Fit OS
              </span>
              <span className="mt-0.5 text-[10px] font-medium tracking-wide text-faint">
                המערכת האישית שלך
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleTheme}
              className="tap flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-surface-2 text-muted hover:text-foreground"
              aria-label="החלפת מצב תצוגה"
            >
              {resolved === "dark" ? (
                <SunIcon className="h-[18px] w-[18px]" />
              ) : (
                <MoonIcon className="h-[18px] w-[18px]" />
              )}
            </button>
            <Link
              href="/settings"
              className="tap flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-surface-2 text-muted hover:text-foreground"
              aria-label="הגדרות"
            >
              <SettingsIcon className="h-[18px] w-[18px]" />
            </Link>
          </div>
        </div>
      </div>
      {/* Hairline accent glow under the header. */}
      <div className="h-px bg-gradient-to-l from-transparent via-accent/30 to-transparent" />
    </header>
  );
}
