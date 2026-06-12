import type { MetadataRoute } from "next";

// Web App Manifest — makes Yuval Fit OS installable ("Add to Home screen")
// from Chrome on Android. Next.js serves this at /manifest.webmanifest and
// auto-injects the <link rel="manifest"> tag.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Yuval Fit OS",
    short_name: "Fit OS",
    description: "מערכת אישית לניהול אימונים, תרגילים ותזונה",
    lang: "he",
    dir: "rtl",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#06080c",
    theme_color: "#06080c",
    categories: ["health", "fitness", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
