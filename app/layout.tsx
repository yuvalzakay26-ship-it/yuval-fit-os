import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { ThemeProvider, THEME_INIT_SCRIPT } from "@/components/ThemeProvider";
import { AppShell } from "@/components/layout/AppShell";
import { WelcomeGate } from "@/components/welcome/WelcomeGate";
import { WELCOME_INIT_SCRIPT } from "@/lib/welcome";
import { PrivateAccessNotice } from "@/components/access/PrivateAccessNotice";
import { PRIVATE_ACCESS_INIT_SCRIPT } from "@/lib/private-access";
import { BetaAuthGate } from "@/components/access/BetaAuthGate";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

const heebo = Heebo({
  variable: "--font-app-sans",
  subsets: ["hebrew", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Yuval Fit OS",
  description: "מערכת אישית לניהול אימונים, תרגילים ותזונה",
  applicationName: "Yuval Fit OS",
  // App-like install metadata. Icons (favicon + apple-touch) are picked up
  // automatically from app/icon.png and app/apple-icon.png; the manifest link
  // is injected automatically from app/manifest.ts.
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Fit OS" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Let content extend into the safe areas (notch / home indicator); the app
  // already pads with env(safe-area-inset-*).
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6f9" },
    { media: "(prefers-color-scheme: dark)", color: "#06080c" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Apply saved theme before paint to avoid a flash of the wrong theme. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {/* Hide the welcome screen before paint for returning users. */}
        <script dangerouslySetInnerHTML={{ __html: WELCOME_INIT_SCRIPT }} />
        {/* Hide the private-access notice before paint within an accepted session. */}
        <script
          dangerouslySetInnerHTML={{ __html: PRIVATE_ACCESS_INIT_SCRIPT }}
        />
      </head>
      <body className="min-h-dvh">
        <ThemeProvider>
          {/* Gate order (highest z-index seen first): the private-access notice
              (z-110) sits above the Supabase beta auth gate (z-108), which sits
              above the welcome screen (z-100). Accepting the notice reveals the
              beta gate; signing in with an approved email reveals the welcome
              screen for new users, then the app.

              The Supabase beta auth gate is the REAL access boundary for the
              beta. The legacy client-side admin access-code gate
              (components/access/AdminAccessCodeGate.tsx) is retained in the repo
              as a development-only fallback reference but is intentionally no
              longer part of the production gate chain — see
              docs/BETA_ACCESS_SYSTEM.md. */}
          <PrivateAccessNotice>
            <BetaAuthGate>
              <WelcomeGate>
                <AppShell>{children}</AppShell>
              </WelcomeGate>
            </BetaAuthGate>
          </PrivateAccessNotice>
        </ThemeProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
