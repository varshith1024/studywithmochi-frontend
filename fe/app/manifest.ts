import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "StudyWithMochi",
    short_name: "Mochi",
    description: "Study a little. Grow with Mochi.",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "landscape",
    background_color: "#1e1233",
    theme_color: "#1e1233",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}