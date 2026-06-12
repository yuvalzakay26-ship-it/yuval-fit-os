"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-surface/85 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="ניווט ראשי"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-1.5 py-1.5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className="tap group flex flex-col items-center gap-1 pb-1 pt-1.5"
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={cn(
                    "flex h-9 w-14 items-center justify-center rounded-2xl transition-colors",
                    active
                      ? "bg-[color:var(--accent-soft)] text-accent"
                      : "text-faint group-hover:text-muted",
                  )}
                >
                  <Icon className="h-[22px] w-[22px]" />
                </span>
                <span
                  className={cn(
                    "text-[10.5px] font-semibold tracking-tight transition-colors",
                    active ? "text-accent" : "text-faint group-hover:text-muted",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
