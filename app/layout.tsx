import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { ThemeProvider, THEME_INIT_SCRIPT } from "@/components/ThemeProvider";
import { AppShell } from "@/components/layout/AppShell";
import { AccessGate } from "@/components/access/AccessGate";
import { ACCESS_INIT_SCRIPT } from "@/lib/access";
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
        {/* Hide the access gate before paint for already-granted users. */}
        <script dangerouslySetInnerHTML={{ __html: ACCESS_INIT_SCRIPT }} />
      </head>
      <body className="min-h-dvh">
        <ThemeProvider>
          <AccessGate>
            <AppShell>{children}</AppShell>
          </AccessGate>
        </ThemeProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
