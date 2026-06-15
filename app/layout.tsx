import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { ThemeProvider, THEME_INIT_SCRIPT } from "@/components/ThemeProvider";
import { AppShell } from "@/components/layout/AppShell";
import { WelcomeGate } from "@/components/welcome/WelcomeGate";
import { WELCOME_INIT_SCRIPT } from "@/lib/welcome";
import { BetaWelcomeNotice } from "@/components/access/BetaWelcomeNotice";
import { BETA_WELCOME_INIT_SCRIPT } from "@/lib/beta-welcome";
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
        {/* Hide the beta welcome notice before paint for testers who saw it. */}
        <script
          dangerouslySetInnerHTML={{ __html: BETA_WELCOME_INIT_SCRIPT }}
        />
      </head>
      <body className="min-h-dvh">
        <ThemeProvider>
          {/* Gate order (highest z-index seen first): the Supabase beta auth
              gate (z-108) is the REAL access boundary — sign in with an approved
              email, or continue as a local guest. Once the user is in, the
              friendly beta welcome notice (z-104) greets them once, and finally
              the first-visit welcome screen (z-100) sits above the app.

              The old "private system / do not share the link" notice
              (PrivateAccessNotice) was removed from this chain: access is now
              controlled by login + approved emails, so the onboarding message is
              a warm beta welcome, not a security warning — see
              docs/BETA_WELCOME_NOTICE.md. The legacy admin access-code gate
              (components/access/AdminAccessCodeGate.tsx) likewise remains in the
              repo only as a dev reference, not in the production chain. */}
          <BetaAuthGate>
            <BetaWelcomeNotice>
              <WelcomeGate>
                <AppShell>{children}</AppShell>
              </WelcomeGate>
            </BetaWelcomeNotice>
          </BetaAuthGate>
        </ThemeProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
