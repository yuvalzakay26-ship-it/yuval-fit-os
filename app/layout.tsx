import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { ThemeProvider, THEME_INIT_SCRIPT } from "@/components/ThemeProvider";
import { AppShell } from "@/components/layout/AppShell";
import { WelcomeGate } from "@/components/welcome/WelcomeGate";
import { WELCOME_INIT_SCRIPT } from "@/lib/welcome";
import { PrivateAccessNotice } from "@/components/access/PrivateAccessNotice";
import { PRIVATE_ACCESS_INIT_SCRIPT } from "@/lib/private-access";
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
          {/* Gate order: the private-access notice sits above the welcome screen
              (higher z-index) so it is seen first; accepting it reveals the
              welcome screen for new users, then the app. */}
          <PrivateAccessNotice>
            <WelcomeGate>
              <AppShell>{children}</AppShell>
            </WelcomeGate>
          </PrivateAccessNotice>
        </ThemeProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
