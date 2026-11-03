import type { MetadataRoute } from "next";

// Makes DevPulse installable ("Add to home screen" / "Install app") with its own window and icon.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DevPulse — tech news for builders",
    short_name: "DevPulse",
    description: "AI, system design, DevOps, security and engineering news, trending repos and releases.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0b0f",
    theme_color: "#0b0b0f",
    icons: [
      { src: "/pwa/192", sizes: "192x192", type: "image/png" },
      { src: "/pwa/512", sizes: "512x512", type: "image/png" },
      { src: "/pwa/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "For you", url: "/for-you" },
      { name: "Release radar", url: "/releases" },
      { name: "Weekly digest", url: "/digest" },
    ],
  };
}
